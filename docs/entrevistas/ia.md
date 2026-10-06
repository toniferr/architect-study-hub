# Entrevista: Inteligencia Artificial

Fundamentos de ML y LLMs, construir aplicaciones con LLMs, agentes, seguridad y operación. Para un arquitecto, el
foco no es entrenar modelos sino **integrarlos con criterio**: cuándo usar IA, cómo evaluarla, cuánto cuesta y cómo
se asegura.

## Tipos de IA y ML

Teoría: [Tipos de IA y ML](../ia/tipos.md)

??? question "Básico · ¿Aprendizaje supervisado, no supervisado y por refuerzo?"
    - **Supervisado**: aprende de ejemplos **etiquetados** a predecir la etiqueta (clasificación, regresión).
    - **No supervisado**: busca estructura sin etiquetas (agrupamiento, reducción de dimensionalidad, anomalías).
    - **Por refuerzo**: un agente aprende por **recompensas** al actuar en un entorno.
    - **Autosupervisado**: las etiquetas salen de los propios datos (predecir la siguiente palabra): así se
      preentrenan los LLMs.

    **Repregunta:** ¿qué es RLHF? — Ajustar un modelo con refuerzo usando un modelo de recompensa entrenado con
    preferencias humanas.

??? question "Medio · ¿Qué es el sobreajuste y cómo lo detectas y evitas?"
    El modelo memoriza el entrenamiento (incluido el ruido) y **generaliza mal**: error bajo en entrenamiento y alto
    en validación. Se detecta separando **entrenamiento, validación y test** (o validación cruzada). Se evita con más
    datos, modelos más simples, regularización, *early stopping*, *dropout*.

    **Repregunta:** ¿qué métrica usarías para detectar fraude (0,1 % de positivos)? — No la exactitud (99,9 % diciendo
    siempre "no"): **precisión, *recall*** y su compromiso (F1, curva PR), según el coste de cada error.

??? question "Medio · ¿Cuándo usarías ML clásico en lugar de un LLM?"
    Con **datos tabulares** estructurados y una tarea concreta (predecir abandono, puntuar riesgo, detectar
    anomalías): *gradient boosting* (XGBoost, LightGBM) suele ganar en precisión, coste, latencia y explicabilidad.
    Los LLMs brillan con lenguaje no estructurado, tareas abiertas y pocos ejemplos.

    **Repregunta:** ¿y para clasificar tickets? — Un LLM sirve para arrancar sin datos etiquetados; con volumen,
    un clasificador pequeño entrenado (o *embeddings* + modelo simple) es mucho más barato.

## Cómo funcionan los LLMs

Teoría: [Cómo funcionan los LLMs](../ia/llms.md)

??? question "Básico · ¿Qué es un token y por qué importa en una arquitectura?"
    La unidad en la que el modelo lee y escribe: trozos de palabra (en español, ~1 token ≈ 3-4 caracteres). Todo se
    mide en tokens: el **precio** (entrada y salida por separado), la **latencia** (la salida se genera token a
    token) y la **ventana de contexto**.

    **Repregunta:** ¿por qué la salida es más cara que la entrada? — La entrada se procesa en paralelo; cada token de
    salida exige una pasada completa del modelo.

??? question "Medio · Explica a alto nivel cómo funciona un transformer."
    El texto se convierte en tokens y luego en **embeddings** (vectores) con información de posición. Cada capa
    aplica **autoatención**: cada token calcula cuánto debe "atender" a los demás (consultas, claves y valores) y
    mezcla su información; luego una red *feed-forward*. Tras muchas capas, el modelo produce una distribución de
    probabilidad sobre el **siguiente token**; se elige uno, se añade y se repite (autorregresivo).

    **Repregunta:** ¿qué es la caché KV? — Guardar las claves y valores de los tokens ya procesados para no
    recalcularlos en cada paso: acelera la generación y consume memoria de GPU proporcional al contexto.

??? question "Medio · ¿Qué controlan la temperatura y top-p?"
    Cómo se elige el siguiente token. **Temperatura** baja → casi siempre el más probable (determinista, preciso);
    alta → más variedad y creatividad (y más errores). **Top-p** limita la elección al conjunto más pequeño de tokens
    que suma una probabilidad p. Para extracción o código, baja; para ideas, más alta.

    **Repregunta:** ¿temperatura 0 garantiza la misma respuesta? — No del todo: hay no determinismo numérico en la
    inferencia por lotes en GPU. Para reproducibilidad, evals con varias muestras.

