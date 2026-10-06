# Entrevista: Java y Spring

La JVM por dentro, Java moderno y Spring. En un puesto de arquitecto Java, las repreguntas van a por **cómo funciona
por dentro** (proxies, GC, transacciones) y a por los problemas de producción que hayas visto.

## La JVM

Teoría: [La JVM por dentro](../java/jvm.md)

??? question "Básico · ¿Qué partes tiene la memoria de la JVM?"
    - **Heap**: objetos, compartido entre hilos, gestionado por el GC (generación joven y vieja).
    - **Pila de cada hilo**: marcos con variables locales y referencias (`StackOverflowError`).
    - **Metaspace** (memoria nativa): metadatos de clases.
    - **Code cache**: código compilado por el JIT.
    - Otra memoria nativa: *buffers* directos, hilos, el propio GC.

    **Repregunta:** ¿por qué un contenedor Java muere por OOMKilled sin `OutOfMemoryError`? — El límite del
    contenedor cuenta **toda** la memoria del proceso (heap + metaspace + pilas + nativa); si `-Xmx` se acerca al
    límite, el kernel mata el proceso antes de que la JVM lo note.

??? question "Medio · ¿Cómo funciona un GC generacional y qué recolector elegirías?"
    **Hipótesis generacional**: la mayoría de objetos mueren jóvenes. Se recogen a menudo y barato en la generación
    joven (copiando los vivos) y rara vez la vieja.

    - **G1** (por defecto): equilibrio entre rendimiento y pausas, objetivo de pausa configurable.
    - **ZGC** (generacional): pausas por debajo del milisegundo con heaps enormes, a cambio de algo de CPU.
    - **Parallel**: máximo rendimiento en *batch*, pausas largas.
    - **Serial**: contenedores con 1 CPU y heaps pequeños.

    **Repregunta:** ¿cómo diagnosticas pausas largas? — Activar los logs de GC (`-Xlog:gc*`), mirar frecuencia y
    duración, tasa de asignación, y un perfil con JFR para ver quién asigna.

??? question "Medio · ¿Qué hace el JIT y qué optimizaciones conoces?"
    HotSpot interpreta el bytecode, cuenta invocaciones y compila los métodos calientes: primero C1 (rápido, con
    perfilado) y luego **C2** (agresivo) — compilación por niveles. Optimizaciones: **inlining**, *escape analysis*
    (objetos que no escapan se eliminan o van a la pila), eliminación de comprobaciones de límites, desenrollado
    de bucles, devirtualización especulativa con **desoptimización** si la suposición deja de cumplirse.

    **Repregunta:** ¿por qué los microbenchmarks caseros engañan? — Calentamiento, eliminación de código muerto y
    plegado de constantes: hay que usar JMH.

??? question "Medio · ¿Cómo configuras la JVM en un contenedor?"
    - La JVM detecta los límites de CPU y memoria del cgroup: usa `-XX:MaxRAMPercentage` (p. ej. 70-75 %) en vez de
      un `-Xmx` fijo, dejando margen para la memoria no-heap.
    - **Request = limit de memoria**; la CPU con límite bajo provoca *throttling* y reduce los hilos del GC y del JIT.
    - Probes con margen para el arranque (`startupProbe`) y apagado ordenado con SIGTERM.

    **Repregunta:** ¿qué pasa con `availableProcessors()` con un límite de 0,5 CPU? — Devuelve 1: pools y GC se
    dimensionan para un núcleo, lo que puede degradar el rendimiento.

??? question "Avanzado · Un servicio Java tarda 20 s en arrancar en Kubernetes. ¿Qué opciones tienes?"
    - **Medir primero**: dónde se va el tiempo (escaneo de clases, conexiones, inicialización perezosa).
    - **CDS / AppCDS**: compartir clases ya cargadas y verificadas entre ejecuciones.
    - **Caché AOT** del proyecto Leyden (Java 24-25): guarda clases cargadas y perfiles de un arranque de
      entrenamiento.
    - **GraalVM Native Image**: arranque en milisegundos y menos memoria, a cambio de *build* lento, sin JIT
      (pico menor) y configuración para reflexión.
    - **CRaC**: restaurar un *checkpoint* de la JVM ya caliente.
    - Más CPU durante el arranque (el *throttling* lo alarga mucho).

    **Repregunta:** ¿cuándo compensa Native Image? — *Serverless*, CLIs, *scale-to-zero* y el edge; para servicios
    de vida larga, la JVM con JIT suele dar más rendimiento sostenido.

