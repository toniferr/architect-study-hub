# Java moderno (8 → 25) <span class="nivel medio">Medio</span>

Java ha cambiado más en los últimos diez años que en los quince anteriores. Esta página recorre las novedades que
cambian **cómo se diseña el código**, con el problema que resuelve cada una.

## 1. Lambdas y streams (Java 8)

**Problema**: pasar comportamiento como parámetro exigía clases anónimas verbosas, y procesar colecciones exigía bucles
con variables intermedias.

- Una **lambda** es una función anónima que implementa una **interfaz funcional** (interfaz con un único método abstracto:
  `Function<T,R>`, `Predicate<T>`, `Supplier<T>`, `Consumer<T>`…).
- Un ***stream*** es una secuencia de elementos sobre la que se encadenan operaciones **intermedias** (perezosas: `filter`,
  `map`, `sorted`) y una **terminal** (que dispara el cálculo: `toList`, `collect`, `count`, `forEach`).

```java
// Antes: bucle imperativo
Map<String, Long> failedByRegion = new HashMap<>();
for (Site s : sites) {
    if (s.status() == Status.FAILED) {
        failedByRegion.merge(s.region(), 1L, Long::sum);
    }
}

// Después: declarativo
Map<String, Long> failedByRegion = sites.stream()
    .filter(s -> s.status() == Status.FAILED)
    .collect(Collectors.groupingBy(Site::region, Collectors.counting()));
```

!!! warning "Errores frecuentes con streams"
    - **Efectos secundarios** dentro de `map` o `filter` (modificar listas externas): rompe el modelo y falla en paralelo.
    - `parallelStream()` por defecto: usa el *pool* común de *fork-join*, compite con todo lo demás y solo compensa con
      mucho cálculo por elemento y colecciones grandes.
    - Un *stream* **no se puede reutilizar** una vez consumido.
    - Cadenas de 15 operaciones ilegibles: extrae métodos con nombre.

### Optional

`Optional<T>` expresa "puede no haber valor" en el **tipo de retorno**, obligando al llamante a tratarlo.

```java
Optional<Site> site = repository.findByCode("site-042");
String region = site.map(Site::region).orElse("desconocida");
Site s = site.orElseThrow(() -> new SiteNotFound("site-042"));
```

Úsalo como **tipo de retorno**; no como campo, parámetro o elemento de colección, y nunca llames a `get()` sin comprobar.

## 2. `var` (Java 10)

Inferencia de tipo en **variables locales**: el tipo sigue siendo estático, solo no lo escribes.

```java
var deployments = new ArrayList<Deployment>();          // claro: el tipo se ve a la derecha
var result = service.process(input);                    // dudoso: ¿qué tipo es result?
```

Regla: úsalo cuando el tipo es **evidente** en la misma línea; evítalo cuando oculta información.

## 3. Records (Java 16)

**Problema**: una clase de datos inmutable exigía constructor, *getters*, `equals`, `hashCode` y `toString` escritos a mano (o Lombok).

```java
public record NodeStatus(String nodeId, boolean ready, String revision) {
    public NodeStatus {                                  // constructor compacto: validación
        Objects.requireNonNull(nodeId);
        if (revision != null && revision.isBlank()) throw new IllegalArgumentException("revision vacía");
    }
    public boolean isOutdated(String expected) { return !expected.equals(revision); }   // pueden tener métodos
}
```

- Campos `private final`, accesores `nodeId()` (sin `get`), `equals`/`hashCode`/`toString` basados en todos los campos.
- Ideales para **DTOs, value objects, eventos, resultados**. No sirven como entidades JPA (que necesitan mutabilidad y constructor vacío).
- Son **inmutables en superficie**: si un campo es una `List`, copia defensivamente con `List.copyOf`.

## 4. Clases selladas (Java 17)

**Problema**: modelar "un valor es exactamente uno de estos casos" (un tipo suma). Con herencia abierta, cualquiera
puede añadir un subtipo y el compilador no puede saber si has cubierto todos.

```java
public sealed interface DeploymentResult permits Succeeded, Failed, TimedOut { }
public record Succeeded(String revision, Duration took) implements DeploymentResult { }
public record Failed(String revision, String reason)    implements DeploymentResult { }
public record TimedOut(String revision)                  implements DeploymentResult { }
```

Combinadas con *pattern matching*, el compilador **comprueba que tratas todos los casos**.

## 5. Pattern matching (Java 16-21)