??? question "Medio · ¿Qué son las alucinaciones y cómo las mitigas en un sistema?"
    El modelo genera texto plausible pero **falso**, porque predice texto probable, no consulta una base de verdad.
    Mitigaciones:

    - **Fundamentar** con RAG o herramientas y pedir que cite las fuentes.
    - Permitir "no lo sé" en las instrucciones.
    - **Verificación** automática (contra los datos, otro modelo, reglas) y **evals**.
    - Diseño: humano en el bucle donde el error cuesta caro; no usar el LLM para cálculos exactos.

    **Repregunta:** ¿un contexto más largo reduce las alucinaciones? — No necesariamente: con mucho contexto irrelevante
    la atención se diluye; es mejor **poco contexto y muy pertinente**.

??? question "Avanzado · ¿Qué aporta el razonamiento ('thinking') y cuándo no compensa?"
    El modelo genera pasos intermedios antes de responder, gastando más tokens (y tiempo) para mejorar en problemas
    de varios pasos: matemáticas, código, planificación, análisis. Se controla con un presupuesto o nivel de
    esfuerzo.

    No compensa en tareas simples (clasificar, extraer, reformular) o muy sensibles a la latencia: sube coste y
    tiempo sin mejorar el resultado.

    **Repregunta:** ¿cómo decides el nivel de esfuerzo? — Con evals: el mínimo que da la calidad necesaria en tus
    casos reales.

## Construir aplicaciones con LLMs

Teoría: [Construir aplicaciones con LLMs](../ia/aplicaciones.md)

??? question "Básico · ¿Qué es RAG y cuándo lo usarías frente a un ajuste fino?"
    *Retrieval-Augmented Generation*: antes de llamar al modelo, **recuperar** los fragmentos relevantes de tus
    documentos (búsqueda semántica con *embeddings*, por palabras clave o híbrida) y pasarlos en el contexto.

    RAG para **conocimiento**: datos propios, que cambian, con citas y control de acceso. Ajuste fino para
    **comportamiento**: formato, estilo, tareas muy repetitivas, o un modelo más pequeño y barato.

    **Repregunta:** ¿qué es el troceado (*chunking*) y por qué importa? — Dividir los documentos en fragmentos; si son
    muy pequeños pierden contexto, si son muy grandes meten ruido. Mejor por estructura (secciones) con solapamiento.

??? question "Medio · Un sistema RAG responde mal. ¿Cómo lo diagnosticas?"
    Separar las dos mitades:

    1. **Recuperación**: ¿estaban los fragmentos correctos en el contexto? Medir *recall* de recuperación con un
       conjunto de preguntas y documentos esperados. Fallos típicos: troceado malo, *embeddings* que no captan
       términos exactos (códigos, nombres) → búsqueda **híbrida** y **reordenación** (*reranker*).
    2. **Generación**: con el contexto correcto, ¿responde fiel a él? Medir fidelidad (*faithfulness*).

    Además: datos desactualizados, permisos, y preguntas que necesitan agregar muchos documentos (RAG no sirve para
    "cuántos…").

    **Repregunta:** ¿cómo evalúas sin etiquetar todo a mano? — Un conjunto dorado pequeño revisado por personas, más
    LLM como juez calibrado contra él.

??? question "Medio · ¿Qué es el context engineering?"
    Diseñar **qué información entra en la ventana de contexto** en cada llamada, y en qué forma: instrucciones,
    ejemplos, documentos recuperados, resultados de herramientas, memoria, historial. El objetivo es el **conjunto
    mínimo de tokens con más señal**, porque el contexto es finito, cuesta dinero y el exceso degrada la calidad.

    Técnicas: recuperar justo a tiempo, resumir o compactar el historial, notas persistentes fuera del contexto,
    subagentes con contexto propio que devuelven solo el resultado.

    **Repregunta:** ¿qué es el *prompt caching*? — Reutilizar el prefijo fijo del contexto (instrucciones, documentos)
    entre llamadas: menos coste y latencia; obliga a poner lo estable al principio.

??? question "Medio · ¿Cómo evalúas una aplicación con LLM antes de llevarla a producción?"
    - Un **conjunto de evaluación** con casos reales y casos límite, con el resultado esperado o criterios.
    - Evaluadores: **código** (formato, coincidencia exacta, tests), **LLM como juez** (con rúbrica y calibrado
      contra humanos) y **revisión humana** por muestreo.
    - Ejecutarlo en el CI ante cada cambio de *prompt*, modelo o datos (regresiones).
    - En producción: trazas, feedback de usuarios, métricas de coste y latencia, y alimentar el conjunto con fallos
      reales.

    **Repregunta:** ¿por qué no basta con probar unos cuantos ejemplos a mano? — La salida es no determinista y los
    cambios tienen efectos no locales: lo que mejora un caso rompe otros.

