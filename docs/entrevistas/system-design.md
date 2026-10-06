# Entrevista: System Design

Conceptos de sistemas distribuidos y casos de diseño. En la ronda de diseño real tendrás 45-60 minutos para un solo
caso; aquí cada caso se reduce a **lo que el entrevistador quiere oír**. Practica los casos completos en voz alta con
el [marco de 4 pasos](../libros/system-design-interview.md).

## Conceptos

Teoría: [Fundamentos de System Design](../system-design/fundamentos.md)

??? question "Básico · ¿Escalado vertical u horizontal?"
    **Vertical**: una máquina más grande. Simple, sin cambios en la aplicación, pero con techo, coste no lineal y
    punto único de fallo. **Horizontal**: más máquinas detrás de un balanceador. Sin techo práctico y tolerante a
    fallos, pero exige servicios **sin estado** (la sesión fuera, en Redis o en el token) y complica los datos.

    **Repregunta:** ¿qué es lo más difícil de escalar en horizontal? — El estado: la base de datos (réplicas de
    lectura, particionado) y las cachés compartidas.

??? question "Básico · ¿Qué estrategias de caché conoces y qué problemas tienen?"
    - **Cache-aside**: la app lee de la caché y, si falla, de la BD y rellena. La más común.
    - **Read-through / write-through**: la caché se encarga de leer o escribir en la BD.
    - **Write-behind**: se escribe en la caché y se vuelca después (rápido, riesgo de pérdida).

    Problemas: **invalidación** y datos obsoletos (TTL), **estampida** cuando expira una clave muy caliente (bloqueo
    por clave o refresco anticipado), **penetración** con claves que no existen (cachear el negativo o un filtro de
    Bloom) y claves calientes que saturan un nodo.

    **Repregunta:** ¿dónde cachearías en una arquitectura web? — Navegador, CDN, gateway, caché distribuida y caché
    local en el servicio, de fuera hacia dentro.

??? question "Medio · Explica el teorema CAP y por qué PACELC es más útil."
    **CAP**: ante una **partición de red**, un sistema distribuido debe elegir entre **consistencia** (rechazar o
    esperar) y **disponibilidad** (responder con datos quizá obsoletos). Sin particiones no hay que elegir.

    **PACELC** añade el caso normal: si hay **P**artición, **A** o **C**; si no (**E**lse), **L**atencia o
    **C**onsistencia. Es más útil porque las particiones son raras y el compromiso latencia-consistencia se paga
    siempre (p. ej. DynamoDB y Cassandra: PA/EL; bases de datos con consenso: PC/EC).

    **Repregunta:** ¿qué sistemas eligen CP? — Los de coordinación: etcd, ZooKeeper, bases de datos con Raft/Paxos.

??? question "Medio · ¿Replicación líder-seguidor, multilíder o sin líder?"
    - **Líder único**: todas las escrituras al líder, réplicas para leer. Simple; lecturas posiblemente obsoletas
      (*replication lag*) y conmutación del líder delicada.
    - **Multilíder**: escritura en varias regiones; hay que resolver **conflictos** (último gana, CRDTs).
    - **Sin líder** (Dynamo, Cassandra): se escribe y lee en varias réplicas con **quórum** (W + R > N para leer lo
      último escrito).

    **Repregunta:** ¿cómo garantizas "leer tus propias escrituras" con réplicas asíncronas? — Leer del líder durante
    un tiempo tras escribir, o enrutar por versión mínima conocida.

??? question "Medio · ¿Cómo particionas (sharding) una base de datos y qué problemas aparecen?"
    Por **rango** (bueno para consultas por rango, riesgo de puntos calientes), por **hash** de la clave (reparto
    uniforme, pierde el orden) o por **directorio** (tabla de búsqueda flexible). Elegir bien la **clave de
    partición** es lo esencial.

    Problemas: consultas y transacciones entre particiones, **claves calientes** (una celebridad), **rebalanceo** al
    añadir nodos, y unir datos de varias particiones.

    **Repregunta:** ¿cómo evitas mover todos los datos al añadir un nodo? — *Consistent hashing* con nodos virtuales,
    o un número fijo de particiones lógicas mayor que el de nodos.