??? question "Avanzado · ¿Cómo diagnosticas una fuga de memoria en producción?"
    1. Confirmar con métricas: el heap tras cada GC completo **crece** sin parar (no solo el uso total).
    2. **Heap dump** (`jcmd <pid> GC.heap_dump`, o `-XX:+HeapDumpOnOutOfMemoryError`) y analizarlo con Eclipse MAT:
       *dominator tree*, quién retiene los objetos.
    3. **JFR** para ver las asignaciones y los objetos que sobreviven.
    4. Sospechosos habituales: cachés sin límite, `ThreadLocal` en pools, *listeners* no eliminados, colecciones
       estáticas, *classloaders* que no se liberan.

    **Repregunta:** ¿y si es memoria nativa? — *Native Memory Tracking* (`-XX:NativeMemoryTracking`), revisar
    *buffers* directos, número de hilos y librerías JNI.

## Java moderno

Teoría: [Java moderno (8 → 25)](../java/java-moderno.md)

??? question "Básico · ¿Qué aportan los records y cuándo no usarlos?"
    Clases de datos **inmutables** y transparentes en una línea: constructor, accesores, `equals`, `hashCode` y
    `toString` generados. Ideales para DTOs, eventos, valores de dominio y claves de mapas; admiten validación en el
    constructor compacto.

    No sirven cuando necesitas mutabilidad, herencia de otra clase, o entidades JPA (que necesitan constructor sin
    argumentos, *proxies* y campos mutables).

    **Repregunta:** ¿un record es profundamente inmutable? — No: si un componente es una `List` mutable, hay que
    copiarla (`List.copyOf`) en el constructor.

??? question "Medio · ¿Qué son las clases selladas y cómo se combinan con el pattern matching?"
    Una interfaz o clase `sealed` declara **qué subtipos exactos** tiene. El compilador lo sabe, así que un `switch`
    con *pattern matching* sobre ella puede ser **exhaustivo** sin `default`: si añades un subtipo, todos los
    `switch` dejan de compilar hasta que lo trates. Es la forma de modelar tipos de datos algebraicos (un resultado
    `Ok | Error`, los estados de un pedido).

    **Repregunta:** ¿qué ventaja tiene sobre el patrón Visitor? — Menos código y la misma comprobación de
    exhaustividad, sin doble despacho.

??? question "Medio · ¿Qué son los hilos virtuales y qué problema resuelven?"
    Hilos gestionados por la JVM, no por el SO (estables desde Java 21). Cuando uno se bloquea en E/S, se
    **desmonta** de su hilo portador y otro ocupa su lugar: se pueden tener **millones** con el estilo simple de un
    hilo por petición, sin programación reactiva.

    - Mejoran el **rendimiento con E/S bloqueante**, no la velocidad de la CPU.
    - No se reutilizan en pools: se crea uno por tarea.
    - Limitar la concurrencia sobre recursos escasos (conexiones) con semáforos.

    **Repregunta:** ¿qué era el *pinning*? — Un hilo virtual bloqueado dentro de `synchronized` no podía desmontarse
    y retenía el portador; Java 24 lo resolvió para `synchronized` (sigue ocurriendo con código nativo).

??? question "Medio · ¿Para qué sirve Optional y cuál es su mal uso?"
    Para **tipos de retorno** que pueden no tener valor, haciendo explícita la ausencia y encadenando con `map`,
    `filter`, `orElseThrow`. Mal uso: como campo de una clase o parámetro de método, `optional.get()` sin comprobar,
    `Optional` de colecciones (devuelve una vacía) o `isPresent()` + `get()` en lugar de las operaciones funcionales.

    **Repregunta:** ¿`orElse` u `orElseGet`? — `orElse` evalúa siempre el argumento; `orElseGet` solo si está vacío
    (importa si el valor por defecto es caro).

??? question "Avanzado · ¿Qué son los scoped values y la structured concurrency?"
    - **Scoped values** (estables en Java 25): datos de contexto **inmutables** con un ámbito delimitado (ID de
      petición, usuario) que se propagan a lo llamado sin pasar parámetros. Sustituyen a `ThreadLocal`, que es
      mutable, puede fugarse en pools y es caro con millones de hilos virtuales.
    - **Structured concurrency** (en *preview*): un grupo de subtareas se trata como una unidad: si una falla, se
      cancelan las demás y no quedan hilos huérfanos; el ámbito no termina hasta que acaban todas.

    **Repregunta:** ¿qué sustituye en la práctica? — Combinaciones frágiles de `CompletableFuture` con cancelación y
    manejo de errores manual.

## Spring y Spring Boot

Teoría: [Spring y Spring Boot](../java/spring.md)

