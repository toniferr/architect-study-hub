# Entrevista: Arquitectura

Estilos de arquitectura, DDD, APIs, decisiones y arquitectura limpia. La pregunta oculta en casi todas es la misma:
**¿sabes justificar una decisión con sus *trade-offs* y el contexto?** "Depende" es válido solo si dices de qué.

## Estilos de arquitectura

Teoría: [Estilos de arquitectura](../arquitectura/estilos.md)

??? question "Básico · ¿Monolito o microservicios?"
    Depende del **equipo y del dominio**, no de la moda:

    - **Monolito (modular)**: un despliegue, transacciones locales, depuración simple. Ideal al empezar y con pocos
      equipos. Su problema no es ser monolito, sino ser un monolito **sin límites internos**.
    - **Microservicios**: despliegue y escalado independientes, autonomía de equipos, aislamiento de fallos. A cambio:
      red, consistencia eventual, observabilidad distribuida y mucha más operación.

    Regla: empezar con un **monolito modular** y extraer servicios cuando haya una razón concreta (equipos que se
    bloquean, escalado o cadencias distintas).

    **Repregunta:** ¿qué es un monolito distribuido? — Microservicios que deben desplegarse juntos o se llaman de forma
    síncrona en cadena: todos los costes de distribuir y ninguna ventaja.

??? question "Medio · Explica la arquitectura hexagonal."
    El **dominio** está en el centro y no depende de nada externo. Se comunica mediante **puertos** (interfaces que
    define el propio dominio): de entrada (casos de uso) y de salida (repositorios, mensajería). Los **adaptadores**
    los implementan: REST, Kafka, JPA. Las dependencias apuntan siempre hacia dentro.

    Ventajas: dominio testeable sin infraestructura, cambiar de tecnología toca solo adaptadores. Coste: más
    interfaces y mapeos; no compensa en un CRUD sencillo.

    **Repregunta:** ¿qué relación tiene con la arquitectura limpia? — Es la misma idea (regla de dependencias) con
    otro dibujo; la limpia detalla más capas (entidades, casos de uso).

??? question "Medio · ¿Cómo mantienes la consistencia de datos entre microservicios sin transacciones distribuidas?"
    Con **sagas**: una secuencia de transacciones locales, cada una con su **acción compensatoria** si un paso
    posterior falla. Pueden ser **coreografiadas** (cada servicio reacciona a eventos) u **orquestadas** (un
    coordinador dirige los pasos).

    Para publicar eventos de forma fiable: **outbox transaccional** (guardar el evento en la misma transacción que
    el cambio y publicarlo después, p. ej. con CDC). Consumidores **idempotentes**, porque habrá duplicados.

    **Repregunta:** ¿por qué no usar 2PC? — Bloquea recursos, el coordinador es un punto único de fallo y muchos
    sistemas (Kafka, APIs externas) no lo soportan.

??? question "Medio · ¿Coreografía u orquestación?"
    - **Coreografía**: los servicios reaccionan a eventos sin coordinador. Bajo acoplamiento, pero el flujo completo
      **no está en ningún sitio** y es difícil de seguir y de cambiar con muchos pasos.
    - **Orquestación**: un orquestador (Temporal, Step Functions, Camunda o un servicio propio) conoce el flujo,
      gestiona errores, *timeouts* y compensaciones. Más visible y controlable, a cambio de un componente central.

    Pocos pasos y reacciones independientes → coreografía; procesos de negocio largos con compensaciones →
    orquestación.

    **Repregunta:** ¿cómo depuras una coreografía? — Trazas distribuidas que propaguen el contexto a través de los
    mensajes, y un ID de correlación en cada evento.

??? question "Avanzado · ¿Cuándo usarías event sourcing y qué problemas trae?"
    Guardar los **eventos** que cambian el estado, no el estado actual; el estado se reconstruye reproduciéndolos.
    Útil cuando la auditoría y la historia son parte del dominio (contabilidad, pagos), para reconstruir vistas
    nuevas o depurar "cómo llegamos aquí".

    Problemas: evolución de esquemas de eventos que nunca se borran, *snapshots* para no reproducir millones, consultas
    que exigen proyecciones (CQRS) con consistencia eventual, derecho al olvido (RGPD) y una curva de aprendizaje alta.

    **Repregunta:** ¿cómo cumples el borrado de datos personales? — *Crypto-shredding*: cifrar los datos personales
    con una clave por persona y destruir la clave.