??? question "Avanzado · ¿Cómo reduces el coste y la latencia de una aplicación con LLM?"
    - **Modelo adecuado por tarea**: uno pequeño para clasificar o enrutar, uno grande solo donde hace falta.
    - **Prompt caching** del prefijo estable y caché de respuestas para preguntas repetidas.
    - Menos tokens: contexto mínimo, salida estructurada y concisa.
    - **Batch** asíncrono para lo que no es interactivo (suele ser mucho más barato).
    - **Streaming** para mejorar la latencia percibida; llamadas en paralelo.

    **Repregunta:** ¿cómo controlas el gasto? — Presupuestos y límites por usuario o funcionalidad, métricas de coste
    por petición y alertas.

## Agentes, MCP y Skills

Teoría: [Agentes, MCP y Skills](../ia/agentes.md) · [Harnesses y agentes de código](../ia/harness.md)

??? question "Básico · ¿Workflow o agente?"
    En un **workflow**, tu código controla el flujo y el LLM resuelve pasos concretos: predecible, barato, depurable.
    En un **agente**, el modelo decide en bucle qué herramienta usar y cuándo ha terminado: resuelve tareas abiertas,
    a cambio de más coste, latencia y riesgo.

    Usar un agente solo si la tarea es compleja y difícil de especificar, el valor lo justifica, el modelo es capaz
    y **los errores se pueden detectar y revertir**. Si no, un workflow.

    **Repregunta:** ¿qué patrones de workflow conoces? — Encadenar *prompts*, enrutar, paralelizar, orquestador con
    trabajadores, evaluador-optimizador.

??? question "Medio · ¿Qué es MCP y qué problema resuelve?"
    El *Model Context Protocol* es un **estándar abierto** para conectar aplicaciones de IA con herramientas y datos:
    un servidor MCP expone **herramientas**, **recursos** y *prompts*, y cualquier cliente compatible (un IDE, un
    asistente, un agente) los usa sin integración a medida. Convierte un problema N×M (cada app con cada sistema) en
    N+M.

    **Repregunta:** ¿qué riesgos de seguridad trae? — Servidores de terceros con permisos amplios, inyección de
    instrucciones a través de los resultados de las herramientas y descripciones de herramientas maliciosas: mínimo
    privilegio, servidores de confianza y confirmación humana en acciones sensibles.

??? question "Medio · ¿Qué es una Agent Skill y en qué se diferencia de un servidor MCP?"
    Una **skill** es una carpeta con instrucciones (`SKILL.md`), scripts y recursos que el agente **carga solo cuando
    la necesita**: al principio solo ve su nombre y descripción (*progressive disclosure*). Enseña **cómo hacer** una
    tarea (procedimientos, convenciones). Un servidor MCP da **acceso** a sistemas (herramientas y datos). Se
    complementan.

    **Repregunta:** ¿por qué la carga progresiva importa? — Permite tener muchas skills disponibles sin llenar la
    ventana de contexto.

??? question "Avanzado · ¿Cómo diseñarías un agente fiable para producción?"
    - **Herramientas** pocas, bien descritas, con parámetros claros y errores útiles; idempotentes cuando sea posible.
    - **Límites**: número de pasos, presupuesto de tokens, *timeouts*.
    - **Permisos mínimos** y **confirmación humana** en acciones irreversibles; *sandbox* para ejecutar código.
    - Contexto gestionado (compactación, memoria externa, subagentes).
    - **Observabilidad**: trazas de cada paso; **evals** de extremo a extremo con tareas reales.
    - Plan de degradación: si el agente no puede, escalar a una persona.

    **Repregunta:** ¿qué es un *harness*? — El programa que rodea al modelo y ejecuta el bucle: herramientas, permisos,
    contexto, *hooks* (por ejemplo Claude Code).

## Seguridad, regulación y operación

Teoría: [Seguridad y regulación](../ia/seguridad.md) · [MLOps](../ia/mlops.md) · [IA en el edge](../ia/edge-ai.md) ·
[Ecosistema](../ia/ecosistema.md)