??? question "Básico · ¿Qué es la inversión de control y cómo la implementa Spring?"
    El framework, no tu código, crea los objetos y conecta sus dependencias. Spring escanea componentes y clases
    `@Configuration`, registra **definiciones de beans** en el contexto, los crea en orden de dependencias, los
    inyecta (por constructor) y gestiona su ciclo de vida. Los `BeanPostProcessor` pueden envolverlos en proxies.

    **Repregunta:** ¿qué ámbitos de bean hay? — `singleton` (por defecto), `prototype`, y en web `request` y
    `session`.

??? question "Medio · ¿Cómo funciona @Transactional por dentro y cuándo no funciona?"
    Spring envuelve el bean en un **proxy** (AOP). Al llamar a un método anotado desde fuera, el proxy abre la
    transacción, llama al método real y hace *commit*, o *rollback* si sale una excepción **no comprobada**.

    No funciona en: llamadas internas desde la misma clase (`this.metodo()` no pasa por el proxy), métodos
    `private`, excepciones comprobadas (salvo `rollbackFor`), o si el hilo cambia (`@Async`).

    **Repregunta:** ¿qué hace `propagation = REQUIRES_NEW`? — Suspende la transacción actual y abre otra
    independiente (útil para auditoría que debe guardarse aunque falle lo demás).

??? question "Medio · ¿Qué es el problema N+1 y cómo lo resuelves?"
    Cargar una lista de N entidades (1 consulta) y, al recorrerla, acceder a una relación perezosa que lanza **una
    consulta por elemento** (N más). Soluciones: `JOIN FETCH` o `@EntityGraph` para traer la relación en la misma
    consulta, `@BatchSize` para cargarla por lotes, o proyecciones/DTOs con solo lo necesario.

    **Repregunta:** ¿cómo lo detectas antes de producción? — Logs de SQL o contadores de consultas en los tests
    (Hibernate statistics), y trazas que muestren muchas consultas por petición.

??? question "Medio · ¿Cómo funciona la autoconfiguración de Spring Boot?"
    Los *starters* traen dependencias; Boot carga las clases de autoconfiguración listadas en
    `META-INF/spring/…AutoConfiguration.imports`, y cada una crea beans **solo si se cumplen condiciones**:
    `@ConditionalOnClass` (la librería está), `@ConditionalOnMissingBean` (tú no has definido uno),
    `@ConditionalOnProperty`. Tu configuración siempre gana.

    **Repregunta:** ¿cómo ves qué se ha configurado y por qué? — Arrancando con `--debug` (informe de condiciones) o
    el endpoint `/actuator/conditions`.

??? question "Medio · ¿Spring MVC o WebFlux?"
    **MVC**: modelo de un hilo por petición, bloqueante, simple de programar y depurar; con **hilos virtuales**
    escala muy bien con E/S. **WebFlux**: reactivo, no bloqueante, para *streaming*, muchas conexiones largas o
    composición de muchas llamadas asíncronas; exige que **toda** la cadena sea no bloqueante y es más difícil de
    depurar.

    Hoy, para un servicio CRUD típico: MVC + hilos virtuales.

    **Repregunta:** ¿qué pasa si llamas a JDBC desde WebFlux? — Bloqueas uno de los pocos hilos del *event loop* y
    degradas todo el servicio.

??? question "Medio · ¿Cómo protegerías una API con Spring Security y OAuth 2.0?"
    Como **servidor de recursos**: valida el **JWT** que emite el proveedor de identidad (firma con sus claves JWKS,
    emisor, audiencia, caducidad), extrae los roles o *scopes* y autoriza por ruta y por método
    (`@PreAuthorize`). Sin sesión en servidor (*stateless*), CORS y CSRF configurados según el tipo de cliente.

    **Repregunta:** ¿cómo revocas un JWT antes de que caduque? — Tokens de vida corta con *refresh token*, o
    introspección / lista de revocación si el riesgo lo justifica.

??? question "Avanzado · ¿Qué expones en Actuator en producción y cómo lo usas con Kubernetes?"
    - `health` con grupos **liveness** y **readiness** para las probes (la readiness incluye dependencias críticas;
      la liveness, no, para no reiniciar en cascada).
    - `prometheus` con métricas de Micrometer (HTTP, JVM, pools, negocio) y `info` con la versión.
    - Endpoints sensibles (`env`, `heapdump`, `loggers`) en otro puerto, sin exponer fuera y con autenticación.

    **Repregunta:** ¿por qué la liveness no debe comprobar la base de datos? — Si la BD cae, Kubernetes reiniciaría
    todos los Pods sin arreglar nada (y con más carga al volver).
