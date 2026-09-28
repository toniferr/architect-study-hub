# Concurrencia y sistemas operativos <span class="nivel avanzado">Avanzado</span>

La concurrencia es la fuente de los errores más difíciles de reproducir. Entender cómo funciona por debajo
(SO, CPU, memoria) permite diseñar sistemas correctos y dimensionarlos bien.

## 1. Conceptos base

| Concepto | Qué es |
|---|---|
| **Concurrencia** | Gestionar varias tareas cuyo progreso se solapa en el tiempo (aunque haya un solo núcleo) |
| **Paralelismo** | Ejecutar varias tareas **a la vez** en varios núcleos |
| **Proceso** | Programa en ejecución con su propio espacio de memoria; aislado de otros procesos |
| **Hilo** (*thread*) | Unidad de ejecución dentro de un proceso; comparte memoria con los demás hilos |
| **Cambio de contexto** | El SO guarda el estado de un hilo y restaura otro; cuesta microsegundos y ensucia cachés |
| **Llamada al sistema** | Petición al kernel (leer fichero, red, memoria); implica pasar a modo kernel |

!!! tip "CPU-bound vs. I/O-bound"
    Tareas **de CPU** (cálculo) escalan con núcleos: ~1 hilo por núcleo. Tareas **de E/S** (red, disco, BBDD) pasan
    la mayor parte del tiempo esperando: se benefician de muchos hilos baratos o de modelos asíncronos.

## 2. Memoria de un proceso

| Zona | Contenido |
|---|---|
| **Pila** (*stack*) | Variables locales y llamadas; una por hilo; tamaño limitado (→ `StackOverflowError`) |
| **Montículo** (*heap*) | Objetos dinámicos; compartido entre hilos; gestionado por el GC en Java |
| Código y datos estáticos | Instrucciones y constantes |

**Memoria virtual**: cada proceso ve su propio espacio de direcciones; el SO lo mapea a memoria física en páginas.
Si falta memoria física → *swap* (lentísimo) o, en contenedores, el **OOM killer** mata el proceso.

## 3. Modelos de concurrencia

| Modelo | Idea | Ejemplos |
|---|---|---|
| **Hilos del SO + memoria compartida** | Cada petición en un hilo; sincronización con *locks* | Java clásico, Spring MVC |
| **Hilos virtuales / *green threads*** | Hilos ligeros gestionados por el runtime, millones posibles | Java 21+ (Loom), *goroutines* de Go |
| **Event loop** | Un hilo procesa eventos sin bloquearse; E/S asíncrona | Node.js, Netty, NGINX |
| **Reactivo** | Flujos asíncronos con contrapresión | Project Reactor (WebFlux), RxJava |
| **Actores** | Entidades con estado privado que se comunican por mensajes | Akka/Pekko, Erlang/Elixir |
| **CSP / canales** | Procesos que se comunican por canales | Go |
| ***async/await*** | Código secuencial en apariencia sobre operaciones asíncronas | C#, JavaScript, Python, Kotlin (corrutinas) |

### Hilos virtuales en Java 21+

Antes: cada hilo de plataforma ≈ 1 hilo del SO (~1 MB de pila, miles como máximo) → para mucha E/S había que usar
programación reactiva. Con **hilos virtuales**, la JVM los "aparca" cuando bloquean en E/S y reutiliza unos pocos
hilos del SO: el estilo simple de "un hilo por tarea" escala a cientos de miles de tareas.

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<NodeStatus>> futures = nodeIds.stream()
        .map(id -> executor.submit(() -> fleetClient.fetchStatus(id)))   // 10 000 llamadas HTTP concurrentes
        .toList();
    for (Future<NodeStatus> f : futures) report.add(f.get());
}
```

```yaml
# Spring Boot 3.2+: atender cada petición en un hilo virtual
spring:
  threads:
    virtual:
      enabled: true