??? question "Medio · ¿Qué es el consistent hashing?"
    Nodos y claves se colocan en un **anillo** de hash; cada clave pertenece al primer nodo en sentido horario. Al
    añadir o quitar un nodo solo se mueven las claves de su tramo (≈ 1/n), no casi todas como con `hash % n`.
    Los **nodos virtuales** (varias posiciones por nodo) reparten la carga de forma uniforme y permiten pesos.

    **Repregunta:** ¿dónde se usa? — Dynamo/Cassandra, cachés distribuidas, balanceo con afinidad (Envoy *ring hash*).

??? question "Medio · ¿Qué garantías de entrega existen en mensajería y cómo consigues 'exactamente una vez'?"
    **Como mucho una vez** (se puede perder), **al menos una vez** (puede duplicarse) y **exactamente una vez**. En la
    práctica: entrega **al menos una vez + consumidor idempotente** (clave de deduplicación, *upsert*, tabla de
    mensajes procesados en la misma transacción). Kafka ofrece *exactly-once* dentro de Kafka con productor
    idempotente y transacciones, pero los efectos externos siguen necesitando idempotencia.

    **Repregunta:** ¿qué es una *dead letter queue*? — Donde van los mensajes que fallan tras N reintentos, para no
    bloquear la cola y revisarlos aparte.

??? question "Avanzado · ¿Cómo generas IDs únicos en un sistema distribuido?"
    - **UUID v4**: sin coordinación, pero 128 bits y aleatorio (malo como clave de índice B-tree). **UUID v7**
      ordena por tiempo y lo mitiga.
    - **Snowflake**: 64 bits = marca de tiempo + ID de máquina + secuencia. Ordenable por tiempo, compacto, sin
      coordinación central; depende de relojes razonables y de asignar bien los IDs de máquina.
    - **Rangos preasignados** desde una BD (cada nodo reserva un bloque).

    **Repregunta:** ¿qué pasa si el reloj de una máquina retrocede? — Snowflake puede generar duplicados: hay que
    detectarlo y esperar o rechazar.

??? question "Avanzado · ¿Qué patrones de fiabilidad aplicas en las llamadas entre servicios?"
    - **Timeouts** en toda llamada (sin ellos, los hilos se agotan).
    - **Reintentos** solo en operaciones idempotentes, con **backoff exponencial y jitter** y un presupuesto.
    - **Circuit breaker**: dejar de llamar a una dependencia caída y fallar rápido.
    - **Bulkheads**: pools separados por dependencia.
    - **Degradación**: respuesta por defecto o desde caché; *load shedding* ante saturación.

    **Repregunta:** ¿qué es una tormenta de reintentos? — Reintentos en varias capas que multiplican la carga sobre un
    servicio que ya está mal; se evita reintentando en una sola capa y con presupuesto.

## Método y estimaciones

Teoría: [System Design Interview](../libros/system-design-interview.md)

??? question "Básico · ¿Cómo estructuras una entrevista de diseño de sistemas?"
    1. **Requisitos** (5-10 min): funcionales, no funcionales (latencia, disponibilidad, consistencia), escala.
       Preguntar, no suponer.
    2. **Estimaciones** rápidas: QPS, almacenamiento, ancho de banda.
    3. **Diseño de alto nivel**: API, componentes, flujo de datos y modelo de datos. Acordarlo con el entrevistador.
    4. **Profundizar** en 2-3 puntos críticos (cuellos de botella, escalado, fallos).
    5. **Cierre**: errores, monitorización, qué mejorarías con más tiempo.

    **Repregunta:** ¿qué errores son más comunes? — Lanzarse a dibujar sin requisitos, diseñar para una escala que
    nadie ha pedido y no hablar de *trade-offs*.

??? question "Medio · Estima el almacenamiento y el QPS de un servicio con 100 M de usuarios activos al día que publican 2 mensajes."
    - Escrituras: 100 M × 2 / 86 400 s ≈ **2 300/s** de media; pico ≈ ×2-3 → ~5-7 k/s.
    - Si cada usuario lee 50 mensajes: 5 000 M lecturas/día ≈ **58 000/s**: sistema de **lectura intensiva**
      (ratio ~25:1) → caché y réplicas.
    - Almacenamiento: 200 M mensajes/día × ~1 KB ≈ **200 GB/día**, ~73 TB/año sin contar réplicas ni multimedia.

    **Repregunta:** ¿qué número conviene recordar? — Un día tiene ~10⁵ segundos: 1 M/día ≈ 12/s.