??? question "Medio · ¿Qué es la prompt injection y cómo te defiendes?"
    Instrucciones maliciosas que llegan al modelo como **datos** (un documento, una web, un email, la salida de una
    herramienta) y le hacen desobedecer las instrucciones legítimas: filtrar datos, llamar a herramientas indebidas.
    No hay una defensa completa; se aplican **capas**:

    - **Mínimo privilegio** de las herramientas y separar quién lee datos no confiables de quién actúa.
    - **Confirmación humana** en acciones sensibles; nada de exfiltración por URLs o imágenes generadas.
    - Marcar y aislar el contenido no confiable, clasificadores de entrada y salida.
    - Diseñar suponiendo que la inyección **tendrá éxito** alguna vez: limitar el daño posible.

    **Repregunta:** ¿qué es la "tríada letal"? — Acceso a datos privados + exposición a contenido no confiable +
    capacidad de comunicar hacia fuera: con las tres, la exfiltración es posible.

??? question "Medio · ¿Qué implica el EU AI Act para un sistema que diseñas?"
    Regula por **nivel de riesgo**: prácticas **prohibidas** (puntuación social, manipulación), **alto riesgo**
    (empleo, educación, crédito, infraestructuras críticas…: gestión de riesgos, calidad de datos, documentación,
    registros, supervisión humana, evaluación de conformidad), **transparencia** (avisar de que se habla con una IA,
    marcar el contenido generado) y riesgo mínimo. Los modelos de propósito general tienen obligaciones propias.

    Para un arquitecto: clasificar el caso de uso pronto, trazabilidad y registros, supervisión humana en el diseño, y
    seguir el calendario, que la UE ha ido ajustando.

    **Repregunta:** ¿qué otros marcos de gestión conoces? — ISO/IEC 42001 (sistema de gestión de IA) y el NIST AI RMF.

??? question "Medio · ¿Qué técnica usarías para adaptar un LLM a tu caso?"
    En orden de coste creciente:

    1. ***Prompting*** y *context engineering* (con ejemplos).
    2. **RAG** si falta conocimiento.
    3. **Ajuste fino eficiente** (LoRA/QLoRA) si falta comportamiento: formato, tono, una tarea muy concreta, o
       destilar a un modelo más pequeño.
    4. Ajuste fino completo o preentrenamiento: casi nunca justificado.

    **Repregunta:** ¿qué hace LoRA? — Congela el modelo y entrena matrices pequeñas de bajo rango que se suman a los
    pesos: una fracción de los parámetros y de la memoria.

??? question "Avanzado · ¿Cómo servirías un modelo abierto en tu propia infraestructura?"
    - **Motor de inferencia** optimizado (vLLM, TGI, SGLang; llama.cpp u Ollama en pequeño) con *batching*
      continuo y caché KV paginada.
    - **Memoria de GPU**: pesos (parámetros × bytes por parámetro: 7 B en FP16 ≈ 14 GB) + caché KV según contexto
      y concurrencia; **cuantización** (INT8, 4 bits) para reducirla.
    - En Kubernetes: nodos GPU con *device plugin*, escalado por cola o latencia, imágenes y pesos cacheados (son
      enormes), y una pasarela que unifique modelos propios y de API.

    **Repregunta:** ¿cuándo compensa frente a una API? — Por datos que no pueden salir, volumen muy alto y estable,
    latencia o funcionamiento sin conexión (edge); si no, la API suele ser más barata y simple.

??? question "Medio · ¿Cuándo llevarías la inferencia al edge?"
    Por **latencia** (visión en tiempo real), **conectividad** (debe funcionar sin red), **privacidad** (los datos no
    salen del sitio) o **coste de ancho de banda** (no subir vídeo en bruto). Implica modelos pequeños, cuantizados y
    optimizados para el hardware (NPU, GPU pequeñas), y una forma de distribuirlos y actualizarlos en la flota (como
    artefactos OCI con GitOps) y de vigilar su deriva.

    **Repregunta:** ¿qué arquitectura híbrida usarías? — Modelo pequeño local para lo frecuente y urgente, y escalado a
    un modelo grande en la nube para los casos dudosos cuando haya conexión.

??? question "Avanzado · ¿Qué es un modelo 'System One' como Jev y dónde encaja?"
    Un modelo que no genera texto: recibe estado no estructurado y devuelve **valores tipados con probabilidades
    calibradas**, en milisegundos y a muy bajo coste (según su fabricante; aún sin evaluaciones independientes).
    Encaja como un **"if" inteligente** dentro del código: clasificar, puntuar, filtrar a gran volumen, o como
    guardarraíl rápido de la salida de un LLM, con umbrales de confianza que deciden si se actúa, se pide confirmación
    o se pasa a una persona.

    **Repregunta:** ¿qué no le pedirías? — Contar, aritmética, comparar fechas o razonamiento de varios saltos: la
    lógica exacta va en tu código.