```

!!! warning "Trampas de los hilos virtuales"
    No aceleran el cálculo (CPU); no uses *pools* de hilos virtuales (créalos por tarea); limita la concurrencia
    hacia recursos escasos con un `Semaphore` (la BBDD sigue teniendo N conexiones); en versiones anteriores a
    Java 24, bloquear dentro de `synchronized` "clavaba" el hilo virtual a su hilo del SO (*pinning*).

## 4. Problemas clásicos

### Condición de carrera

```java
class Counter {
    private int value;
    void increment() { value++; }        // leer, sumar, escribir: NO es atómico
}
// Dos hilos ejecutan increment() 1 000 veces → resultado < 2 000
```

| Solución | Código |
|---|---|
| Exclusión mutua | `synchronized void increment() { value++; }` o `ReentrantLock` |
| Operación atómica (sin *locks*, CAS) | `AtomicInteger value; value.incrementAndGet();` |
| Contador con alta contención | `LongAdder` |
| Evitar estado compartido | Inmutabilidad, confinar el estado a un hilo, paso de mensajes |

### Deadlock

Cuatro condiciones simultáneas (Coffman): exclusión mutua, retener y esperar, sin expropiación, **espera circular**.

```java
// Hilo 1: lock(A) → lock(B)      Hilo 2: lock(B) → lock(A)   → bloqueo mutuo
```

Prevención: **orden global** de adquisición de *locks*, `tryLock` con *timeout*, reducir el alcance de los *locks*,
no llamar a código externo con un *lock* tomado. Diagnóstico: `jstack` muestra "Found one Java-level deadlock".

### Otros

| Problema | Descripción |
|---|---|
| **Livelock** | Los hilos reaccionan entre sí sin avanzar (se apartan a la vez una y otra vez) |
| **Inanición** | Un hilo nunca consigue el recurso |
| **Inversión de prioridad** | Un hilo de baja prioridad con un *lock* bloquea a uno de alta |
| **Visibilidad** | Un hilo no ve el cambio de otro por cachés de CPU o reordenaciones del compilador |

## 5. Java Memory Model

- **happens-before**: si A *happens-before* B, B ve los efectos de A. Lo establecen: `synchronized` (liberar → adquirir),
  `volatile` (escribir → leer), `Thread.start/join`, colecciones concurrentes, `Future.get`.
- `volatile` garantiza **visibilidad** y orden, **no atomicidad** (`volatile int x; x++` sigue siendo una carrera).
- Publicación segura: campos `final` inicializados en el constructor, o publicar mediante estructuras concurrentes.

## 6. Caja de herramientas `java.util.concurrent`

| Herramienta | Para |
|---|---|
| `ExecutorService` | Ejecutar tareas en *pools* de hilos |
| `CompletableFuture` | Componer operaciones asíncronas (`thenApply`, `thenCombine`, `allOf`) |
| `ConcurrentHashMap` | Mapa concurrente; `computeIfAbsent`, `merge` atómicos |
| `CopyOnWriteArrayList` | Muchas lecturas, pocas escrituras (listas de *listeners*) |
| `BlockingQueue` | Productor/consumidor con contrapresión |
| `Semaphore` | Limitar concurrencia (p. ej. 20 llamadas simultáneas a la BBDD) |
| `CountDownLatch` / `CyclicBarrier` / `Phaser` | Coordinar fases |
| `ReentrantReadWriteLock` / `StampedLock` | Muchos lectores, pocos escritores |
| *Structured concurrency* | Tratar un grupo de subtareas como una unidad (cancelación y errores conjuntos) |

```java
// Llamadas en paralelo con timeout y combinación de resultados
CompletableFuture<Node> node = CompletableFuture.supplyAsync(() -> registry.find(id), executor);
CompletableFuture<Metrics> metrics = CompletableFuture.supplyAsync(() -> prometheus.query(id), executor);

NodeView view = node.thenCombine(metrics, NodeView::new)
                    .orTimeout(2, TimeUnit.SECONDS)
                    .join();