??? question "Avanzado · ¿Qué es una arquitectura basada en celdas?"
    Dividir el sistema en **celdas** independientes y completas (cada una con su pila entera), cada una sirviendo a un
    subconjunto de clientes, con una **capa de enrutamiento** fina delante. Un fallo o un mal despliegue afecta solo
    a una celda: limita el **radio de impacto** y permite escalar añadiendo celdas.

    Costes: enrutamiento y reparto de clientes, operaciones entre celdas, más infraestructura duplicada.

    **Repregunta:** ¿qué relación tiene con el edge? — Cada sitio edge es, de hecho, una celda: autónoma, con su
    propia pila y desplegada por oleadas.

## Domain-Driven Design

Teoría: [Domain-Driven Design](../arquitectura/ddd.md)

??? question "Básico · ¿Qué es un bounded context?"
    Un límite explícito dentro del cual un modelo y su **lenguaje ubicuo** son coherentes. "Cliente" en ventas y en
    facturación son conceptos distintos con datos distintos: cada contexto tiene el suyo. Suele corresponder con un
    equipo y es la mejor guía para los límites de un microservicio o un módulo.

    **Repregunta:** ¿cómo se integran dos contextos? — Según el *context map*: socios, cliente-proveedor,
    conformista, capa anticorrupción, lenguaje publicado.

??? question "Medio · ¿Qué es un agregado y qué reglas sigues al diseñarlo?"
    Un grupo de objetos que se trata como **una unidad de consistencia**, con una **raíz** por la que se accede todo.
    Reglas (Vaughn Vernon):

    - Proteger las **invariantes** dentro del límite del agregado.
    - Diseñar agregados **pequeños**.
    - Referenciar otros agregados **por ID**, no por objeto.
    - **Una transacción modifica un agregado**; entre agregados, consistencia eventual con eventos de dominio.

    **Repregunta:** ¿qué pasa si un agregado es muy grande? — Contención (bloqueos y conflictos de versión) y cargas
    lentas.

??? question "Medio · ¿Qué es una capa anticorrupción y cuándo la usas?"
    Una capa de traducción entre tu modelo y el de un sistema externo o *legacy*, para que sus conceptos y su
    calidad **no contaminen** tu dominio. La usas al integrar sistemas que no controlas o con modelos pobres, y en
    migraciones (*strangler fig*).

    **Repregunta:** ¿cuándo aceptarías ser conformista? — Cuando el modelo externo es bueno o estándar y traducirlo
    cuesta más de lo que aporta.

??? question "Medio · ¿Para qué sirve un Event Storming?"
    Un taller con expertos de negocio y técnicos donde se pone en una pared el flujo de **eventos de dominio** (en
    pasado: "Pedido confirmado") y después los comandos, actores, políticas y agregados. Saca a la luz el lenguaje,
    los puntos calientes y los **límites naturales** de los contextos. Rápido y barato comparado con descubrirlo en
    el código.

    **Repregunta:** ¿qué señal indica un límite de contexto? — El cambio de significado de una palabra, o de actor y
    de cadencia en el flujo de eventos.

## Diseño de APIs

Teoría: [Diseño de APIs](../arquitectura/apis.md)

??? question "Básico · ¿REST, gRPC, GraphQL o eventos?"
    - **REST**: público, cacheable, universal. Recursos y verbos HTTP.
    - **gRPC**: entre servicios internos; contrato estricto (Protobuf), binario, *streaming*, baja latencia. Peor
      para navegadores.
    - **GraphQL**: clientes con necesidades de datos muy variadas (varias apps); el cliente pide lo que necesita.
      Complica caché, autorización por campo y el coste de las consultas.
    - **Eventos asíncronos**: notificar cambios sin acoplar en el tiempo.

    **Repregunta:** ¿qué es API-first? — Diseñar y acordar el contrato (OpenAPI, AsyncAPI) antes de implementar,
    para generar código, *mocks* y tests de contrato.

??? question "Medio · ¿Cómo haces que un POST sea idempotente?"
    Con una **clave de idempotencia**: el cliente genera un UUID por operación y lo envía en una cabecera
    (`Idempotency-Key`). El servidor guarda la clave con el resultado (de forma atómica con la operación, o con una
    restricción única); si llega repetida, devuelve **la misma respuesta** sin repetir el efecto. La clave caduca tras
    un tiempo.

    **Repregunta:** ¿qué métodos HTTP son idempotentes por definición? — GET, PUT, DELETE, HEAD, OPTIONS; POST y
    PATCH no.

