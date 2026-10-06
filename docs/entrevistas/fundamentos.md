# Entrevista: Fundamentos

Algoritmos, redes, concurrencia, bases de datos y cómo se ejecuta el código. Es el filtro técnico clásico: no se
espera que lo sepas todo, sí que uses el vocabulario con precisión y que razones los porqués.

## Algoritmos y estructuras de datos

Teoría: [Algoritmos y estructuras de datos](../fundamentos/algoritmos.md) ·
[Cracking the Coding Interview](../libros/cracking-the-coding-interview.md)

??? question "Básico · ¿Qué mide la notación Big O y por qué no basta con medir el tiempo?"
    Mide **cómo crece** el coste (tiempo o memoria) de un algoritmo **al crecer la entrada**, en el peor caso y
    ignorando constantes. Medir el tiempo depende de la máquina, del tamaño de prueba y de la caché; Big O dice qué
    pasará con 10× o 1000× datos.

    - O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ).
    - Se quitan constantes y términos menores: O(2n + 5) = O(n).
    - Importa también el **coste amortizado** (añadir a un `ArrayList` es O(1) amortizado aunque a veces copie).

    **Repregunta:** ¿cuándo elegirías un algoritmo O(n²) frente a uno O(n log n)? — Con entradas pequeñas y acotadas:
    las constantes y la localidad de caché pesan más (por eso *Timsort* usa inserción en tramos cortos).

??? question "Básico · ¿Cómo funciona un HashMap por dentro y qué pasa con las colisiones?"
    Un array de *buckets*: el `hashCode()` de la clave, mezclado, da el índice. Las claves que caen en el mismo
    bucket (colisión) se encadenan; en Java, a partir de 8 elementos el bucket pasa de lista a **árbol rojo-negro**
    (O(log n) en vez de O(n)). Cuando el factor de carga supera 0,75, el array **se duplica** y se redistribuye.

    - Media O(1) en `get`/`put`; peor caso O(log n) en Java 8+.
    - `equals` y `hashCode` deben ser coherentes; una clave mutable que cambia su hash se "pierde" en el mapa.

    **Repregunta:** ¿por qué no es seguro compartir un `HashMap` entre hilos? — Escrituras concurrentes pueden
    corromper la estructura durante el redimensionado; usa `ConcurrentHashMap`.

??? question "Medio · Te dan un problema que no conoces en la pizarra. ¿Cómo lo abordas?"
    Con un proceso, no con prisa:

    1. **Aclara** entradas, salidas, tamaños y casos límite; inventa un ejemplo concreto.
    2. Da primero una **solución de fuerza bruta** y su complejidad.
    3. **Optimiza** buscando cuellos de botella, trabajo duplicado e información no usada (técnica BUD), y piensa
       en patrones: dos punteros, ventana deslizante, hash map, búsqueda binaria, BFS/DFS, heap, programación dinámica.
    4. **Implementa** con nombres claros y en voz alta.
    5. **Prueba** con el ejemplo y los casos límite, y corrige.

    **Repregunta:** ¿qué señal te hace pensar en programación dinámica? — Subproblemas que se repiten y
    subestructura óptima ("número de formas", "mínimo coste", decisiones encadenadas).

??? question "Medio · ¿Cuándo usarías BFS y cuándo DFS?"
    - **BFS** (cola) explora por niveles: da el **camino más corto en número de saltos** en grafos sin pesos;
      también para "distancia mínima" o propagación por capas. Más memoria en grafos anchos.
    - **DFS** (pila o recursión) llega al fondo primero: detección de ciclos, componentes conexas, **orden
      topológico**, backtracking. Cuidado con la profundidad de la pila.
    - Con pesos positivos, el camino más corto es **Dijkstra** (BFS con cola de prioridad).

    **Repregunta:** ¿dónde aparece el orden topológico en la vida real? — Resolver dependencias: pasos de un
    *pipeline*, `dependsOn` entre `Kustomizations` de Flux, orden de compilación de módulos.

