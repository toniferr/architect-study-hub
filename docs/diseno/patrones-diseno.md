# Patrones de diseño <span class="nivel medio">Medio</span>

Un **patrón de diseño** es una solución probada a un problema de diseño que se repite, descrita de forma general para
adaptarla a cada caso. El catálogo clásico es el del libro *Design Patterns* (1994) de Gamma, Helm, Johnson y Vlissides
(la "banda de los cuatro", GoF).

Para cada patrón conviene saber cuatro cosas: **qué problema resuelve**, **cómo** (su estructura), **cuándo no usarlo**
y **dónde lo has visto** ya (los frameworks están llenos de patrones).

| Tipo | Resuelve | Patrones de esta página |
|---|---|---|
| **Creacionales** | Cómo se crean los objetos | Builder, Factory Method, Singleton |
| **Estructurales** | Cómo se componen objetos y clases | Adapter, Decorator, Facade, Proxy, Composite |
| **De comportamiento** | Cómo se reparten responsabilidades y se comunican | Strategy, Observer, Command, Template Method, Chain of Responsibility, State |

!!! warning "Patronitis"
    Aplicar patrones "porque sí" añade indirecciones y clases que nadie necesita. Un patrón se justifica cuando el
    problema que resuelve **existe** en tu código. Empieza simple y refactoriza hacia el patrón cuando aparezca la necesidad.

---

## Creacionales

### Builder

