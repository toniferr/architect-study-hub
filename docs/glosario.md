# Glosario

Términos que aparecen en la web, ordenados alfabéticamente. Usa el buscador (tecla `/` o la lupa) para ir directo.

ACID
:   Atomicidad, Consistencia, Aislamiento, Durabilidad. Garantías de las transacciones en BBDD relacionales.

ADR
:   *Architecture Decision Record*. Documento corto con una decisión, su contexto y consecuencias. → [ADRs](arquitectura/adr.md)

Agente (IA)
:   Sistema en el que el modelo decide sus propios pasos y herramientas hasta cumplir un objetivo. → [Agentes](ia/agentes.md)

Agregado
:   En DDD, grupo de objetos con una raíz que garantiza invariantes; unidad de consistencia. → [DDD](arquitectura/ddd.md)

Alucinación
:   Respuesta plausible pero falsa generada por un modelo de lenguaje.

BASE
:   *Basically Available, Soft state, Eventually consistent*. Alternativa a ACID en sistemas distribuidos.

Bloom filter
:   Estructura probabilística que indica si un elemento seguro que no está o probablemente está, con muy poca memoria.

Bounded Context
:   Límite dentro del cual un modelo de dominio y su lenguaje son consistentes.

Canary
:   Despliegue que envía un pequeño porcentaje del tráfico a la nueva versión y avanza si las métricas son buenas. → [CI/CD](plataforma/cicd.md)

