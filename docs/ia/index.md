# Inteligencia Artificial

Desde la teoría (qué es la IA y cómo funcionan los modelos) hasta la práctica de ingeniería: construir aplicaciones
con LLMs, diseñar agentes y trabajar a diario con *harnesses* de agentes de código.

!!! warning "El área que más rápido cambia"
    Modelos, precios y herramientas cambian cada pocos meses. Los datos de producto son de **septiembre de 2026**;
    los conceptos (tokens, contexto, RAG, agentes, evaluación, seguridad) son estables.

| Página | Qué cubre |
|---|---|
| [Tipos de IA y aprendizaje automático](tipos.md) | IA simbólica vs. estadística, paradigmas de aprendizaje, arquitecturas, generativa vs. discriminativa, *world models* y JEPA |
| [Cómo funcionan los LLMs](llms.md) | Tokens, *embeddings*, *transformers*, entrenamiento, razonamiento, ventana de contexto, parámetros, costes |
| [Construir aplicaciones con LLMs](aplicaciones.md) | *Prompting* y *context engineering*, salida estructurada, uso de herramientas, RAG, evaluación, coste y latencia |
| [Agentes, MCP y Skills](agentes.md) | *Workflows* vs. agentes, patrones, memoria, multiagente, Model Context Protocol, A2A, Agent Skills |
| [Harnesses y agentes de código](harness.md) | Qué es un *harness*, Claude Code a fondo (CLAUDE.md, skills, hooks, subagentes, plugins, permisos), otras herramientas y buenas prácticas |
| [Seguridad, riesgos y regulación](seguridad.md) | *Prompt injection*, OWASP LLM Top 10, AI Act, ISO 42001, NIST AI RMF |
| [Jev y los modelos "System One"](jev.md) | El modelo de decisión tipada de TypeSafe AI (septiembre de 2026): cómo funciona y dónde encaja |
| [MLOps, ajuste fino y servir modelos](mlops.md) | Ciclo de vida, deriva, LoRA/QLoRA, cuantización, vLLM, KServe, LLMOps |
| [IA en el edge](edge-ai.md) | Modelos en el sitio, cascada edge → nube, runtimes, GitOps para modelos |
| [Ecosistema](ecosistema.md) | Proveedores y modelos, frameworks, bases vectoriales, ejecución local, observabilidad, hardware |

## Línea temporal esencial

| Año | Hito |
|---|---|
| 1956 | Conferencia de Dartmouth: nace el término "inteligencia artificial" |
| 1980s | Sistemas expertos (IA simbólica basada en reglas) |
| 1997 | Deep Blue gana a Kasparov (búsqueda + heurísticas) |
| 2012 | AlexNet: el *deep learning* con GPUs revoluciona la visión artificial |
| 2016 | AlphaGo: aprendizaje por refuerzo + redes profundas |
| 2017 | *Attention Is All You Need*: la arquitectura **Transformer** |
| 2018-2020 | BERT, GPT-2, GPT-3: modelos preentrenados a gran escala |
| 2022 | ChatGPT: los LLMs llegan al gran público; modelos de difusión para imágenes |
| 2023-2024 | Modelos multimodales, ventanas de contexto enormes, *open weights* competitivos, MCP (nov. 2024) |
| 2025 | Modelos de razonamiento, agentes de código (Claude Code y otros), Agent Skills, MCP y AGENTS.md pasan a la Linux Foundation |
| 2026 | Agentes de larga duración, ventanas de 1 M de tokens como estándar en modelos frontera, agentes gestionados en la nube, modelos de decisión tipada (Jev) |

## Relación con el resto de la web

- Arquitectura: los LLMs son un componente más, con latencia, coste por token y salidas no deterministas → [trade-offs](../arquitectura/adr.md).
- Cloud: servicios gestionados de IA de cada proveedor → [AWS](../cloud/aws.md#datos-e-ia) · [Azure](../cloud/azure.md#datos-e-ia) · [Google Cloud](../cloud/gcp.md#ia).
- Plataforma: servir modelos, GPUs en Kubernetes, observabilidad de agentes.
