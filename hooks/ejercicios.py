"""Hook de MkDocs: índice de ejercicios por nivel.

- Añade un ancla (`ejercicio-N`) antes de cada bloque `!!! exercise` de cada página.
- Genera la página virtual `ejercicios.md` con todos los ejercicios agrupados por nivel y sección.

Convención del título de un ejercicio: `!!! exercise "Ejercicio N · Nivel — Título"`, donde Nivel es
Básico, Medio o Avanzado. Si no se indica nivel, el ejercicio aparece en "Sin nivel".
"""
from __future__ import annotations

import pathlib
import re

from mkdocs.structure.files import File

EXERCISE = re.compile(r'^!!! exercise "(?P<title>[^"]*)"')
LEVEL = re.compile(r"\b(Básico|Medio|Avanzado)\b")
PAGE_TITLE = re.compile(r"^#\s+(?P<title>.+?)(\s*<span.*)?$")

LEVELS = ["Básico", "Medio", "Avanzado", "Sin nivel"]
SECTIONS = {
    "fundamentos": "Fundamentos",
    "diseno": "Diseño y código",
    "java": "Java y Spring",
    "arquitectura": "Arquitectura",
    "system-design": "System Design",
    "datos": "Datos",
    "plataforma": "Plataforma",
    "ia": "Inteligencia Artificial",
    "cloud": "Cloud",
    "libros": "Biblioteca",
}


def _anchor(n: int) -> str:
    return f"ejercicio-{n}"


def _clean_title(raw: str) -> str:
    """'Ejercicio 3 · Medio — Deadlock' -> 'Deadlock'."""
    parts = re.split(r"\s+—\s+", raw, maxsplit=1)
    return parts[1] if len(parts) == 2 else raw


def _collect(docs_dir: pathlib.Path) -> list[dict]:
    items = []
    for path in sorted(docs_dir.rglob("*.md")):
        rel = path.relative_to(docs_dir).as_posix()
        section_key = rel.split("/")[0] if "/" in rel else ""
        if section_key not in SECTIONS:
            continue
        lines = path.read_text(encoding="utf-8").splitlines()
        page_title = next(
            (m.group("title").strip() for l in lines if (m := PAGE_TITLE.match(l))), rel
        )
        n = 0
        for line in lines:
            m = EXERCISE.match(line)
            if not m:
                continue
            n += 1
            raw = m.group("title")
            level = LEVEL.search(raw)
            items.append({
                "section_key": section_key,
                "section": SECTIONS[section_key],
                "page": page_title,
                "link": f"{rel}#{_anchor(n)}",
                "title": _clean_title(raw),
                "level": level.group(1) if level else "Sin nivel",
            })
    order = list(SECTIONS)
    items.sort(key=lambda i: order.index(i["section_key"]))
    return items


def _render(items: list[dict]) -> str:
    counts = {lvl: sum(1 for i in items if i["level"] == lvl) for lvl in LEVELS}
    out = [
        "---",
        "hide:",
        "  - toc",
        "---",
        "",
        "# Ejercicios",
        "",
        f"Todos los ejercicios de la web (**{len(items)}**) agrupados por nivel. Pulsa uno para ir a él; la solución",
        "está plegada debajo del enunciado. Esta página se genera automáticamente en cada build.",
        "",
        '<input id="ej-filtro" class="ej-filtro" type="search" placeholder="Filtrar por texto (p. ej. kafka, sql, flux)…">',
        "",
    ]
    for lvl in LEVELS:
        level_items = [i for i in items if i["level"] == lvl]
        if not level_items:
            continue
        out.append(f'=== "{lvl} ({counts[lvl]})"')
        out.append("")
        out.append("    | Sección | Página | Ejercicio |")
        out.append("    |---|---|---|")
        for i in level_items:
            title = i["title"].replace("|", "\\|")
            out.append(f"    | {i['section']} | {i['page']} | [{title}]({i['link']}) |")
        out.append("")
    return "\n".join(out) + "\n"


def on_files(files, config):
    docs_dir = pathlib.Path(config["docs_dir"])
    content = _render(_collect(docs_dir))
    files.append(File.generated(config, "ejercicios.md", content=content))
    return files


def on_page_markdown(markdown, page, config, files):
    n = 0
    out = []
    for line in markdown.split("\n"):
        if EXERCISE.match(line):
            n += 1
            out.append(f'<a id="{_anchor(n)}"></a>')
            out.append("")
        out.append(line)
    return "\n".join(out)