??? question "Avanzado · ¿Cómo obtendrías los 10 elementos más frecuentes de un flujo enorme?"
    - Si cabe en memoria: contar con un hash map y mantener un **min-heap de tamaño k** → O(n log k).
    - Si no cabe o es un flujo infinito: estructuras **aproximadas**: *Count-Min Sketch* para contar con memoria
      fija más un heap de candidatos, o *Space-Saving*/Misra-Gries.
    - Distribuido: contar por partición (map), combinar y ordenar (reduce); en *streaming*, por ventanas.

    **Repregunta:** ¿qué error comete un Count-Min Sketch? — Solo **sobreestima** (por colisiones), nunca
    subestima; el error está acotado por la anchura y la profundidad elegidas.

## Redes

Teoría: [Redes](../fundamentos/redes.md)

??? question "Básico · ¿Qué ocurre desde que escribes una URL hasta que ves la página?"
    1. **DNS**: el navegador resuelve el nombre (cachés locales → resolver → raíz → TLD → autoritativo).
    2. **TCP** (3-way handshake) o **QUIC** sobre UDP en HTTP/3.
    3. **TLS**: negociación, validación del certificado, claves de sesión (1-RTT en TLS 1.3).
    4. **Petición HTTP**, normalmente a un CDN o balanceador, que la reenvía a un servidor.
    5. **Respuesta**, parseo del HTML, nuevas peticiones (CSS, JS, imágenes) y renderizado.

    **Repregunta:** ¿qué cambia HTTP/3? — Va sobre QUIC (UDP): sin bloqueo de cabeza de línea entre flujos,
    conexión más rápida y migración de conexión al cambiar de red.

??? question "Básico · TCP o UDP: ¿qué garantiza cada uno y cuándo elegirías UDP?"
    **TCP**: orientado a conexión, entrega **fiable y ordenada**, control de flujo y de congestión; a cambio, más
    latencia y bloqueo de cabeza de línea. **UDP**: datagramas sin garantías ni conexión, mínimo overhead.

    UDP cuando la latencia importa más que perder un paquete (voz, vídeo en directo, juegos, DNS) o cuando el
    protocolo de encima implementa su propia fiabilidad (QUIC).

    **Repregunta:** ¿por qué QUIC se construye sobre UDP y no como un protocolo nuevo? — Porque los *middleboxes*
    (NAT, firewalls) solo dejan pasar TCP y UDP; y en espacio de usuario evoluciona sin cambiar el kernel.

??? question "Medio · ¿Qué diferencia hay entre un balanceador L4 y uno L7?"
    - **L4** (transporte): reparte conexiones TCP/UDP por IP y puerto, sin mirar el contenido. Muy rápido, no
      termina TLS necesariamente. Ej.: AWS NLB.
    - **L7** (aplicación): entiende HTTP: enruta por ruta, cabecera o host, termina TLS, reintenta, hace
      *rate limiting*, *sticky sessions*. Más caro por petición. Ej.: ALB, NGINX, Envoy, un Ingress/Gateway API.

    **Repregunta:** ¿por qué un balanceador L4 reparte mal gRPC? — gRPC usa conexiones HTTP/2 largas y
    multiplexadas: L4 reparte conexiones, no peticiones, y un cliente queda pegado a un backend. Hace falta L7 o
    balanceo en el cliente.

??? question "Medio · Explica cómo funciona TLS y qué es mTLS."
    TLS da **confidencialidad, integridad y autenticación del servidor**: en el *handshake* se acuerdan algoritmos,
    el servidor presenta un certificado firmado por una CA en la que confía el cliente y ambos derivan claves
    simétricas (ECDHE, con *forward secrecy*). Después todo va cifrado con esas claves.

    En **mTLS** el **cliente también presenta certificado**: los dos extremos se autentican. Es la base de la
    identidad entre servicios en una malla de servicios o en zero trust.

    **Repregunta:** ¿qué es *forward secrecy*? — Las claves de sesión son efímeras: robar la clave privada del
    servidor más tarde no permite descifrar el tráfico grabado.