CAP
:   Ante una partición de red, elegir entre consistencia y disponibilidad. → [Fundamentos](system-design/fundamentos.md#5-teorema-cap-y-pacelc)

CDC (Change Data Capture)
:   Convertir cada cambio de una base de datos en un evento leyendo su log de transacciones (Debezium).

Circuit breaker
:   Patrón que corta las llamadas a una dependencia que falla para evitar fallos en cascada.

Context engineering
:   Disciplina de decidir qué información entra en la ventana de contexto del modelo en cada paso. → [Aplicaciones con LLMs](ia/aplicaciones.md#context-engineering)

CQRS
:   *Command Query Responsibility Segregation*. Modelos separados para escritura y lectura.

Cuantización
:   Representar los pesos de un modelo con menos bits (8, 4) para reducir memoria y acelerar la inferencia.

Deriva (de datos / de concepto)
:   Cambio en la distribución de las entradas o en su relación con la salida que degrada un modelo en producción.

Doble entrada (contabilidad)
:   Registro de cada movimiento como apuntes que suman cero entre cuentas. → [Pagos](system-design/pagos.md)

Drift (deriva)
:   Diferencia entre el estado declarado (Git/código) y el real.

Embedding
:   Vector numérico que representa el significado de un texto o imagen; base de la búsqueda semántica.

Esquema en estrella
:   Modelo analítico con una tabla de hechos (medidas) rodeada de tablas de dimensiones (contexto).

Fan-out
:   Distribuir un elemento a muchos destinatarios; en un news feed, escribir un post en el feed de cada seguidor. → [News feed](system-design/news-feed.md)

FinOps
:   Práctica de gestión colaborativa del gasto cloud entre ingeniería, finanzas y negocio. → [Costes y FinOps](cloud/costes.md#finops)

Fitness function
:   Comprobación automática de que la arquitectura mantiene una característica (modularidad, rendimiento…). → [Rol del arquitecto](arquitectura/rol-del-arquitecto.md#fitness-functions)

Geohash
:   Codificación de una posición geográfica como cadena; cadenas más largas representan celdas más pequeñas. → [Proximidad](system-design/proximidad.md)

Grupo de consumidores
:   Conjunto de consumidores que se reparten las particiones de un topic; cada partición la lee un solo miembro.

Harness
:   Software que envuelve a un modelo para convertirlo en agente: bucle, herramientas, contexto, permisos y extensiones. → [Harnesses](ia/harness.md)

Hilos virtuales
:   Hilos ligeros de Java 21+ gestionados por la JVM que permiten millones de tareas bloqueantes concurrentes. → [Concurrencia](fundamentos/concurrencia.md)

Hook (Claude Code)
:   Comando determinista que se ejecuta en un evento del ciclo de vida del agente (antes/después de usar una herramienta, al empezar…).

IaaS / PaaS / SaaS
:   Infraestructura, plataforma o software como servicio: cuánto gestiona el proveedor y cuánto tú. → [Cloud](cloud/index.md#modelos-de-servicio)

Idempotencia
:   Ejecutar una operación varias veces produce el mismo resultado que una sola vez.

JEPA
:   *Joint-Embedding Predictive Architecture*: propuesta de Yann LeCun que predice representaciones abstractas en lugar de tokens o píxeles. → [Tipos de IA](ia/tipos.md#world-models-y-jepa)

Jev
:   Modelo de TypeSafe AI (septiembre de 2026) que devuelve decisiones tipadas con probabilidades calibradas en lugar de texto. → [Jev](ia/jev.md)

JIT (compilación Just-In-Time)
:   La JVM compila a código nativo los métodos más usados mientras la aplicación se ejecuta, usando su perfil real. → [JVM](java/jvm.md)

Lakehouse
:   Plataforma analítica que combina ficheros abiertos en un data lake con un formato de tabla transaccional (Iceberg, Delta). → [Plataformas de datos](datos/plataformas-datos.md)

Landing zone
:   Entorno cloud base multi-cuenta/suscripción con identidad, red, seguridad y registro preconfigurados.

LLM
:   *Large Language Model*: red neuronal entrenada para predecir el siguiente token de un texto. → [Cómo funcionan](ia/llms.md)

LoRA
:   *Low-Rank Adaptation*: ajuste fino que entrena pequeñas matrices adicionales sobre un modelo congelado. → [MLOps](ia/mlops.md)

LSM-tree
:   Estructura de almacenamiento que acumula escrituras en memoria y las vuelca a ficheros ordenados que se compactan.

MCP
:   *Model Context Protocol*: protocolo abierto para conectar aplicaciones de IA con herramientas y datos. → [MCP](ia/agentes.md#mcp)

MVCC
:   *Multi-Version Concurrency Control*: cada transacción lee una instantánea y lectores y escritores no se bloquean.

OAuth 2.0 / OIDC
:   Autorización delegada mediante tokens / capa de autenticación sobre OAuth con *ID token*. → [Seguridad](plataforma/seguridad.md)

Offset
:   Posición de un registro dentro de una partición de Kafka; cada grupo de consumidores guarda el suyo.

Outbox
:   Patrón para guardar datos y publicar un evento de forma atómica usando una tabla en la misma transacción.

p99
:   Percentil 99 de latencia: el 99 % de las peticiones tardan menos que este valor.

Partición (Kafka)
:   Subdivisión de un topic; log ordenado independiente y unidad de paralelismo y de orden. → [Kafka](datos/kafka.md)

Presupuesto de errores
:   Margen de fallo permitido por un SLO (100 % − SLO) que se usa para decidir entre velocidad y fiabilidad.

Problema N+1
:   Una consulta para obtener N entidades y otra adicional por cada una al acceder a una relación perezosa. → [Spring](java/spring.md)

Prompt injection
:   Ataque que introduce instrucciones maliciosas en el contenido que procesa un modelo. → [Seguridad IA](ia/seguridad.md)

Quórum (W + R > N)
:   Regla de réplicas escritas y leídas que garantiza leer la última escritura en sistemas sin líder. → [Clave-valor](system-design/key-value-store.md)

RAG
:   *Retrieval-Augmented Generation*: recuperar información relevante e incluirla en el contexto del modelo. → [RAG](ia/aplicaciones.md#rag)

Recolector de basura (GC)
:   Componente de la JVM que libera la memoria de los objetos que ya no son alcanzables (G1, ZGC, Parallel…). → [JVM](java/jvm.md#4-recoleccion-de-basura-gc)

Reconciliación
:   Bucle que compara el estado deseado con el real y actúa para igualarlos. Base de Kubernetes y GitOps.

Responsabilidad compartida
:   El proveedor protege la nube; el cliente protege lo que pone en ella (datos, accesos, configuración).

RPO / RTO
:   *Recovery Point Objective* (cuántos datos puedes perder) / *Recovery Time Objective* (cuánto puedes tardar en recuperar).

Saga
:   Secuencia de transacciones locales con acciones compensatorias para mantener consistencia entre servicios.

Savings Plan / Reserva / CUD
:   Descuentos a cambio de comprometer uso o gasto durante 1-3 años. → [Costes](cloud/costes.md#modelos-de-compra)

Skill (Agent Skill)
:   Carpeta con instrucciones (`SKILL.md`), scripts y recursos que un agente carga solo cuando la tarea lo requiere. → [Skills](ia/agentes.md#agent-skills)

SLI / SLO / SLA
:   Indicador medido / objetivo interno / acuerdo contractual de nivel de servicio. → [Observabilidad](plataforma/observabilidad.md)

Spot
:   Capacidad sobrante del proveedor con gran descuento que puede ser reclamada con poco aviso.

STRIDE
:   Modelo de amenazas: suplantación, manipulación, repudio, revelación de información, denegación de servicio, elevación de privilegios.

System One (modelo)
:   Categoría de modelos para decisiones rápidas y estructuradas que consume software, por analogía con el "Sistema 1" de Kahneman.

Token
:   Unidad de texto que procesa un modelo de lenguaje; mide contexto, precio y latencia.

WAL
:   *Write-Ahead Log*: registro donde la base de datos escribe los cambios antes de aplicarlos; garantiza durabilidad.

Watermark
:   Marca de tiempo que indica que no se esperan más eventos anteriores; permite cerrar ventanas en streaming. → [Streaming](datos/streaming.md)

Zona de disponibilidad (AZ)
:   Uno o varios centros de datos aislados dentro de una región cloud, con energía y red independientes. → [Cloud](cloud/index.md#infraestructura-global)
