# Entrevista: Datos

Kafka, procesamiento en *streaming* y plataformas de datos. Se espera que sepas explicar **las garantías** (orden,
durabilidad, entrega) y qué cuesta cada una, más que los nombres de las herramientas.

## Apache Kafka

Teoría: [Apache Kafka](../datos/kafka.md)

??? question "Básico · Explica topic, partición, offset y grupo de consumidores."
    - **Topic**: un log de eventos con nombre.
    - **Partición**: cada topic se divide en logs ordenados e inmutables; es la unidad de **paralelismo y de orden**.
    - **Offset**: la posición de un mensaje dentro de su partición; cada consumidor confirma el suyo.
    - **Grupo de consumidores**: reparte las particiones entre sus miembros (cada partición, un solo consumidor del
      grupo); distintos grupos leen el mismo topic de forma independiente.

    **Repregunta:** ¿qué pasa si tienes más consumidores que particiones? — Los sobrantes quedan ociosos: el número de
    particiones limita el paralelismo del grupo.

??? question "Básico · ¿Garantiza Kafka el orden de los mensajes?"
    Solo **dentro de una partición**. Para que los eventos de una misma entidad (un pedido) lleguen en orden, se usa
    su ID como **clave**: misma clave → misma partición. Entre particiones no hay orden global.

    **Repregunta:** ¿qué rompe el orden aunque uses clave? — Cambiar el número de particiones (cambia el reparto) y,
    sin productor idempotente, los reintentos con varias peticiones en vuelo.

??? question "Medio · ¿Cómo garantizas que un mensaje confirmado no se pierde?"
    - Productor con `acks=all`: el líder confirma cuando todas las réplicas **sincronizadas (ISR)** lo tienen.
    - `replication.factor=3` y `min.insync.replicas=2`: si quedan menos de 2 réplicas sincronizadas, se rechazan
      escrituras en vez de arriesgarse.
    - `unclean.leader.election.enable=false`: no promover una réplica atrasada.
    - Productor idempotente y reintentos.

    **Repregunta:** ¿qué sacrificas? — Latencia de escritura y disponibilidad para escribir si caen dos *brokers*.

??? question "Medio · ¿Qué significa exactly-once en Kafka y cuáles son sus límites?"
    Con **productor idempotente** (sin duplicados por reintentos) y **transacciones** (escribir en varios topics y
    confirmar los offsets de lo consumido de forma atómica), un flujo **leer-procesar-escribir dentro de Kafka**
    (Kafka Streams con `exactly_once_v2`) procesa cada mensaje una sola vez. Los consumidores deben leer con
    `isolation.level=read_committed`.

    Límite: si el procesamiento tiene **efectos externos** (llamar a una API, escribir en una BD), Kafka no puede
    garantizarlo: hace falta idempotencia en el destino.

    **Repregunta:** ¿cómo lo harías escribiendo en PostgreSQL? — Guardar el offset en la misma transacción que los
    datos, o *upsert* con clave de deduplicación.

??? question "Medio · ¿Qué provoca rebalanceos constantes y cómo lo evitas?"
    Un rebalanceo reasigna particiones cuando un consumidor entra, sale o se considera muerto. Causas típicas: el
    procesamiento de un lote tarda más que `max.poll.interval.ms`, pausas largas de GC, despliegues frecuentes.

    Soluciones: lotes más pequeños (`max.poll.records`) o procesamiento más rápido, ajustar los *timeouts*,
    **asignación cooperativa** (*incremental rebalance*, no detiene a todos), **static membership** para que un
    reinicio rápido no dispare rebalanceo, y el nuevo protocolo de grupos de consumidores gestionado por el *broker*.

    **Repregunta:** ¿cómo detectas un consumidor que se queda atrás? — Vigilando el ***consumer lag*** por partición y
    alertando cuando crece de forma sostenida.

??? question "Medio · ¿Para qué sirve la compactación de logs?"
    Un topic **compactado** conserva, para cada clave, **al menos el último valor**, y borra los antiguos. Sirve como
    tabla de estado reconstruible: configuración, el último estado de cada entidad, los *changelogs* de Kafka Streams.
    Un mensaje con valor nulo (*tombstone*) borra la clave.

    **Repregunta:** ¿retención por tiempo o compactación? — Tiempo para eventos ("qué pasó"); compactación para
    estado ("cómo está ahora").