**Problema**: un objeto con muchos parámetros, varios opcionales. Los constructores con 8 argumentos son ilegibles
(`new Release("a", null, "x", 3, true, null…)`) y propensos a errores; crear un constructor por combinación ("constructor
telescópico") no escala.

**Solución**: un objeto auxiliar que recoge los valores con métodos con nombre y construye el resultado al final, validando.

```java
public final class HelmRelease {
    private final String name, chart, version, namespace;
    private final Map<String, Object> values;

    private HelmRelease(Builder b) {
        this.name = b.name; this.chart = b.chart; this.version = b.version;
        this.namespace = b.namespace; this.values = Map.copyOf(b.values);
    }
    public static Builder named(String name) { return new Builder(name); }

    public static final class Builder {
        private final String name;
        private String chart, version = "latest", namespace = "default";     // valores por defecto
        private final Map<String, Object> values = new HashMap<>();
        private Builder(String name) { this.name = name; }
        public Builder chart(String c)           { this.chart = c; return this; }
        public Builder version(String v)         { this.version = v; return this; }
        public Builder namespace(String ns)      { this.namespace = ns; return this; }
        public Builder value(String k, Object v) { values.put(k, v); return this; }
        public HelmRelease build() {
            Objects.requireNonNull(chart, "chart es obligatorio");            // validar antes de crear
            return new HelmRelease(this);
        }
    }
}

var release = HelmRelease.named("ingress").chart("ingress-nginx").namespace("edge").value("replicas", 2).build();
```

- **Cuándo no**: objetos con 2-3 campos obligatorios (un constructor o un *record* basta).
- **Lo has visto en**: `StringBuilder`, `HttpRequest.newBuilder()`, Lombok `@Builder`, *builders* de datos de prueba.

### Factory Method

**Problema**: el código cliente no debería saber **qué clase concreta** instanciar; esa decisión depende de configuración
o de datos, y repetirla en muchos sitios dispersa la lógica.

**Solución**: un método que encapsula la decisión y devuelve la abstracción.

```java
public interface Notifier { void send(String msg); }

public final class Notifiers {
    public static Notifier forChannel(String channel) {
        return switch (channel) {
            case "slack" -> new SlackNotifier();
            case "email" -> new EmailNotifier();
            default -> throw new IllegalArgumentException("Canal desconocido: " + channel);
        };
    }
}
```

- La variante **Abstract Factory** crea **familias** de objetos relacionados (p. ej. todos los clientes de AWS o todos los de Azure).
- **Lo has visto en**: `List.of()`, `Executors.newFixedThreadPool()`, `LoggerFactory.getLogger()`; en Spring, los métodos `@Bean`.

### Singleton

**Problema**: asegurar que existe **una única instancia** de algo y dar acceso global a ella.

```java
public enum Config {          // la forma más segura en Java: thread-safe y a prueba de serialización
    INSTANCE;
    private final Properties props = load();
    public String get(String key) { return props.getProperty(key); }
}
```

!!! warning "Por qué suele considerarse un antipatrón"
    Es **estado global**: oculta dependencias (no aparecen en el constructor), dificulta los tests (no se puede sustituir)
    y acopla todo el código a él. Casi siempre es mejor que el contenedor de inyección de dependencias gestione una única
    instancia (*bean* singleton de Spring) y la **inyecte**: una sola instancia, sin acceso global.

---

## Estructurales

### Adapter

**Problema**: una clase existente (a menudo de una librería) ofrece una interfaz distinta de la que espera tu código.

**Solución**: una clase intermedia que implementa la interfaz que esperas y traduce las llamadas a la existente.

```java
// Tu dominio espera esto:
public interface MetricsSink { void record(String name, double value); }

// La librería (Micrometer) ofrece otra API: la adaptamos
public class MicrometerMetricsSink implements MetricsSink {
    private final MeterRegistry registry;
    public MicrometerMetricsSink(MeterRegistry registry) { this.registry = registry; }
    public void record(String name, double value) { registry.summary(name).record(value); }
}
```

- **Beneficio clave**: si cambias de librería, solo cambia el adaptador. Es la base de los **adaptadores** de la
  arquitectura hexagonal.
- **Lo has visto en**: `Arrays.asList()`, `InputStreamReader` (adapta bytes a caracteres).

### Decorator

**Problema**: añadir responsabilidades (caché, reintentos, métricas, logs) a un objeto **sin modificar su clase** y
pudiendo **combinarlas** libremente. Con herencia necesitarías una subclase por combinación (`CachingRetryingGitSource`…).

**Solución**: una clase que implementa la misma interfaz, **envuelve** a otra instancia y añade comportamiento antes o
después de delegar.

```java
public interface ConfigSource { String fetch(String key); }

public class GitConfigSource implements ConfigSource { ... }                 // la implementación real

public class CachingConfigSource implements ConfigSource {
    private final ConfigSource inner;
    private final Map<String, String> cache = new ConcurrentHashMap<>();
    public CachingConfigSource(ConfigSource inner) { this.inner = inner; }
    public String fetch(String key) { return cache.computeIfAbsent(key, inner::fetch); }
}

public class RetryingConfigSource implements ConfigSource {
    private final ConfigSource inner;
    public RetryingConfigSource(ConfigSource inner) { this.inner = inner; }
    public String fetch(String key) {
        for (int attempt = 1; ; attempt++) {
            try { return inner.fetch(key); }
            catch (RuntimeException e) { if (attempt == 3) throw e; }
        }
    }
}

// Se apilan como capas: la caché envuelve a los reintentos, que envuelven a Git
ConfigSource source = new CachingConfigSource(new RetryingConfigSource(new GitConfigSource()));
```

- El **orden importa**: con la caché por fuera, los aciertos no llegan a reintentar; al revés, se reintentaría también la caché.
- **Lo has visto en**: `new BufferedInputStream(new FileInputStream(...))`, filtros de Servlet, *middlewares* HTTP.

### Facade

**Problema**: un subsistema con muchas piezas (autoridad de certificados, registro, repositorio Git…) que los clientes
tendrían que coordinar en el orden correcto.

**Solución**: una clase con una interfaz simple que orquesta el subsistema.

```java
public class EdgeProvisioningFacade {
    private final CertificateAuthority ca;
    private final NodeRegistry registry;
    private final GitOpsRepo repo;

    public NodeId provision(NodeSpec spec) {
        var cert = ca.issueFor(spec.hostname());
        var id = registry.register(spec, cert);
        repo.commitClusterManifests(id, spec);    // Flux lo reconciliará en el sitio
        return id;
    }
}
```

La fachada no impide usar las piezas directamente si hace falta; solo ofrece el camino fácil para el caso común.

### Proxy

**Problema**: controlar el acceso a un objeto: crearlo solo cuando se necesite (carga perezosa), comprobar permisos,
representar un objeto remoto o añadir transacciones.

**Solución**: un objeto con la misma interfaz que se interpone. A diferencia del *Decorator*, su propósito es **controlar
el acceso**, y normalmente el cliente ni sabe que existe.

- **Lo has visto en**: los proxies de Spring (`@Transactional`, `@Cacheable`), la carga perezosa de Hibernate, los
  *stubs* de gRPC (representan un servicio remoto), `kubectl proxy`.

### Composite

**Problema**: tratar igual a un elemento individual y a un **grupo** de elementos (estructuras en árbol).

**Solución**: elementos simples y compuestos implementan la misma interfaz; el compuesto delega en sus hijos.

```java
interface Deployable { void apply(Cluster c); }
record Manifest(String yaml) implements Deployable { public void apply(Cluster c) { c.apply(yaml); } }
record Bundle(List<Deployable> parts) implements Deployable {
    public void apply(Cluster c) { parts.forEach(p -> p.apply(c)); }      // un grupo se aplica igual que un elemento
}
```

- **Lo has visto en**: Kustomize (una `kustomization` agrupa recursos y otras `kustomizations`), árboles de UI, sistemas de ficheros.

---

## De comportamiento

### Strategy

**Problema**: hay varias formas de hacer algo (algoritmos) y se quiere elegir una en tiempo de ejecución, sin `if/switch`
repartidos por el código.

**Solución**: cada algoritmo es una clase que implementa una interfaz común; el cliente recibe la que toque. Es la forma
más común de cumplir [OCP](solid.md#o-openclosed).

```java
public interface RolloutStrategy { void rollout(List<EdgeNode> fleet, Release release); }

public class AllAtOnce implements RolloutStrategy { ... }
public class Canary    implements RolloutStrategy { ... }   // 1 % → 10 % → 100 %
public class ByRegion  implements RolloutStrategy { ... }

// En Java moderno, una lambda es una estrategia de una sola operación
Comparator<EdgeNode> byLatency = Comparator.comparing(EdgeNode::latencyMs);
```

### Observer

**Problema**: cuando algo cambia, varios interesados deben enterarse, sin que el objeto que cambia los conozca a todos
(si los llamara directamente, añadir un interesado obligaría a modificarlo).

**Solución**: los interesados se **suscriben**; el objeto observado los notifica a través de una interfaz común.

```java
public interface NodeListener { void onStatusChanged(NodeId id, Status status); }

public class NodeMonitor {
    private final List<NodeListener> listeners = new CopyOnWriteArrayList<>();   // segura para lectura concurrente
    public void subscribe(NodeListener l) { listeners.add(l); }
    void statusChanged(NodeId id, Status s) { listeners.forEach(l -> l.onStatusChanged(id, s)); }
}
```

- **Riesgos**: un *listener* lento bloquea a los demás (notificar de forma asíncrona); fugas de memoria si no se
  desuscriben; orden de notificación no garantizado.
- **Lo has visto en**: `ApplicationEventPublisher` de Spring, los *informers* de Kubernetes. A escala de sistema, se
  convierte en **arquitectura dirigida por eventos**.

### Command

**Problema**: se quiere tratar una **petición como un objeto** para poder encolarla, registrarla, reintentarla, deshacerla
o ejecutarla más tarde.

**Solución**: cada acción es un objeto con todo lo necesario para ejecutarse.

```java
public sealed interface FleetCommand permits Reboot, Upgrade {
    void execute(FleetGateway gw);
}
record Reboot(NodeId node) implements FleetCommand {
    public void execute(FleetGateway gw) { gw.reboot(node); }
}
record Upgrade(NodeId node, String version) implements FleetCommand {
    public void execute(FleetGateway gw) { gw.upgrade(node, version); }
}
// Una cola de comandos permite reintentos, auditoría ("quién pidió qué") y ejecución diferida
```

### Template Method

**Problema**: varios procesos tienen **el mismo esqueleto** y solo cambian algunos pasos.

**Solución**: una clase base define el algoritmo con métodos "gancho" que las subclases rellenan. Hoy suele preferirse
**composición** (pasar los pasos variables como estrategias o lambdas) en lugar de herencia, pero sigue apareciendo en
frameworks (`JdbcTemplate`, `AbstractController`).

### Chain of Responsibility

**Problema**: una petición debe pasar por varios manejadores (autenticar, validar, limitar…), y cada uno decide si la
procesa, la modifica o la pasa al siguiente, sin que el emisor conozca la cadena.

- **Lo has visto en**: la cadena de filtros de Spring Security, *middlewares* HTTP, *admission controllers* de Kubernetes.

### State

**Problema**: el comportamiento de un objeto depende de su estado, y el código se llena de `if (state == X)` en cada método.

**Solución**: cada estado es una clase que implementa las operaciones a su manera y decide la transición al siguiente.
Útil para ciclos de vida (un *rollout*: planificado → en curso → detenido → completado).

---

## Patrones en Kubernetes y cloud

| Patrón | Qué es |
|---|---|
| **Controller / bucle de reconciliación** | Observa el estado actual, lo compara con el deseado y actúa para igualarlos. La base de Kubernetes y GitOps |
| **Operator** | Controller + CRD que codifica el conocimiento operativo de una aplicación |
| **Sidecar** | Contenedor auxiliar en el mismo Pod (proxy de service mesh, recolector de logs) |
| **Ambassador** | Sidecar que hace de proxy hacia servicios externos |
| **Adapter** (de contenedor) | Normaliza la salida de la aplicación (por ejemplo, un *exporter* de métricas) |
| **Init container** | Prepara el entorno antes de que arranque la aplicación |

## Preguntas de repaso

??? question "¿Diferencia entre Decorator y Proxy?"
    Ambos envuelven un objeto con la misma interfaz. **Decorator** añade comportamiento y se suelen apilar varios; **Proxy**
    controla el **acceso** (perezoso, remoto, permisos, transacciones) y normalmente es transparente para el cliente.

??? question "¿Por qué Singleton se considera a menudo un antipatrón?"
    Introduce estado global, oculta dependencias, dificulta los tests (no se puede sustituir) y puede dar problemas de
    concurrencia. Mejor dejar que el contenedor de DI gestione una única instancia e inyectarla.

??? question "¿Diferencia entre Strategy y State?"
    Estructura casi idéntica. En **Strategy** el cliente elige el algoritmo desde fuera; en **State** el propio objeto
    cambia de estado (y de comportamiento) según sus transiciones internas.

??? question "¿Qué patrón implementa @Transactional en Spring?"
    **Proxy**: Spring envuelve el *bean* en un proxy que abre y cierra la transacción alrededor de la llamada. Por eso la
    autoinvocación (`this.metodo()`) no es transaccional.

## Ejercicios

!!! exercise "Ejercicio 1 · Básico — Identificar el patrón"
    ¿Qué patrón es cada uno? (a) Envolver un cliente HTTP para medir la latencia de cada llamada. (b) Una clase
    `AwsClients` que crea S3, SQS y DynamoDB configurados para la misma región. (c) Un validador de YAML que pasa el
    documento por una lista de reglas, cada una puede rechazarlo. (d) Un `ChangeSet` que agrupa ficheros y otros `ChangeSet`.

    ??? success "Solución"
        (a) **Decorator** (misma interfaz, añade medición). (b) **Abstract Factory** (familia de objetos coherentes).
        (c) **Chain of Responsibility**. (d) **Composite**.

!!! exercise "Ejercicio 2 · Básico — Builder para un objeto de prueba"
    Escribe un *builder* de test `aDeployment()` que por defecto cree un despliegue válido (`site-001`, revisión `abc123`,
    estado `READY`) y permita cambiar solo lo relevante en cada test.

    ??? success "Solución"
        ```java
        public final class DeploymentBuilder {
            private String site = "site-001", revision = "abc123";
            private Status status = Status.READY;
            private Instant startedAt = Instant.parse("2026-01-01T10:00:00Z");

            public static DeploymentBuilder aDeployment() { return new DeploymentBuilder(); }
            public DeploymentBuilder forSite(String s) { this.site = s; return this; }
            public DeploymentBuilder withRevision(String r) { this.revision = r; return this; }
            public DeploymentBuilder failed() { this.status = Status.FAILED; return this; }
            public DeploymentBuilder startedAt(Instant t) { this.startedAt = t; return this; }
            public Deployment build() { return new Deployment(site, revision, status, startedAt); }
        }

        // En un test: solo se ve lo que importa para ese caso
        var d = aDeployment().forSite("site-042").failed().build();
        ```
        Los tests quedan legibles y, si `Deployment` gana un campo obligatorio, solo cambia el *builder*.

!!! exercise "Ejercicio 3 · Medio — Decorator de reintentos con backoff"
    Escribe un decorador `RetryingNodeClient` para `NodeClient { NodeStatus status(String id); }` que reintente hasta 3
    veces con espera exponencial (100 ms, 200 ms, 400 ms) solo ante `TransientException`.

    ??? success "Solución"
        ```java
        public class RetryingNodeClient implements NodeClient {
            private final NodeClient inner;
            private final Sleeper sleeper;                  // inyectable para no dormir en los tests

            public RetryingNodeClient(NodeClient inner, Sleeper sleeper) { this.inner = inner; this.sleeper = sleeper; }

            public NodeStatus status(String id) {
                long delay = 100;
                for (int attempt = 1; ; attempt++) {
                    try {
                        return inner.status(id);
                    } catch (TransientException e) {
                        if (attempt == 3) throw e;
                        sleeper.sleep(Duration.ofMillis(delay));
                        delay *= 2;                         // backoff exponencial
                    }
                }
            }
        }
        ```
        Solo se reintentan errores transitorios (un 404 no mejora reintentando). En producción se añadiría *jitter* aleatorio
        para que muchos clientes no reintenten sincronizados; librerías como Resilience4j lo ofrecen hecho.

!!! exercise "Ejercicio 4 · Medio — Observer asíncrono"
    El `NodeMonitor` de la página notifica a los *listeners* en el mismo hilo; uno de ellos (envío de email) tarda 3 s y
    retrasa a los demás. Modifícalo para que un *listener* lento no afecte al resto.

    ??? success "Solución"
        ```java
        public class NodeMonitor {
            private final List<NodeListener> listeners = new CopyOnWriteArrayList<>();
            private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

            void statusChanged(NodeId id, Status s) {
                for (NodeListener l : listeners) {
                    executor.submit(() -> {
                        try { l.onStatusChanged(id, s); }
                        catch (Exception e) { log.warn("Listener {} falló", l, e); }   // un fallo no afecta a otros
                    });
                }
            }
        }
        ```
        Consecuencias a asumir: se pierde el orden entre *listeners* y, si la aplicación se cae, las notificaciones en
        curso se pierden. Si deben ser fiables, pasar a eventos persistentes (outbox + cola).

!!! exercise "Ejercicio 5 · Avanzado — Máquina de estados de un rollout"
    Un *rollout* puede estar `PLANNED`, `RUNNING`, `PAUSED`, `HALTED` o `DONE`. Solo se permite: PLANNED→RUNNING,
    RUNNING→PAUSED, PAUSED→RUNNING, RUNNING→HALTED, RUNNING→DONE. Impleméntalo de forma que una transición inválida sea
    imposible de olvidar.

    ??? success "Solución"
        ```java
        public enum RolloutState {
            PLANNED, RUNNING, PAUSED, HALTED, DONE;

            private static final Map<RolloutState, Set<RolloutState>> ALLOWED = Map.of(
                PLANNED, Set.of(RUNNING),
                RUNNING, Set.of(PAUSED, HALTED, DONE),
                PAUSED,  Set.of(RUNNING),
                HALTED,  Set.of(),
                DONE,    Set.of());

            public RolloutState transitionTo(RolloutState next) {
                if (!ALLOWED.get(this).contains(next))
                    throw new IllegalStateException("Transición no permitida: " + this + " → " + next);
                return next;
            }
        }

        public class Rollout {
            private RolloutState state = RolloutState.PLANNED;
            public void start()  { state = state.transitionTo(RolloutState.RUNNING); }
            public void pause()  { state = state.transitionTo(RolloutState.PAUSED); }
            public void halt()   { state = state.transitionTo(RolloutState.HALTED); }
            public void finish() { state = state.transitionTo(RolloutState.DONE); }
        }
        ```
        La tabla de transiciones es la única fuente de verdad y se puede probar exhaustivamente. Si cada estado tuviera
        **comportamiento** distinto (no solo transiciones), el patrón *State* completo movería ese comportamiento a una clase por estado.