??? question "Avanzado · Un servicio en Kubernetes falla de forma intermitente al resolver nombres. ¿Cómo lo diagnosticas?"
    - Reproducir desde un Pod de depuración: `nslookup`/`dig` contra CoreDNS y contra el nombre completo.
    - Revisar `ndots:5` en `/etc/resolv.conf`: los nombres cortos generan varias consultas por búsqueda; usa FQDN
      con punto final o baja `ndots`.
    - Métricas y logs de CoreDNS (latencia, errores, saturación), número de réplicas, NodeLocal DNSCache.
    - Condiciones de carrera de conntrack con UDP (consultas A y AAAA simultáneas) en algunos kernels.
    - Network Policies que bloquean el puerto 53 (UDP **y** TCP).

    **Repregunta:** ¿qué herramientas usarías a bajo nivel? — `tcpdump` en el nodo, `conntrack -L`, y comprobar
    MTU si hay túneles (overlay) que fragmentan.

## Concurrencia y sistemas operativos

Teoría: [Concurrencia y SO](../fundamentos/concurrencia.md)

??? question "Básico · ¿Qué diferencia hay entre proceso e hilo?"
    Un **proceso** tiene su propio espacio de memoria aislado, descriptores de fichero y recursos; crearlo y cambiar
    de contexto cuesta más. Los **hilos** de un proceso **comparten la memoria** (heap) y cada uno tiene su pila y
    registros: comunicarse es barato, pero hay que sincronizar el acceso a los datos compartidos.

    **Repregunta:** ¿concurrencia o paralelismo? — Concurrencia es gestionar varias tareas a la vez (pueden
    intercalarse en un núcleo); paralelismo es ejecutarlas literalmente al mismo tiempo en varios núcleos.

??? question "Medio · ¿Qué es un deadlock y cómo lo evitas?"
    Dos o más hilos esperan para siempre recursos que tiene el otro. Requiere las **cuatro condiciones de Coffman**:
    exclusión mutua, retener y esperar, no expropiación y **espera circular**. Basta romper una:

    - **Orden global de adquisición** de los locks (rompe la espera circular): la más práctica.
    - `tryLock` con *timeout* y reintento.
    - Reducir el alcance de los locks o usar estructuras sin bloqueo / inmutables.

    **Repregunta:** ¿cómo detectas uno en una JVM en producción? — Un *thread dump* (`jstack`, `jcmd Thread.print`):
    la JVM marca los deadlocks de monitores al final del volcado.

??? question "Medio · ¿Qué es una condición de carrera? Pon un ejemplo y la solución."
    El resultado depende del intercalado de hilos. Ejemplo clásico: `contador++` desde dos hilos es leer-sumar-escribir
    y se pierden incrementos. También *check-then-act* ("si no existe, créalo").

    Soluciones: exclusión mutua (`synchronized`, locks), operaciones atómicas (`AtomicLong`, CAS), confinamiento
    (cada hilo sus datos) o inmutabilidad. En bases de datos: restricciones únicas, bloqueo optimista o `SELECT … FOR UPDATE`.

    **Repregunta:** ¿`volatile` arregla `contador++`? — No: garantiza visibilidad y orden, no atomicidad de una
    operación compuesta.

??? question "Medio · ¿Cómo dimensionas un pool de hilos?"
    Depende de la carga:

    - **CPU intensiva**: ≈ número de núcleos (+1).
    - **E/S intensiva**: núcleos × (1 + tiempo de espera / tiempo de cómputo); o, mejor, por **Little**: concurrencia
      = rendimiento × latencia.
    - Siempre con **cola acotada** y una política de rechazo: una cola infinita solo esconde la saturación.
    - En contenedores, cuenta la CPU del **límite del contenedor**, no la del nodo.

    **Repregunta:** ¿y con hilos virtuales? — No se dimensiona un pool de hilos; se limita la concurrencia sobre el
    recurso escaso (conexiones a BD) con un semáforo o el tamaño del pool de conexiones.