??? question "Medio · ¿Cómo versionas una API y evitas romper a los clientes?"
    - Primero, **evolucionar sin romper**: añadir campos opcionales, nunca quitar ni cambiar el significado; clientes
      tolerantes (ignorar campos desconocidos).
    - Si hay que romper: versión mayor en la URL (`/v2`) o en una cabecera / tipo de medio, conviviendo ambas.
    - **Deprecación** comunicada (cabeceras `Deprecation` y `Sunset`), métricas de quién usa la versión antigua y
      plazo de retirada.

    **Repregunta:** ¿cómo detectas un cambio incompatible antes de publicarlo? — Comparar el OpenAPI en el CI
    (oasdiff) y tests de contrato.

??? question "Medio · ¿Cómo paginas una API con millones de registros?"
    Con **cursor** (*keyset*), no con `offset`: el cliente envía el último valor visto (`?after=<id>`) y la consulta
    usa el índice (`WHERE id > ? ORDER BY id LIMIT 50`). `OFFSET 1000000` obliga a recorrer y descartar un millón
    de filas y da resultados inconsistentes si se insertan datos entre páginas.

    **Repregunta:** ¿cómo diseñas una operación que tarda minutos? — Responder `202 Accepted` con un recurso de
    operación que se consulta (o un *webhook* al acabar).

??? question "Avanzado · ¿Qué riesgos de seguridad son específicos de las APIs?"
    Del OWASP API Security Top 10, los más frecuentes:

    - **BOLA**: autorización rota a nivel de objeto (`/pedidos/123` de otro usuario). Comprobar la propiedad en cada
      acceso, no solo la autenticación.
    - Autorización rota a nivel de **propiedad** (*mass assignment*, exponer campos de más).
    - **Consumo de recursos sin límite**: paginación, tamaño, *rate limiting*.
    - Autorización rota a nivel de función (endpoints de administración).
    - Inventario de APIs desactualizado (versiones viejas expuestas) y SSRF.

    **Repregunta:** ¿por qué el gateway no basta? — Autentica y limita, pero la autorización por objeto depende del
    dominio y debe estar en el servicio.

## Decisiones y arquitectura limpia

Teoría: [ADRs y trade-offs](../arquitectura/adr.md) · [Arquitectura Limpia](../libros/clean-architecture.md)

??? question "Básico · ¿Qué es un ADR y qué incluye?"
    Un *Architecture Decision Record*: un documento corto, versionado con el código, que registra **una decisión
    significativa**: contexto, decisión, **alternativas consideradas**, consecuencias (positivas y negativas) y
    estado. No se edita: si cambia la decisión, se crea otro ADR que lo sustituye.

    **Repregunta:** ¿qué decisión merece un ADR? — Las que son difíciles de revertir o afectan a varios equipos:
    estilo de arquitectura, base de datos, protocolo de integración, herramienta de despliegue.

??? question "Medio · ¿Cómo analizas un trade-off delante de stakeholders?"
    - Aclarar los **atributos de calidad** que importan en este contexto (latencia, coste, plazo, operabilidad) y
      priorizarlos con negocio.
    - Comparar 2-3 opciones reales con una tabla de criterios, incluyendo **no hacer nada**.
    - Hacer explícitos supuestos, riesgos y **coste de revertir**.
    - Recomendar una, explicar qué se sacrifica y dejarlo escrito en un ADR.

    **Repregunta:** ¿qué haces si la decisión es reversible y barata? — Decidir rápido y medir; el análisis profundo
    es para las puertas de un solo sentido.

??? question "Medio · ¿Qué es la regla de dependencias de la arquitectura limpia?"
    Las dependencias de código fuente **solo apuntan hacia dentro**: entidades ← casos de uso ← adaptadores ←
    frameworks y drivers. Nada interior conoce nada exterior (ni la base de datos, ni la web, ni el framework).
    Cuando el flujo de control va hacia fuera (guardar en BD), se invierte con una **interfaz definida dentro**.

    **Repregunta:** ¿anotar las entidades de dominio con JPA rompe la regla? — Técnicamente sí (el dominio conoce el
    framework); es un compromiso pragmático habitual si se acepta conscientemente.

??? question "Avanzado · ¿Qué son las fitness functions?"
    Comprobaciones **automáticas y objetivas** de que la arquitectura mantiene una característica: reglas de
    dependencias entre paquetes (ArchUnit), presupuestos de latencia en tests de carga, tamaño de imagen, políticas
    de Kyverno, cobertura de alertas. Convierten decisiones de arquitectura en algo que el CI vigila, en vez de
    documentos que nadie relee.

    **Repregunta:** ¿un ejemplo con ArchUnit? — "Las clases de `..domain..` no dependen de `org.springframework..`".