??? question "Avanzado · ¿Cómo gestionas la evolución de los esquemas de eventos?"
    Con un **registro de esquemas** (Avro, Protobuf o JSON Schema) y reglas de **compatibilidad** comprobadas al
    publicar y en el CI:

    - **Backward** (por defecto): los consumidores nuevos leen datos viejos → actualizar consumidores primero.
    - **Forward**: los consumidores viejos leen datos nuevos → actualizar productores primero.
    - **Full**: las dos.

    Cambios seguros: añadir campos opcionales con valor por defecto. Para romper, un topic nuevo y una migración.

    **Repregunta:** ¿quién es dueño del esquema? — El productor, como contrato de datos con versión y responsable.

??? question "Avanzado · ¿Kafka, RabbitMQ o una cola gestionada (SQS)?"
    - **Kafka**: log distribuido y persistente, alto rendimiento, **relectura** (varios consumidores independientes,
      reprocesar el pasado), orden por partición. Base de *streaming* y CDC. Más complejo de operar.
    - **RabbitMQ**: *broker* de mensajes con enrutamiento flexible (exchanges), colas de trabajo, prioridades y
      confirmación por mensaje. El mensaje desaparece al consumirse.
    - **SQS / Pub/Sub / Service Bus**: colas gestionadas, cero operación, pago por uso; menos control y orden limitado.

    **Repregunta:** ¿cuándo Kafka es excesivo? — Una cola de tareas sencilla con poco volumen y sin necesidad de
    relectura.

## Procesamiento en streaming

Teoría: [Procesamiento en streaming](../datos/streaming.md)

??? question "Básico · ¿Batch o streaming?"
    **Batch**: procesar datos acotados periódicamente; simple, eficiente, latencia de horas. **Streaming**: procesar
    eventos según llegan, con latencia de segundos; más complejo (estado, orden, datos tardíos, recuperación).

    Streaming cuando el valor del dato **caduca** rápido: fraude, alertas, personalización, IoT. Batch para informes
    y entrenamiento de modelos.

    **Repregunta:** ¿qué arquitectura unifica ambos? — Kappa: todo es un *stream* y el batch es reprocesar el log
    desde el principio.

??? question "Medio · ¿Tiempo de evento o tiempo de procesamiento?"
    **Tiempo de evento**: cuándo ocurrió (marca del productor). **Tiempo de procesamiento**: cuándo lo procesa el
    sistema. Difieren por la red, reintentos o dispositivos desconectados (un sensor edge que sube datos de ayer).

    Para resultados correctos ("ventas por hora"), se agrupa por **tiempo de evento**, lo que obliga a decidir
    cuánto esperar a los eventos tardíos.

    **Repregunta:** ¿qué ocurre si agrupas por tiempo de procesamiento? — Una caída y recuperación mete los eventos
    de una hora en otra.

??? question "Medio · ¿Qué tipos de ventanas hay?"
    - **Fijas (tumbling)**: no se solapan (cada 5 minutos).
    - **Deslizantes (hopping/sliding)**: de tamaño fijo que avanzan en pasos menores (últimos 10 min, cada minuto).
    - **De sesión**: se cierran tras un periodo de inactividad; tamaño variable por usuario.
    - **Globales**: con disparadores propios.

    **Repregunta:** ¿qué ventana usarías para detectar 5 intentos de login fallidos en 1 minuto? — Una deslizante por
    usuario (o una de sesión, según el criterio exacto).

??? question "Avanzado · ¿Qué es un watermark y cómo tratas los datos tardíos?"
    Un **watermark** es la afirmación del motor de que "ya no espero eventos anteriores a T". Cuando pasa el fin de
    una ventana, la ventana puede emitirse. Compromiso: un watermark agresivo da baja latencia y descarta más datos
    tardíos; uno conservador, al revés.

    Datos tardíos: un **periodo de gracia** (*allowed lateness*) para actualizar resultados ya emitidos, una salida
    lateral para los que llegan después, o corrección en batch.

    **Repregunta:** ¿cómo se recupera el estado de un operador tras un fallo? — *Checkpoints* consistentes del estado
    (Flink) o *changelog topics* (Kafka Streams), reprocesando desde los offsets guardados.