??? question "Avanzado · ¿Qué garantiza el Java Memory Model con volatile y happens-before?"
    Sin sincronización, un hilo puede no ver nunca las escrituras de otro (cachés, reordenaciones del compilador y la
    CPU). El JMM define relaciones **happens-before**: si A ocurre-antes que B, B ve los efectos de A. Las crean:
    liberar y adquirir el mismo monitor, escribir y luego leer una variable `volatile`, `Thread.start`/`join`, y las
    clases de `java.util.concurrent`.

    `volatile` da **visibilidad y orden**, no atomicidad. Los campos `final` bien publicados son visibles sin
    sincronizar.

    **Repregunta:** ¿por qué el *double-checked locking* necesita `volatile`? — Sin él, otro hilo puede ver la
    referencia al objeto antes de que el constructor haya terminado de escribir sus campos.

## Bases de datos

Teoría: [Bases de datos](../fundamentos/bases-de-datos.md)

??? question "Básico · Explica ACID."
    - **Atomicidad**: la transacción se aplica entera o nada.
    - **Consistencia**: pasa de un estado válido a otro (restricciones, claves foráneas).
    - **Aislamiento**: las transacciones concurrentes no se ven a medias (según el nivel elegido).
    - **Durabilidad**: lo confirmado sobrevive a una caída (WAL / redo log en disco).

    **Repregunta:** ¿la C de ACID es la misma que la de CAP? — No: en ACID es integridad de los datos; en CAP es
    que todas las réplicas devuelven el último valor (linealizabilidad).

??? question "Medio · ¿Qué anomalías evitan los niveles de aislamiento?"
    | Nivel | Evita |
    |---|---|
    | Read uncommitted | Nada (permite lecturas sucias) |
    | Read committed | Lecturas sucias (por defecto en PostgreSQL y Oracle) |
    | Repeatable read | Además, lecturas no repetibles (por defecto en MySQL InnoDB) |
    | Serializable | Además, fantasmas y *write skew* |

    El *lost update* (dos leen, ambos escriben) no lo evita read committed: hace falta bloqueo optimista
    (`version`), `SELECT … FOR UPDATE` o una actualización atómica (`SET saldo = saldo - 10`).

    **Repregunta:** ¿qué es *write skew*? — Dos transacciones leen el mismo conjunto, cada una escribe algo distinto
    y juntas violan una regla (dos médicos se quitan de guardia a la vez). Solo lo evita serializable o un bloqueo
    explícito.

??? question "Medio · ¿Cómo funciona un índice B-tree y cuándo no ayuda?"
    Un árbol equilibrado y ancho, con las claves ordenadas: búsqueda, rango y orden en O(log n) con pocas lecturas
    de disco. Un índice compuesto `(a, b)` sirve para filtrar por `a` o por `a` y `b`, **no solo por `b`** (prefijo
    izquierdo).

    No ayuda (o perjudica) cuando: la columna es poco selectiva, se aplica una función a la columna
    (`WHERE lower(email) = …` sin índice funcional), `LIKE '%texto'`, o la tabla es pequeña. Cada índice **encarece
    las escrituras** y ocupa espacio.

    **Repregunta:** ¿qué es un índice que cubre la consulta? — Uno que contiene todas las columnas que pide la
    consulta: se responde solo con el índice, sin ir a la tabla (*index-only scan*).

??? question "Medio · ¿Cómo harías una migración de esquema sin parada?"
    Con el patrón **expand / contract**, compatible hacia atrás en cada paso:

    1. **Expandir**: añadir la columna o tabla nueva (nullable, sin bloquear la tabla).
    2. Desplegar código que **escribe en ambas** y lee de la antigua.
    3. **Rellenar** los datos históricos por lotes.
    4. Cambiar las lecturas a la nueva.
    5. **Contraer**: dejar de escribir en la antigua y borrarla en un despliegue posterior.

    **Repregunta:** ¿por qué no renombrar la columna directamente? — Durante el despliegue conviven la versión
    vieja y la nueva del código; una de las dos fallaría.