## Casos de diseño

Teoría: casos resueltos en [System Design](../system-design/index.md)

??? question "Medio · Diseña un rate limiter distribuido."
    - Dónde: en el **gateway** o como *middleware*, con reglas por usuario, IP o API key.
    - Algoritmo: **token bucket** (permite ráfagas, dos parámetros) o **contador de ventana deslizante** (preciso y
      barato). Ventana fija tiene picos en el borde.
    - Estado compartido en **Redis** con un **script Lua** para que leer-y-actualizar sea atómico.
    - Respuesta `429` con `Retry-After` y cabeceras de cuota; decidir si se **falla abierto** si Redis cae.

    **Repregunta:** ¿cómo evitas que Redis sea el cuello de botella? — Particionar por clave, cuotas locales con
    sincronización periódica (aproximado) y réplicas por región.

??? question "Medio · Diseña un acortador de URLs."
    - API: `POST /urls` → código corto; `GET /{codigo}` → **301/302** a la URL larga.
    - Código: **Base62** de un ID único (7 caracteres ≈ 3,5 billones) generado con Snowflake o rangos preasignados;
      mejor que un hash truncado con colisiones.
    - Lectura muy intensiva: **caché** delante de un almacén clave-valor; CDN para las más populares.
    - 301 (cacheable, menos carga) vs. 302 (permite contar clics).

    **Repregunta:** ¿cómo evitas que se adivinen los códigos? — Mezclar o cifrar el ID antes de codificar, o
    añadir aleatoriedad.

??? question "Avanzado · Diseña un almacén clave-valor distribuido."
    - Particionado con **consistent hashing** y nodos virtuales; replicación en N nodos siguientes del anillo.
    - Consistencia ajustable con **quórum** (N, W, R).
    - Conflictos: **relojes vectoriales** o último que escribe gana.
    - Fallos: *gossip* para detectarlos, *sloppy quorum* + *hinted handoff* para los temporales, **árboles de
      Merkle** para reparar réplicas.
    - Motor: **LSM-tree** (commit log, memtable, SSTables, compactación, filtros de Bloom).

    **Repregunta:** ¿por qué un LSM-tree escribe tan rápido? — Las escrituras son secuenciales (log + memoria); el
    coste se paga después en compactación y en lecturas.

??? question "Medio · Diseña un sistema de notificaciones (push, SMS, email)."
    - Servicio de notificaciones que valida, aplica **preferencias** y límites, y encola por canal.
    - **Colas por canal** y *workers* que llaman a proveedores externos (APNs, FCM, SMS, email): un proveedor lento no
      bloquea a los demás.
    - Fiabilidad: reintentos con backoff, **deduplicación** por ID de evento, registro del estado de cada envío.
    - Plantillas, *rate limiting* por usuario y seguimiento de entregas y aperturas.

    **Repregunta:** ¿cómo evitas enviar dos veces el mismo email? — Clave de idempotencia por notificación y
    comprobación antes de llamar al proveedor (aceptando que "exactamente una vez" con un tercero no existe).

??? question "Avanzado · Diseña un chat como WhatsApp."
    - Conexiones persistentes con **WebSocket** a servidores de chat con estado; un servicio de descubrimiento
      asigna servidor.
    - Mensaje: emisor → su servidor → cola/ruta al servidor del destinatario; si está desconectado, se guarda y se
      envía *push*.
    - **Orden**: IDs secuenciales por conversación. Almacén: base de datos de columnas anchas (clave
      conversación + tiempo).
    - Varios dispositivos: cada uno guarda el último ID recibido y sincroniza.
    - **Presencia** con *heartbeats* y publicación a los contactos, con cuidado del *fan-out* en grupos grandes.

    **Repregunta:** ¿cómo escalas a millones de conexiones? — Servidores optimizados para conexiones (E/S no
    bloqueante), reparto por usuario y drenado ordenado en los despliegues.

