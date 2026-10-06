# Architect Study Hub

Base de conocimiento personal de teoría y práctica para arquitectura e ingeniería de software: fundamentos,
diseño, arquitectura, sistemas distribuidos, plataforma (Kubernetes, GitOps, IaC/CaC, edge), inteligencia artificial y cloud (AWS, Azure,
Google Cloud: servicios, costes y certificaciones). Incluye resúmenes con ejemplos de *Código Limpio*,
*Arquitectura Limpia*, *System Design Interview* y *Cracking the Coding Interview*.

## Arrancar

```powershell
./serve.ps1          # crea el venv si no existe; sirve la web en :8000 y el asistente de estudio en :8001
```

## Asistente de estudio (chat con IA)

En todas las páginas aparece una burbuja abajo a la derecha para preguntar dudas a una IA. El asistente recibe como
contexto el contenido de la página que estás leyendo (y el fragmento seleccionado, si lo hay).

1. Consigue una clave **gratuita** de Gemini en [Google AI Studio](https://aistudio.google.com/apikey).
2. Copia `.env.example` como `.env` y pon la clave en `GEMINI_API_KEY` (el fichero `.env` está en `.gitignore`).
3. Arranca con `./serve.ps1` (o, por separado, `.\.venv\Scripts\python chat\server.py`).

Cómo funciona: el navegador habla solo con `chat/server.py`, que escucha únicamente en `127.0.0.1:8001`, añade el
contexto y llama al modelo en streaming. La clave nunca llega al navegador.

| Variable | Valores |
|---|---|
| `CHAT_PROVIDER` | `gemini` (por defecto, capa gratuita) o `anthropic` (Claude, de pago) |
| `CHAT_MODEL` | Por defecto `gemini-3.8-flash`; `gemini-3.5-flash-lite` tiene más cuota gratuita; con Anthropic, `claude-opus-5` |

!!! note
    En la capa gratuita de Gemini hay límites de peticiones por minuto y por día, y Google puede usar las peticiones
    para mejorar sus productos: no pegues en el chat información confidencial.

### Usar el asistente desde la web publicada (github.io)

El asistente sigue siendo un servidor en tu PC; la web publicada solo lo usa en los navegadores donde lo actives:

1. Añade el origen de la web a `.env`: `CHAT_ALLOWED_ORIGINS=http://127.0.0.1:8000,http://localhost:8000,https://toniferr.github.io`.
2. Arranca el servidor (`./serve.ps1` o `.\.venv\Scripts\python chat\server.py`).
3. Abre una vez cualquier página de la web con `?asistente=1` al final de la URL. Tu navegador lo recuerda; con
   `?asistente=0` se desactiva.
4. La burbuja aparece solo cuando el servidor local está encendido. Chrome puede pedir permiso para acceder a la red
   local la primera vez: acéptalo. Los demás visitantes no ven la burbuja ni reciben ningún aviso.

## Publicación en GitHub Pages

El workflow `.github/workflows/pages.yml` genera la web con `mkdocs build --strict` y la publica en cada push a
`main`. Requisito, una sola vez: en el repositorio de GitHub, *Settings → Pages → Build and deployment → Source:
GitHub Actions*. La URL de la web y el enlace al repositorio se configuran solos durante la publicación.

## Estructura

```text
docs/
├── fundamentos/     algoritmos, redes, concurrencia, bases de datos
├── diseno/          SOLID, patrones, testing
├── arquitectura/    estilos, DDD, APIs, ADRs, rol del arquitecto
├── ia/              tipos de IA, LLMs, RAG, agentes, MCP, skills, harnesses, seguridad
├── system-design/   fundamentos y casos resueltos
├── plataforma/      Kubernetes, GitOps, IaC/CaC, edge, observabilidad, CI/CD, seguridad
├── cloud/           AWS, Azure, GCP, equivalencias, costes/FinOps, certificaciones
├── libros/          resúmenes de libros
└── entrevistas/     preguntas de entrevista por temática y simulacro
mkdocs.yml           navegación y configuración
```

Para añadir una página: crea el `.md` en `docs/<tema>/` y añádelo a `nav:` en `mkdocs.yml`.

## Ejercicios

Cada ejercicio sigue esta convención (la solución va plegada dentro del enunciado):

```markdown
!!! exercise "Ejercicio N · Básico|Medio|Avanzado — Título"
    Enunciado.

    ??? success "Solución"
        Explicación.
```

El hook `hooks/ejercicios.py` añade un ancla a cada ejercicio y genera en cada build la página `Ejercicios`
con todos ellos agrupados por nivel.

## Entrevistas y simulacro

`docs/entrevistas/` tiene una página de preguntas por temática y el simulacro. Cada pregunta sigue esta convención
(el `##` anterior es su subtema):

```markdown
??? question "Básico|Medio|Avanzado · ¿Pregunta?"
    Respuesta modelo.

    **Repregunta:** ¿…? — respuesta breve.
```

El hook `hooks/entrevistas.py` añade un ancla a cada pregunta, genera la tabla de recuento de la portada de la
sección e inyecta todas las preguntas como JSON en `entrevistas/simulacro.md`, que usa `docs/assets/simulacro.js`.
Para añadir una temática nueva: crea su página y añádela a `TOPICS` en el hook y a `nav:`.

## Publicar un HTML estático

```powershell
.\.venv\Scripts\mkdocs build     # genera site/
```