```java
// instanceof con variable (Java 16)
if (event instanceof NodeFailed nf && nf.critical()) { alert(nf.nodeId()); }

// switch con patrones, exhaustivo sobre un tipo sellado (Java 21)
String describe(DeploymentResult r) {
    return switch (r) {
        case Succeeded s when s.took().toMinutes() > 10 -> "OK pero lento: " + s.revision();
        case Succeeded s                                -> "OK: " + s.revision();
        case Failed(String rev, String reason)          -> "Fallo en " + rev + ": " + reason;   // patrón de record
        case TimedOut t                                 -> "Timeout en " + t.revision();
    };   // sin default: si mañana añades un caso, esto deja de compilar ← la gran ventaja
}
```

Esto habilita un estilo de **programación orientada a datos**: datos inmutables (*records*) + tipos cerrados (*sealed*)
+ operaciones con *pattern matching*. Encaja muy bien con resultados de operaciones, eventos y mensajes.

## 6. Otras mejoras del lenguaje

| Característica | Versión | Ejemplo / para qué |
|---|---|---|
| **Text blocks** | 15 | Cadenas multilínea (SQL, JSON, YAML) sin concatenar ni escapar: `"""` … `"""` |
| **`switch` como expresión** | 14 | `int days = switch (month) { case FEB -> 28; default -> 30; };` |
| **Colecciones inmutables** | 9-10 | `List.of(...)`, `Map.of(...)`, `List.copyOf(...)` |
| **Cliente HTTP** | 11 | `HttpClient` estándar con HTTP/2 y asíncrono |
| **Mensajes de NPE útiles** | 14 | Indica qué referencia era `null` en una cadena `a.b().c()` |
| **Colecciones secuenciadas** | 21 | `getFirst()`, `getLast()`, `reversed()` comunes a listas, *deques* y conjuntos ordenados |
| ***Stream gatherers*** | 24 | Operaciones intermedias personalizadas: ventanas, agrupaciones por tamaño (`Gatherers.windowFixed(10)`) |
| **Ficheros fuente compactos** | 25 | `void main() { IO.println("Hola"); }` sin clase ni `static`: scripts y aprendizaje |
| **Cuerpos de constructor flexibles** | 25 | Validar argumentos **antes** de llamar a `super(...)` |
| **Importación de módulos** | 25 | `import module java.base;` importa todos sus paquetes |
| **Cabeceras de objeto compactas** | 25 | La cabecera de cada objeto pasa de 12 a 8 bytes (`-XX:+UseCompactObjectHeaders`): menos memoria con muchos objetos pequeños |

## 7. Concurrencia moderna (Java 21-25)