??? question "Avanzado · ¿Qué es MVCC y qué problemas operativos trae?"
    *Multi-Version Concurrency Control*: cada escritura crea una nueva versión de la fila y cada transacción lee una
    **instantánea** coherente. Los lectores no bloquean a los escritores ni al revés.

    Coste: versiones muertas que hay que limpiar (**VACUUM** en PostgreSQL, *undo log* en InnoDB). Una transacción
    larga abierta impide limpiar y provoca *bloat*, consultas más lentas y, en PostgreSQL, riesgo de *wraparound*
    de IDs de transacción.

    **Repregunta:** ¿qué vigilarías? — Edad de la transacción más antigua, *bloat* de tablas e índices, actividad de
    autovacuum y conexiones `idle in transaction`.

## Compilación, ejecución y servidores

Teoría: [Compilación, ejecución y servidores](../fundamentos/ejecucion.md)

??? question "Básico · ¿Qué diferencia hay entre compilar, interpretar y JIT?"
    - **Compilación AOT**: el código se traduce a código máquina antes de ejecutarse (C, Go, Rust). Arranque rápido,
      binario por plataforma.
    - **Interpretación**: se ejecuta instrucción a instrucción leyendo el código o un bytecode (CPython).
    - **JIT**: empieza interpretando bytecode, mide qué se ejecuta mucho y lo compila a código máquina optimizado
      **con información real de ejecución** (JVM, V8, .NET). Pico de rendimiento muy alto, arranque y calentamiento
      más lentos.

    **Repregunta:** ¿por qué un JIT puede ganar a un compilador AOT? — Optimiza con datos reales: *inlining*
    especulativo de llamadas virtuales, ramas calientes; si la suposición falla, desoptimiza.

??? question "Medio · ¿Qué es un servidor de aplicaciones y en qué se diferencia de un servidor web?"
    Un **servidor web** sirve HTTP: ficheros estáticos, TLS, proxy inverso (NGINX). Un **servidor de aplicaciones**
    ejecuta código de la aplicación y le da servicios: ciclo de vida, pool de hilos, transacciones (Tomcat, Jetty,
    WildFly). Hoy lo habitual es que el servidor vaya **embebido** en la aplicación (Spring Boot con Tomcat) y se
    despliegue como un contenedor.

    **Repregunta:** ¿qué son WSGI y ASGI? — Las interfaces estándar entre servidor y aplicación en Python: WSGI
    síncrona (Gunicorn), ASGI asíncrona con WebSockets (Uvicorn).

??? question "Medio · ¿Por qué Go o Rust producen imágenes de contenedor más pequeñas que Java o Python?"
    Generan un **binario nativo estático** que no necesita runtime: la imagen puede ser `scratch` o *distroless* con
    unos MB. Java necesita una JVM (o una imagen nativa con GraalVM) y Python el intérprete y sus dependencias.

    Menos tamaño implica menos superficie de ataque, menos CVE que parchear y arranques más rápidos, algo que importa
    en *serverless* y en el edge.

    **Repregunta:** ¿cómo reducirías una imagen Java? — `jlink` para un runtime mínimo, imagen base *distroless*,
    capas separadas para dependencias, o compilación nativa con GraalVM si el arranque importa.

??? question "Avanzado · ¿Qué es WebAssembly y qué papel puede tener fuera del navegador?"
    Un formato binario de **máquina de pila portable y aislada**: se compila desde Rust, C, Go… y se ejecuta en un
    *sandbox* con memoria lineal propia y sin acceso al sistema salvo lo que el *host* le dé (WASI).

    Fuera del navegador: *plugins* seguros (Envoy, bases de datos), funciones *serverless* con arranque en
    microsegundos, cargas en el edge. Frente a un contenedor: más ligero y aislado, pero con un ecosistema y un
    acceso al sistema aún más limitados.

    **Repregunta:** ¿lo usarías para sustituir contenedores? — No en general; sí para extensiones y funciones
    pequeñas donde el arranque y el aislamiento importan más que la compatibilidad.