??? question "Medio · ¿Qué es CDC y por qué es mejor que la doble escritura?"
    *Change Data Capture*: leer el **log de transacciones** de la base de datos (WAL, binlog), por ejemplo con
    **Debezium**, y publicar cada cambio como evento. La doble escritura (guardar en BD y luego publicar en Kafka)
    falla si cae entre ambas y deja los sistemas incoherentes. CDC captura solo lo **confirmado**, en orden y sin
    tocar la aplicación.

    **Repregunta:** ¿qué combina CDC con el outbox? — Escribir el evento en una tabla *outbox* en la misma
    transacción y que CDC lo publique: eventos de dominio limpios en lugar de cambios de tablas internas.

## Plataformas de datos

Teoría: [Plataformas de datos](../datos/plataformas-datos.md)

??? question "Básico · ¿OLTP u OLAP? ¿Por qué el almacenamiento columnar?"
    **OLTP**: muchas transacciones pequeñas que leen o escriben pocas filas completas (pedidos). **OLAP**: consultas
    analíticas que recorren millones de filas pero pocas columnas (ventas por región).

    El almacenamiento **columnar** guarda cada columna junta: se lee solo lo necesario, se **comprime** mucho
    (valores parecidos seguidos) y se procesa vectorizado. Malo para actualizar filas sueltas.

    **Repregunta:** ¿por qué no hacer analítica sobre la base de datos de producción? — Las consultas pesadas
    compiten con las transacciones y el modelo normalizado no está pensado para agregar.

??? question "Medio · ¿Data warehouse, data lake o lakehouse?"
    - **Warehouse**: datos estructurados y modelados, SQL rápido, almacenamiento y cómputo acoplados (o gestionados).
    - **Lake**: ficheros baratos en almacenamiento de objetos, cualquier formato; sin gobierno se convierte en
      "pantano".
    - **Lakehouse**: ficheros abiertos (Parquet) en almacenamiento de objetos más un **formato de tabla**
      (**Iceberg**, Delta, Hudi) que añade transacciones ACID, evolución de esquemas y *time travel*; varios motores
      leen las mismas tablas.

    **Repregunta:** ¿qué aporta Iceberg frente a "carpetas de Parquet"? — Instantáneas atómicas, metadatos de
    particiones y estadísticas para podar ficheros, y cambios de esquema y partición sin reescribir.

??? question "Medio · ¿ETL o ELT? ¿Qué es la arquitectura medallón?"
    **ETL**: transformar antes de cargar (en un servidor intermedio). **ELT**: cargar en bruto y transformar
    **dentro** del warehouse/lakehouse con SQL (dbt), aprovechando su cómputo elástico; es lo habitual hoy.

    **Medallón**: capas **bronce** (crudo, tal cual llega), **plata** (limpio, deduplicado, tipado) y **oro**
    (agregado y modelado para negocio).

    **Repregunta:** ¿qué aporta dbt? — Transformaciones SQL versionadas con dependencias, tests de datos,
    documentación y linaje.

??? question "Avanzado · ¿Qué es data mesh y qué es un contrato de datos?"
    **Data mesh**: en vez de un equipo central de datos que es cuello de botella, los **dominios** son dueños de sus
    datos y los publican como **productos de datos** (con calidad, documentación y SLO), sobre una **plataforma de
    autoservicio** común y un **gobierno federado**. Es sobre todo un cambio organizativo.

    Un **contrato de datos** es el acuerdo explícito del productor: esquema, semántica, calidad, frescura, responsable
    y política de cambios, validado automáticamente.

    **Repregunta:** ¿cuándo no lo recomendarías? — En organizaciones pequeñas o con poca madurez de datos: el coste de
    coordinación supera al de un equipo central.

??? question "Medio · ¿Cómo garantizas la calidad de los datos?"
    - Tests automáticos en el *pipeline*: nulos, unicidad, rangos, integridad referencial, volumen esperado
      (dbt tests, Great Expectations, Soda).
    - Monitorizar **frescura, volumen, esquema y distribución** (observabilidad de datos).
    - **Linaje** para saber qué se ve afectado por un problema.
    - Detener la publicación (o marcarla) cuando falla un control, en vez de propagar datos malos.

    **Repregunta:** ¿quién arregla un dato malo? — El dueño del producto de datos en origen, no quien lo consume.
