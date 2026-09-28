"""Servidor local del asistente de estudio.

Recibe las preguntas del widget de chat de la web, añade como contexto el contenido de la página que se está leyendo
y las envía a un modelo de IA, devolviendo la respuesta en streaming (Server-Sent Events) al navegador.

Proveedores:
  - gemini (por defecto): API REST de Google Gemini. Tiene capa gratuita (con límites de uso; en esa capa Google
    puede usar las peticiones para mejorar sus productos).
  - anthropic: API de Claude, mediante el SDK oficial.

La clave de API nunca llega al navegador: se lee del entorno o de un fichero `.env` en la raíz del proyecto.
El servidor solo escucha en 127.0.0.1.

Configuración (variables de entorno o `.env`):
  CHAT_PROVIDER         gemini | anthropic (por defecto gemini)
  GEMINI_API_KEY        Clave de Google AI Studio (proveedor gemini)
  ANTHROPIC_API_KEY     Clave de Anthropic (proveedor anthropic)
  CHAT_MODEL            Modelo (por defecto gemini-3.8-flash o claude-opus-5 según el proveedor)
  CHAT_EFFORT           Solo anthropic: low | medium | high | xhigh | max (por defecto medium)
  CHAT_PORT             Puerto (por defecto 8001)
  CHAT_ALLOWED_ORIGINS  Orígenes permitidos, separados por comas (por defecto la web local en el puerto 8000).
                        Para usar el chat desde la web publicada, añade su origen: https://toniferr.github.io
"""
from __future__ import annotations

import json
import os
import pathlib
from collections.abc import Iterator
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import httpx

ROOT = pathlib.Path(__file__).resolve().parent.parent

MAX_PAGE_CHARS = 60_000        # contexto de la página que se envía al modelo
MAX_MESSAGE_CHARS = 8_000      # tamaño máximo de cada mensaje
MAX_HISTORY = 20               # mensajes de la conversación que se reenvían
MAX_BODY_BYTES = 400_000

SYSTEM_INSTRUCTIONS = """\
Eres el asistente de estudio de "Architect Study Hub", una web personal de estudio de arquitectura e ingeniería de
software (fundamentos, diseño, Java y Spring, arquitectura, system design, datos, plataforma, IA y cloud). Quien te
pregunta es un arquitecto de software con experiencia en plataformas GitOps en el edge, Kubernetes, Flux y Java, que
está repasando y ampliando conocimientos.

Cómo responder:
- Responde siempre en español, con claridad y precisión técnica, como un mentor senior.
- Usa el contenido de la página actual (más abajo) como contexto principal. Si la pregunta va más allá de la página,
  respóndela igualmente con tu conocimiento, y si contradice algo de la página, dilo y explica por qué.
- Explica el porqué y los trade-offs, no solo el qué. Usa ejemplos concretos, a ser posible relacionados con
  plataformas, Kubernetes, GitOps o Java, y bloques de código cuando ayuden.
- Si te preguntan por un ejercicio de la página, da primero una pista o el enfoque; da la solución completa solo si la
  piden explícitamente o tras un intento del usuario. Si el usuario propone una solución, revísala con detalle.
- Si no sabes algo o puede estar desactualizado (precios, versiones, certificaciones), dilo y sugiere comprobarlo en la
  fuente oficial.
- Sé conciso por defecto; amplía si te lo piden.
"""


class ChatError(Exception):
    """Error que se muestra tal cual al usuario en el chat."""


def load_dotenv() -> None:
    """Carga variables de un fichero .env en la raíz del proyecto (sin sobrescribir las del entorno)."""
    env_file = ROOT / ".env"
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_dotenv()

PROVIDER = os.environ.get("CHAT_PROVIDER", "gemini").strip().lower()
DEFAULT_MODELS = {"gemini": "gemini-3.8-flash", "anthropic": "claude-opus-5"}
KEY_VARS = {"gemini": "GEMINI_API_KEY", "anthropic": "ANTHROPIC_API_KEY"}
if PROVIDER not in DEFAULT_MODELS:
    raise SystemExit(f"CHAT_PROVIDER no válido: {PROVIDER!r} (usa gemini o anthropic)")