| Característica | Estado | Qué resuelve |
|---|---|---|
| **Hilos virtuales** | Estable (21) | Millones de tareas bloqueantes con el estilo simple "un hilo por petición" → ver [Concurrencia](../fundamentos/concurrencia.md#hilos-virtuales-en-java-21) |
| ***Scoped values*** | Estable (25) | Alternativa a `ThreadLocal`: datos de contexto inmutables, con ámbito claro y baratos con hilos virtuales |
| ***Structured concurrency*** | En *preview* | Tratar un grupo de subtareas como una unidad: si una falla, se cancelan las demás; sin hilos huérfanos |

```java
// Scoped value: propagar el ID de la petición sin pasarlo como parámetro por todas las capas
static final ScopedValue<String> REQUEST_ID = ScopedValue.newInstance();

ScopedValue.where(REQUEST_ID, UUID.randomUUID().toString())
           .run(() -> handler.handle(request));     // dentro de handle(), REQUEST_ID.get() devuelve el valor
```

## 8. Módulos (JPMS, Java 9)

Un módulo declara qué paquetes **exporta** y de qué módulos **depende** (`module-info.java`). Aporta encapsulación
fuerte (los paquetes no exportados no son accesibles ni por reflexión) y permite crear runtimes mínimos con `jlink`.
En aplicaciones de negocio se usa poco; para modularizar un monolito es más habitual Spring Modulith o ArchUnit.

## Preguntas de repaso

??? question "¿Qué aporta combinar sealed + records + switch con patrones?"
    Modelar datos como un conjunto **cerrado** de variantes inmutables y procesarlos con un `switch` que el compilador
    verifica como **exhaustivo**: añadir una variante nueva obliga a tratarla en todos los sitios, en lugar de fallar en ejecución.

??? question "¿Por qué no usar un record como entidad JPA?"
    Las entidades JPA necesitan un constructor sin argumentos, campos mutables que el proveedor rellena y, a menudo,
    proxies para carga perezosa. Los *records* son inmutables y `final`. Úsalos para DTOs y proyecciones.

??? question "¿Qué problema de ThreadLocal resuelven los scoped values?"
    `ThreadLocal` es mutable, puede no limpiarse (fugas en *pools*) y es caro con millones de hilos virtuales. Los *scoped
    values* son inmutables, tienen un ámbito léxico claro (se liberan al salir) y se heredan eficientemente.

## Ejercicios

!!! exercise "Ejercicio 1 · Básico — De bucle a stream"
    Convierte a *stream*: dada una `List<Deployment>`, obtener los códigos de sitio distintos cuyo despliegue falló en
    las últimas 24 h, ordenados alfabéticamente.

    ??? success "Solución"
        ```java
        Instant since = Instant.now().minus(Duration.ofHours(24));
        List<String> failedSites = deployments.stream()
            .filter(d -> d.status() == Status.FAILED)
            .filter(d -> d.startedAt().isAfter(since))
            .map(Deployment::siteCode)
            .distinct()
            .sorted()
            .toList();
        ```
        Cada paso expresa una intención; `distinct` y `sorted` sustituyen al `Set` + ordenación manual. `toList()` (Java 16)
        devuelve una lista inmutable.

!!! exercise "Ejercicio 2 · Básico — Record con validación"
    Crea un *record* `SemVer` que valide que los tres números no son negativos, tenga un método estático `parse("1.4.2")`
    y sea comparable.

    ??? success "Solución"
        ```java
        public record SemVer(int major, int minor, int patch) implements Comparable<SemVer> {
            private static final Comparator<SemVer> ORDER = Comparator.comparingInt(SemVer::major)
                .thenComparingInt(SemVer::minor).thenComparingInt(SemVer::patch);

            public SemVer {
                if (major < 0 || minor < 0 || patch < 0) throw new IllegalArgumentException("Negativo no permitido");
            }

            public static SemVer parse(String text) {
                String[] p = text.split("\\.");
                if (p.length != 3) throw new IllegalArgumentException("Formato esperado X.Y.Z: " + text);
                return new SemVer(Integer.parseInt(p[0]), Integer.parseInt(p[1]), Integer.parseInt(p[2]));
            }

            @Override public int compareTo(SemVer o) { return ORDER.compare(this, o); }
            @Override public String toString() { return major + "." + minor + "." + patch; }
        }
        ```

!!! exercise "Ejercicio 3 · Medio — Modelar con tipos sellados"
    Una reconciliación de Flux puede terminar en: aplicada (revisión), fallida (motivo, reintentable sí/no) o suspendida.
    Modélalo con tipos sellados y escribe `nextAction(result)` que devuelva un texto con la acción a tomar.

    ??? success "Solución"
        ```java
        sealed interface ReconcileResult permits Applied, Failed, Suspended { }
        record Applied(String revision) implements ReconcileResult { }
        record Failed(String reason, boolean retryable) implements ReconcileResult { }
        record Suspended() implements ReconcileResult { }

        static String nextAction(ReconcileResult r) {
            return switch (r) {
                case Applied a                  -> "Nada: revisión " + a.revision() + " aplicada";
                case Failed(var reason, var retry) when retry -> "Reintentar: " + reason;
                case Failed(var reason, var retry)            -> "Abrir incidencia: " + reason;
                case Suspended s                -> "Revisar por qué está suspendida";
            };
        }
        ```
        Sin `default`: si se añade `Stalled`, el compilador señala todos los `switch` que deben tratarlo.

!!! exercise "Ejercicio 4 · Avanzado — Llamadas en paralelo con hilos virtuales"
    Tienes que consultar el estado de 5 000 sitios llamando a una API HTTP (≈ 200 ms cada llamada), pero la API solo admite
    100 peticiones simultáneas. Escribe el código.

    ??? success "Solución"
        ```java
        Semaphore permits = new Semaphore(100);             // limita la concurrencia hacia la API
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            List<Future<NodeStatus>> futures = siteIds.stream()
                .map(id -> executor.submit(() -> {
                    permits.acquire();
                    try { return client.fetchStatus(id); }
                    finally { permits.release(); }
                }))
                .toList();
            List<NodeStatus> statuses = new ArrayList<>();
            for (var f : futures) statuses.add(f.get());
        }
        ```
        Un hilo virtual por sitio (baratos), pero el `Semaphore` asegura como máximo 100 llamadas en vuelo. Tiempo
        aproximado: 5 000 / 100 × 0,2 s ≈ **10 s**, frente a ~17 minutos en secuencia.
