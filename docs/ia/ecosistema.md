# Ecosistema de IA <span class="nivel medio">Medio</span>

Mapa de proveedores, herramientas y piezas de infraestructura. Cambia rápido: úsalo como orientación de
**categorías** y compruébalo antes de elegir.

## Proveedores de modelos

| Proveedor | Familias | Rasgos |
|---|---|---|
| **Anthropic** | Claude (Haiku, Sonnet, Opus, Fable) | Foco en código, agentes y seguridad; Claude Code; disponible en API propia, AWS, Google Cloud y Microsoft Foundry |
| **OpenAI** | GPT, modelos de razonamiento | ChatGPT, Codex; ampliamente disponible en Azure |
| **Google** | Gemini (y Gemma, abiertos) | Multimodalidad nativa, integración con Google Cloud y Workspace |
| **Meta** | Llama | Pesos abiertos |
| **Mistral** | Mistral, Codestral… | Europeo; modelos abiertos y comerciales |
| **DeepSeek, Qwen (Alibaba), Kimi (Moonshot)** | Varios | Modelos abiertos muy competitivos en coste |
| **xAI** | Grok | — |

### Abiertos vs. cerrados

| | Cerrados (API) | Pesos abiertos |
|---|---|---|
| Capacidad punta | Normalmente superior | Algo por detrás, muy competitivos en tareas concretas |
| Operación | Nada que operar | Tú sirves el modelo (GPUs, escalado, actualizaciones) |
| Datos | Salen hacia el proveedor (con garantías contractuales) | Se quedan en tu infraestructura |
| Coste | Por token | Por infraestructura: rentable a gran volumen constante |
| Casos | Máxima calidad, agentes complejos | Soberanía, *air-gapped*, **edge**, ajuste fino profundo |

## Cómo elegir un modelo

1. **Define la tarea y construye una evaluación** con casos reales antes de comparar nada.
2. **Preselecciona** 2-3 modelos de distinto tamaño y proveedor según los requisitos que no se negocian:

    | Requisito | Pregunta |
    |---|---|
    | Datos | ¿Pueden salir a un proveedor externo? ¿En qué región se procesan? ¿Se retienen? |
    | Capacidad | ¿Necesita razonamiento complejo, uso de herramientas, visión, contexto muy largo? |
    | Latencia | ¿Interactivo (segundos) o por lotes (minutos u horas)? |
    | Volumen y coste | ¿Cuántas peticiones y tokens al mes? ¿Qué coste por tarea es aceptable? |
    | Operación | ¿API gestionada, a través de tu nube (Bedrock, Azure AI Foundry, Vertex AI) o autoalojado? |

3. **Mide** calidad, coste por tarea completada y latencia (p50 y p95) de cada candidato en tu evaluación.
4. **Elige el más pequeño que cumpla** el umbral de calidad; usa modelos mayores solo en las rutas que lo necesiten.
5. **Aísla el proveedor** tras una interfaz o pasarela propia y **fija versiones**: los modelos se actualizan y retiran,
   y un cambio de versión debe pasar por la evaluación como cualquier cambio de código.

## Frameworks y SDKs

| Herramienta | Lenguaje | Para |
|---|---|---|
| SDKs oficiales de cada proveedor | Python, TypeScript, Java, Go, C#… | Llamadas directas: la opción más simple y transparente |
| **Claude Agent SDK** | Python, TypeScript | Agentes con el *harness* de Claude Code |
| OpenAI Agents SDK, Google ADK, Microsoft Agent Framework | Varios | Agentes en el ecosistema de cada proveedor |
| **LangChain / LangGraph** | Python, TypeScript | Cadenas y grafos de agentes con estado |
| **LlamaIndex** | Python, TypeScript | RAG y conectores de datos |
| **Spring AI**, **LangChain4j** | Java | IA en aplicaciones Spring / Java |
| Vercel AI SDK | TypeScript | Apps web con *streaming* |
| Pydantic AI, CrewAI | Python | Agentes tipados / multiagente |

!!! tip "Framework o SDK directo"
    Los frameworks aceleran prototipos, pero añaden capas que ocultan qué se envía al modelo. Para producción,
    muchos equipos prefieren el SDK directo + pocas abstracciones propias, que son más fáciles de depurar y optimizar.

## Datos: bases vectoriales y búsqueda

