"""Hook de MkDocs: preguntas de entrevista y simulacro.

- Añade un ancla (`pregunta-N`) antes de cada pregunta de las páginas de `entrevistas/`.
- Sustituye `<!-- ENTREVISTAS_RESUMEN -->` en `entrevistas/index.md` por una tabla con el número de preguntas.
- Inyecta todas las preguntas como JSON en `entrevistas/simulacro.md`, que lee `assets/simulacro.js`.

Convención de una pregunta (la respuesta va plegada dentro; el `##` anterior es su subtema):

    ??? question "Medio · ¿Pregunta?"
        Respuesta modelo en Markdown.

        **Repregunta:** ¿…? — respuesta breve.
"""
from __future__ import annotations

import json
import pathlib
import re

QUESTION = re.compile(r'^\?\?\? question "(?P<title>[^"]*)"\s*$')
LEVEL = re.compile(r"^(?P<level>Básico|Medio|Avanzado)\s+·\s+(?P<text>.+)$")
H1 = re.compile(r"^#\s+(?P<title>.+?)\s*$")
H2 = re.compile(r"^##\s+(?P<title>.+?)\s*(\{.*\})?$")

DIR = "entrevistas"
PLACEHOLDER = "<!-- ENTREVISTAS_RESUMEN -->"
# Orden de las temáticas (nombre del fichero → nombre corto); las que no estén aquí no entran en el simulacro
TOPICS = {
    "fundamentos": "Fundamentos",
    "diseno": "Diseño y código",
    "java": "Java y Spring",
    "arquitectura": "Arquitectura",
    "system-design": "System Design",
    "datos": "Datos",
    "plataforma": "Plataforma",
    "ia": "Inteligencia Artificial",
    "cloud": "Cloud",
    "conductuales": "Rol y conductuales",
}
LEVELS = ["Básico", "Medio", "Avanzado"]


def _anchor(n: int) -> str:
    return f"pregunta-{n}"


def _parse(path: pathlib.Path, topic: str) -> list[dict]:
    lines = path.read_text(encoding="utf-8").splitlines()
    items, subtopic, n, i = [], "", 0, 0
    while i < len(lines):
        line = lines[i]
        if m := H2.match(line):
            subtopic = m.group("title")
        m = QUESTION.match(line)
        i += 1
        if not m:
            continue
        n += 1
        lm = LEVEL.match(m.group("title"))
        if not lm:
            raise ValueError(f"{path.name}: la pregunta {n} no empieza por «Básico · », «Medio · » o «Avanzado · »")
        body = []
        while i < len(lines) and (not lines[i].strip() or lines[i].startswith("    ")):
            body.append(lines[i][4:])
            i += 1
        items.append({
            "id": f"{topic}-{n}",
            "topic": topic,
            "subtopic": subtopic,
            "level": lm.group("level"),
            "q": lm.group("text"),
            "a": "\n".join(body).strip(),
            "url": f"../{topic}/#{_anchor(n)}",
        })
    return items


def _collect(docs_dir: pathlib.Path) -> list[dict]:
    items = []
    for topic in TOPICS:
        path = docs_dir / DIR / f"{topic}.md"
        if path.exists():
            items.extend(_parse(path, topic))
    return items


def _summary(items: list[dict]) -> str:
    out = ["| Temática | " + " | ".join(LEVELS) + " | Total |", "|---|" + "---:|" * (len(LEVELS) + 1)]
    for topic, name in TOPICS.items():
        own = [i for i in items if i["topic"] == topic]
        if own:
            counts = " | ".join(str(sum(1 for i in own if i["level"] == lvl)) for lvl in LEVELS)
            out.append(f"| [{name}]({topic}.md) | {counts} | **{len(own)}** |")
    totals = " | ".join(str(sum(1 for i in items if i["level"] == lvl)) for lvl in LEVELS)
    out.append(f"| **Total** | {totals} | **{len(items)}** |")
    return "\n".join(out)


def on_page_markdown(markdown, page, config, files):
    src = page.file.src_uri
    if not src.startswith(f"{DIR}/"):
        return markdown
    if src == f"{DIR}/index.md" and PLACEHOLDER in markdown:
        return markdown.replace(PLACEHOLDER, _summary(_collect(pathlib.Path(config["docs_dir"]))))
    n, out = 0, []
    for line in markdown.split("\n"):
        if QUESTION.match(line):
            n += 1
            out.append(f'<a id="{_anchor(n)}"></a>')
            out.append("")
        out.append(line)
    return "\n".join(out)


def on_page_content(html, page, config, files):
    if page.file.src_uri != f"{DIR}/simulacro.md":
        return html
    data = {"topics": TOPICS, "levels": LEVELS, "questions": _collect(pathlib.Path(config["docs_dir"]))}
    payload = json.dumps(data, ensure_ascii=False).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    return html + f'\n<script type="application/json" id="sim-datos">{payload}</script>\n'