```

## 7. Dimensionado de *pools*

- **CPU-bound**: hilos ≈ número de núcleos.
- **I/O-bound** (hilos de plataforma): hilos ≈ núcleos × (1 + tiempo de espera / tiempo de cálculo).
- **Ley de Little**: concurrencia = *throughput* × latencia. Con 200 peticiones/s y 50 ms de latencia de BBDD →
  ~10 conexiones ocupadas de media; dimensiona el *pool* con margen para picos, no 200.
- Un *pool* de conexiones a BBDD demasiado grande **empeora** el rendimiento de la BBDD (contención). HikariCP
  recomienda empezar pequeño: conexiones ≈ núcleos de la BBDD × 2 + discos.

## 8. Contenedores y CPU

- Kubernetes traduce `requests` y `limits` a **cgroups**. `limits.cpu` = cuota de CFS: si el proceso la agota en el
  periodo (100 ms), queda **estrangulado** (*throttling*) aunque el nodo tenga CPU libre → picos de latencia.
- La JVM detecta los límites del contenedor (`ActiveProcessorCount`, `MaxRAMPercentage`); ajusta `-XX:MaxRAMPercentage=75`
  para dejar margen a memoria no-heap.
- Recolectores de basura: **G1** (por defecto, equilibrado), **ZGC** y Shenandoah (pausas de milisegundos con *heaps* grandes),
  Parallel (máximo *throughput* en *batch*).

## Preguntas de repaso

??? question "¿`volatile` hace atómico un contador?"
    No. Garantiza visibilidad y orden, pero `x++` son tres operaciones (leer, sumar, escribir). Usa `AtomicInteger`,
    `LongAdder` o sincronización.

??? question "¿Cuándo NO aportan nada los hilos virtuales?"
    En cargas de CPU: el límite son los núcleos. También si el cuello de botella es un recurso limitado (conexiones de
    BBDD): hay que acotar la concurrencia igualmente.

??? question "¿Cómo se previene un deadlock de forma sistemática?"
    Eliminando la espera circular: todos los hilos adquieren los *locks* en el mismo orden global. También con
    `tryLock` y *timeouts*, o evitando *locks* anidados.

??? question "¿Por qué un Pod con CPU libre en el nodo puede tener latencias altas?"
    Por *throttling* del límite de CPU (cuota CFS): si consume su cuota antes de terminar el periodo, se le pausa hasta
    el siguiente. Muchos equipos quitan `limits.cpu` y mantienen `requests` y el límite de memoria.

## Ejercicios

!!! exercise "Ejercicio 1 · Básico — Encontrar la carrera"
    ```java
    @Service
    class SiteCounter {
        private final Map<String, Integer> counts = new HashMap<>();
        void inc(String siteId) { counts.put(siteId, counts.getOrDefault(siteId, 0) + 1); }
    }
    ```
    Este *bean* recibe llamadas desde muchas peticiones HTTP a la vez. ¿Qué puede fallar y cómo lo arreglas?

    ??? success "Solución"
        Dos problemas: (1) `HashMap` no es seguro para hilos: accesos concurrentes pueden corromper su estructura interna;
        (2) leer-sumar-escribir no es atómico: se pierden incrementos.
        ```java
        private final ConcurrentHashMap<String, LongAdder> counts = new ConcurrentHashMap<>();
        void inc(String siteId) { counts.computeIfAbsent(siteId, k -> new LongAdder()).increment(); }
        ```
        `computeIfAbsent` es atómico en `ConcurrentHashMap` y `LongAdder` escala bien con mucha contención.

!!! exercise "Ejercicio 2 · Básico — Ley de Little"
    Un servicio recibe 400 peticiones/s y cada una espera 80 ms a la base de datos. ¿Cuántas conexiones están ocupadas de
    media? ¿Con qué tamaño de *pool* empezarías si hay 4 instancias?

    ??? success "Solución"
        Concurrencia = *throughput* × latencia = 400 × 0,08 = **32 conexiones** ocupadas de media en total. Con 4 instancias,
        ~8 por instancia; un *pool* de 10-15 por instancia deja margen para picos. Más grande no ayuda: si la base de datos
        se satura, más conexiones solo aumentan la contención.

!!! exercise "Ejercicio 3 · Medio — Deadlock en transferencias"
    `transfer(a, b)` bloquea la cuenta `a` y luego `b`. Si a la vez se ejecuta `transfer(b, a)`, los dos hilos se
    bloquean para siempre. Corrige el diseño.

    ??? success "Solución"
        Imponer un **orden global** de bloqueo, por ejemplo por identificador:
        ```java
        void transfer(Account from, Account to, long amount) {
            Account first  = from.id() < to.id() ? from : to;
            Account second = from.id() < to.id() ? to : from;
            synchronized (first) {
                synchronized (second) {
                    from.withdraw(amount);
                    to.deposit(amount);
                }
            }
        }
        ```
        Ambos hilos bloquean siempre primero la cuenta de menor ID, así que no puede haber espera circular. (En un sistema
        real, esto lo resolvería una transacción de base de datos.)

!!! exercise "Ejercicio 4 · Medio — Timeout sobre varias llamadas"
    Debes consultar a la vez el registro de nodos y Prometheus, y responder en máximo 2 s; si Prometheus no responde en
    1,5 s, devuelve la vista sin métricas. Escríbelo con `CompletableFuture`.

    ??? success "Solución"
        ```java
        CompletableFuture<Node> node = CompletableFuture.supplyAsync(() -> registry.find(id), executor);
        CompletableFuture<Metrics> metrics = CompletableFuture.supplyAsync(() -> prometheus.query(id), executor)
            .completeOnTimeout(Metrics.EMPTY, 1500, TimeUnit.MILLISECONDS)     // degradación: sin métricas
            .exceptionally(ex -> Metrics.EMPTY);                                // también si falla

        NodeView view = node.thenCombine(metrics, NodeView::new)
                            .orTimeout(2, TimeUnit.SECONDS)                      // el nodo sí es obligatorio
                            .join();
        ```
        Las dos llamadas van en paralelo; la opcional tiene un valor por defecto y la obligatoria un límite estricto.

!!! exercise "Ejercicio 5 · Avanzado — Throttling de CPU"
    Un servicio Java con `requests.cpu: 1` y `limits.cpu: 1` tiene un p99 de 900 ms aunque su CPU media es del 40 %.
    ¿Cómo confirmas que es *throttling* y qué cambias?

    ??? success "Solución"
        Confirmar con `container_cpu_cfs_throttled_periods_total / container_cpu_cfs_periods_total` (porcentaje de periodos
        estrangulados). Si es alto, el proceso agota su cuota de 100 ms en ráfagas (GC, JIT, picos de peticiones) y queda
        parado el resto del periodo; la media del 40 % oculta esas ráfagas. Cambios: quitar `limits.cpu` (o subirlo)
        manteniendo `requests.cpu` para la planificación; si hay que limitar, ajustar el nº de hilos de GC y de *pools*
        (`-XX:ActiveProcessorCount`) para que la JVM no crea disponer de más CPU de la real.