MODEL = os.environ.get("CHAT_MODEL") or DEFAULT_MODELS[PROVIDER]
EFFORT = os.environ.get("CHAT_EFFORT", "medium")
PORT = int(os.environ.get("CHAT_PORT", "8001"))
ALLOWED_ORIGINS = {
    o.strip()
    for o in os.environ.get("CHAT_ALLOWED_ORIGINS", "http://127.0.0.1:8000,http://localhost:8000").split(",")
    if o.strip()
}
KEY_VAR = KEY_VARS[PROVIDER]
API_KEY = os.environ.get(KEY_VAR, "").strip()
CONFIGURED = bool(API_KEY)


# ------------------------------------------------------------------------------------------------------------------
# Proveedores: cada uno recibe (instrucciones, contexto de página, mensajes) y genera fragmentos de texto
# ------------------------------------------------------------------------------------------------------------------

def stream_gemini(instructions: str, page_block: str, messages: list[dict]) -> Iterator[str]:
    """API REST de Gemini con streaming SSE (sin SDK: evita dependencias nativas)."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:streamGenerateContent?alt=sse"
    body = {
        "system_instruction": {"parts": [{"text": instructions}, {"text": page_block}]},
        "contents": [
            {"role": "model" if m["role"] == "assistant" else "user", "parts": [{"text": m["content"]}]}
            for m in messages
        ],
    }
    headers = {"x-goog-api-key": API_KEY, "Content-Type": "application/json"}   # la clave no va en la URL
    try:
        with httpx.stream("POST", url, json=body, headers=headers, timeout=httpx.Timeout(120, connect=10)) as res:
            if res.status_code != 200:
                res.read()
                raise ChatError(gemini_error(res))
            finish = None
            for line in res.iter_lines():
                if not line.startswith("data: "):
                    continue
                chunk = json.loads(line[6:])
                for cand in chunk.get("candidates", []):
                    for part in cand.get("content", {}).get("parts", []):
                        if part.get("text") and not part.get("thought"):   # se omite el razonamiento interno
                            yield part["text"]
                    finish = cand.get("finishReason") or finish
                if chunk.get("promptFeedback", {}).get("blockReason"):
                    raise ChatError("El modelo ha bloqueado la pregunta por sus filtros de seguridad.")
            if finish == "MAX_TOKENS":
                raise ChatError("La respuesta se ha cortado por longitud.")
            if finish in ("SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "RECITATION"):
                raise ChatError("El modelo ha detenido la respuesta por sus filtros de contenido.")
    except httpx.ConnectError:
        raise ChatError("Sin conexión con la API de Gemini. Revisa tu conexión a Internet.")
    except httpx.TimeoutException:
        raise ChatError("La API de Gemini ha tardado demasiado en responder.")


def gemini_error(res: httpx.Response) -> str:
    try:
        err = res.json().get("error", {})
    except ValueError:
        err = {}
    status, message = err.get("status", ""), err.get("message", res.text[:200])
    if res.status_code == 429 or status == "RESOURCE_EXHAUSTED":
        return ("Has alcanzado el límite de la capa gratuita de Gemini (peticiones por minuto o por día). "
                "Espera un poco o usa CHAT_MODEL=gemini-3.5-flash-lite, que tiene más cuota.")
    if res.status_code in (400, 403) and ("API key" in message or status == "PERMISSION_DENIED"):
        return "La clave de Gemini no es válida o no tiene permisos. Revisa GEMINI_API_KEY en .env."
    if res.status_code == 404:
        return f"El modelo {MODEL!r} no existe o no está disponible para tu clave. Revisa CHAT_MODEL."
    return f"Error de la API de Gemini ({res.status_code}): {message}"


def stream_anthropic(instructions: str, page_block: str, messages: list[dict]) -> Iterator[str]:
    """API de Claude con el SDK oficial (se importa solo si se usa este proveedor)."""
    import anthropic

    client = anthropic.Anthropic(api_key=API_KEY)
    system = [
        {"type": "text", "text": instructions},
        {"type": "text", "text": page_block, "cache_control": {"type": "ephemeral"}},   # se reutiliza en la misma página
    ]
    try:
        with client.beta.messages.stream(
            model=MODEL,
            max_tokens=64000,
            system=system,
            messages=messages,
            thinking={"type": "adaptive"},
            output_config={"effort": EFFORT},
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",          # si el modelo rechaza la petición, la API reintenta con el recomendado
        ) as stream:
            yield from stream.text_stream
            final = stream.get_final_message()
        if final.stop_reason == "refusal":
            raise ChatError("El modelo no ha podido responder a esta pregunta.")
        if final.stop_reason == "max_tokens":
            raise ChatError("La respuesta se ha cortado por longitud.")
    except anthropic.AuthenticationError:
        raise ChatError("La clave de Anthropic no es válida.")
    except anthropic.RateLimitError:
        raise ChatError("Límite de uso alcanzado. Espera un poco y vuelve a intentarlo.")
    except anthropic.APIStatusError as e:
        raise ChatError(f"Error de la API de Anthropic ({e.status_code}): {e.message}")
    except anthropic.APIConnectionError:
        raise ChatError("Sin conexión con la API de Anthropic. Revisa tu conexión a Internet.")


PROVIDERS = {"gemini": stream_gemini, "anthropic": stream_anthropic}


# ------------------------------------------------------------------------------------------------------------------
# Validación y servidor HTTP
# ------------------------------------------------------------------------------------------------------------------

def page_block(page_title: str, page_url: str, page_text: str) -> str:
    return (
        f"Página actual: {page_title}\nURL: {page_url}\n\n"
        f"<contenido_de_la_pagina>\n{page_text[:MAX_PAGE_CHARS]}\n</contenido_de_la_pagina>"
    )


def sanitize_messages(raw: list) -> list[dict]:
    """Acepta solo turnos user/assistant de texto, recorta tamaños y garantiza que empiece y acabe en 'user'."""
    messages = []
    for m in raw[-MAX_HISTORY:]:
        role = m.get("role")
        content = m.get("content")
        if role not in ("user", "assistant") or not isinstance(content, str) or not content.strip():
            continue
        messages.append({"role": role, "content": content[:MAX_MESSAGE_CHARS]})
    while messages and messages[0]["role"] != "user":
        messages.pop(0)
    if not messages or messages[-1]["role"] != "user":
        raise ValueError("La conversación debe terminar con una pregunta del usuario.")
    return messages


class ChatHandler(BaseHTTPRequestHandler):
    server_version = "StudyHubChat/2.0"

    def _cors(self) -> None:
        origin = self.headers.get("Origin")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            # Chrome pide permiso explícito cuando una web pública (github.io) llama a una dirección local
            if self.headers.get("Access-Control-Request-Private-Network") == "true":
                self.send_header("Access-Control-Allow-Private-Network", "true")

    def _json(self, status: int, body: dict) -> None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _sse(self, payload: dict) -> None:
        self.wfile.write(f"data: {json.dumps(payload, ensure_ascii=False)}\n\n".encode("utf-8"))
        self.wfile.flush()

    def log_message(self, fmt: str, *args) -> None:   # log breve, sin el contenido de las preguntas
        print(f"[chat] {self.address_string()} {fmt % args}")

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:
        if self.path == "/health":
            self._json(200, {"ok": True, "configured": CONFIGURED, "provider": PROVIDER,
                             "model": MODEL, "key_var": KEY_VAR})
        else:
            self._json(404, {"error": "No encontrado"})

    def do_POST(self) -> None:
        if self.path != "/chat":
            self._json(404, {"error": "No encontrado"})
            return
        if self.headers.get("Origin") not in ALLOWED_ORIGINS:
            self._json(403, {"error": "Origen no permitido"})
            return
        if not CONFIGURED:
            self._json(503, {"error": f"Falta {KEY_VAR}. Añádela a .env y reinicia el servidor."})
            return
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_BODY_BYTES:
            self._json(413, {"error": "Petición vacía o demasiado grande"})
            return
        try:
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            messages = sanitize_messages(body.get("messages", []))
            context = page_block(
                str(body.get("page_title", ""))[:300],
                str(body.get("page_url", ""))[:500],
                str(body.get("page_text", "")),
            )
        except (ValueError, AttributeError, TypeError, UnicodeDecodeError) as e:
            self._json(400, {"error": str(e) or "Petición no válida"})
            return

        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        try:
            for text in PROVIDERS[PROVIDER](SYSTEM_INSTRUCTIONS, context, messages):
                self._sse({"type": "text", "text": text})
            self._sse({"type": "done"})
        except ChatError as e:
            self._sse({"type": "error", "message": str(e)})
        except (BrokenPipeError, ConnectionResetError):
            pass                               # el usuario cerró o canceló la petición


def main() -> None:
    server = ThreadingHTTPServer(("127.0.0.1", PORT), ChatHandler)
    status = f"{PROVIDER} · {MODEL}" if CONFIGURED else f"SIN CLAVE (añade {KEY_VAR} a .env)"
    print(f"[chat] Asistente de estudio en http://127.0.0.1:{PORT} — {status}")
    server.serve_forever()


if __name__ == "__main__":
    main()