??? question "Medio · Diseña el news feed de una red social."
    - **Fan-out en escritura** (*push*): al publicar, se añade el ID a la caché del feed de cada seguidor. Lectura muy
      rápida; carísimo para cuentas con millones de seguidores.
    - **Fan-out en lectura** (*pull*): se construye al leer. Barato al escribir, lento al leer.
    - **Híbrido**: *push* para la mayoría, *pull* para las celebridades, y se mezcla al leer.
    - El feed guarda solo IDs; el contenido se hidrata desde cachés de posts y usuarios.

    **Repregunta:** ¿qué haces con usuarios inactivos? — No precalcular su feed; construirlo al volver.

??? question "Medio · Diseña un web crawler."
    - **URL Frontier**: colas por prioridad y por **host** para ser educado (un host, una cola, con espera entre
      peticiones) y respetar `robots.txt`.
    - *Fetchers* distribuidos, caché de DNS, parseo y extracción de enlaces.
    - **Deduplicación** de URLs (filtro de Bloom) y de contenido (huella / *SimHash*).
    - Robustez: *timeouts*, trampas de enlaces infinitos (límite de profundidad), *checkpoints*.
    - **Recrawling** según la frecuencia de cambio de cada página.

    **Repregunta:** ¿por qué un filtro de Bloom? — Responde "seguro que no / quizá sí" con muy poca memoria para miles
    de millones de URLs.

??? question "Medio · Diseña el autocompletado de un buscador."
    - Un **trie** con el **top-k precalculado en cada nodo**: la respuesta es O(longitud del prefijo).
    - Se construye **fuera de línea** a partir de los logs de búsqueda agregados (por hora o día) y se publica como
      instantánea; no se actualiza en cada búsqueda.
    - Servido desde memoria, replicado y particionado por prefijo; caché en el navegador y en el CDN.
    - Filtros de contenido inapropiado y personalización por encima.

    **Repregunta:** ¿cómo reduces peticiones del cliente? — *Debounce* de las pulsaciones y cachear respuestas por
    prefijo.

??? question "Avanzado · Diseña una plataforma de vídeo como YouTube."
    - **Subida** directa a almacenamiento de objetos con URLs prefirmadas y subida por partes reanudable.
    - **Transcodificación** como un **DAG** de tareas (dividir en trozos, codificar en varias resoluciones y
      códecs, miniaturas, marcas de agua) en *workers* paralelos.
    - **Reproducción** con *streaming* adaptativo (**HLS/DASH**): el reproductor cambia de calidad según el ancho de
      banda; segmentos servidos desde un **CDN**.
    - Coste: el CDN y el almacenamiento dominan; servir los vídeos populares por CDN y los de cola larga desde
      origen, y no transcodificar todas las resoluciones de todo.

    **Repregunta:** ¿cómo calculas el coste del CDN? — Vídeos vistos × duración × bitrate medio × precio por GB.

??? question "Medio · Diseña un servicio de 'lugares cercanos' (proximidad)."
    - Una consulta `WHERE lat BETWEEN … AND lng BETWEEN …` no escala: dos rangos independientes no usan bien un índice.
    - **Índice geoespacial**: **geohash** (cadena por prefijos; buscar la celda y sus 8 vecinas), *quadtree*, o
      celdas **S2/H3**.
    - Datos de negocios casi estáticos y de **lectura intensiva**: réplicas de lectura y caché por celda.
    - Ubicaciones que cambian a menudo (repartidores): almacén en memoria como Redis GEO.

    **Repregunta:** ¿qué problema tiene geohash en los bordes? — Dos puntos cercanos pueden caer en celdas con prefijos
    distintos: por eso se consultan las vecinas.

??? question "Avanzado · Diseña un sistema de pagos."
    - **Máquina de estados** explícita del pago (creado → autorizado → capturado → liquidado / fallido / reembolsado).
    - **Idempotencia de extremo a extremo**: clave del cliente, y la misma clave hacia el proveedor de pagos.
    - **Libro contable de doble entrada**: cada movimiento genera asientos que suman cero; inmutable, sin `UPDATE`.
    - **Reconciliación** diaria con los ficheros del banco o proveedor para detectar descuadres.
    - Consistencia fuerte en el núcleo, reintentos seguros, *outbox* para eventos, auditoría y cumplimiento
      (PCI DSS: no guardar datos de tarjeta, tokenizar).

    **Repregunta:** ¿qué haces si el proveedor no responde (*timeout*)? — No asumir fallo: marcar como "desconocido",
    consultar su estado con la clave de idempotencia y reconciliar.