| Opción | Cuándo |
|---|---|
| **pgvector** (PostgreSQL) | Ya tienes Postgres; volúmenes moderados; transacciones y filtros SQL |
| **Qdrant, Weaviate, Milvus** | Bases vectoriales dedicadas, gran escala |
| **Pinecone** | Servicio gestionado |
| **Elasticsearch / OpenSearch** | Búsqueda híbrida (texto + vectores) sobre infraestructura existente |
| Servicios cloud | Azure AI Search, Vertex AI Search/Vector Search, Amazon OpenSearch / S3 Vectors |

## Ejecución de modelos (serving)

| Herramienta | Para |
|---|---|
| **vLLM**, SGLang, TGI | Servir modelos abiertos en producción con GPUs (alto rendimiento, *batching*) |
| **Ollama**, LM Studio | Ejecutar modelos en local (portátil, estación de trabajo) |
| **llama.cpp** (formato GGUF) | Inferencia eficiente en CPU y dispositivos modestos: **edge** |
| KServe, KubeAI | Servir modelos en **Kubernetes** |
| Cuantización (8, 4 bits) | Reducir memoria y coste a cambio de algo de calidad |

## Observabilidad y evaluación

| Herramienta | Para |
|---|---|
| **OpenTelemetry** (convenciones GenAI) | Trazas estándar de llamadas a modelos y herramientas |
| Langfuse, LangSmith, Arize Phoenix | Trazas, costes, evaluación y gestión de *prompts* |
| promptfoo, DeepEval, Ragas, Inspect | Evaluaciones y *red teaming* automatizados |

## Hardware

| Tipo | Ejemplos |
|---|---|
| GPUs | NVIDIA (dominante: arquitecturas Hopper, Blackwell…), AMD Instinct |
| Aceleradores de nube | Google **TPU**, AWS **Trainium / Inferentia**, Microsoft **Maia** |
| Inferencia rápida especializada | Groq, Cerebras |
| Edge | NPUs en portátiles y móviles, NVIDIA Jetson |

En Kubernetes: *device plugins* de GPU, GPU Operator, particionado (MIG) y planificación consciente de GPUs;
es un área donde tu experiencia de plataforma aplica directamente.

## Preguntas de repaso

??? question "¿Cuándo tendría sentido un modelo abierto en el edge?"
    Cuando la latencia debe ser mínima, no hay conectividad garantizada, los datos no pueden salir del sitio, o el volumen
    de inferencia hace inviable pagar por token. Normalmente con modelos pequeños cuantizados (llama.cpp, Ollama) en hardware local.

??? question "¿pgvector o una base vectorial dedicada?"
    pgvector si ya usas PostgreSQL y el volumen es moderado: una pieza menos que operar, transacciones y filtros SQL.
    Una dedicada cuando la escala o las necesidades de rendimiento de búsqueda lo justifican.

## Ejercicios

!!! exercise "Ejercicio 1 · Básico — Abierto o cerrado"
    Elige entre modelo por API o modelo abierto autoalojado: (a) prototipo de asistente interno en 2 semanas; (b) análisis
    de documentos clínicos que no pueden salir del hospital; (c) clasificación de 50 M de textos al día con un volumen constante.

    ??? success "Solución"
        (a) **API**: máxima calidad sin operar nada; validar la idea primero. (b) **Abierto autoalojado** (o un despliegue
        del proveedor dentro de tu entorno con garantías contractuales): los datos no pueden salir. (c) **Abierto
        autoalojado** probablemente: con volumen alto y constante, pagar por token suele salir más caro que GPUs propias
        bien utilizadas; comparar coste total (incluida la operación) y calidad con evaluaciones.

!!! exercise "Ejercicio 2 · Medio — Elegir la pila de un proyecto Java"
    Tu equipo (Java/Spring) debe construir un asistente con RAG sobre PostgreSQL y trazabilidad de costes. Propón la pila.

    ??? success "Solución"
        - **Integración con modelos**: el SDK oficial del proveedor para Java, o **Spring AI** si se quieren abstracciones
          de Spring (clientes de chat, *advisors* de RAG) con cambio de proveedor sencillo.
        - **Vectores**: **pgvector** en el PostgreSQL existente (una pieza menos que operar).
        - **Trazas y costes**: OpenTelemetry con las convenciones GenAI + Micrometer, visualizado en Grafana o en una
          herramienta específica (Langfuse).
        - **Evaluación**: un conjunto dorado ejecutado en CI (JUnit + LLM como juez, o una herramienta como promptfoo).
        - **Pasarela** de modelos si varios equipos van a consumir LLMs (cuotas y registro centralizados).
