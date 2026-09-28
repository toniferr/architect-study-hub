# Código Limpio (Clean Code) <span class="nivel basico">Básico</span>

> *Robert C. Martin, 2008.* Idea central: el código se **lee** muchas más veces de las que se escribe (se calcula
> una proporción de 10 a 1). Por tanto, hay que optimizar para quien lo lee: el compañero de mañana o tú dentro de seis meses.

!!! tip "En una frase"
    Código limpio es código que **hace una cosa**, la hace **bien**, y cualquier compañero lo entiende **sin sorpresas**
    y sin tener que preguntar al autor.

**Por qué importa económicamente**: el código desordenado no se nota el primer mes, pero cada cambio posterior cuesta
más (hay que entender, tocar muchos sitios, arreglar lo que se rompe). Con el tiempo, la productividad del equipo cae
hacia cero. Mantener el código limpio es la forma de ir **rápido de forma sostenida**.

## 1. Nombres significativos

El nombre es la primera y más barata documentación.

| Regla | Mal | Bien | Por qué |
|---|---|---|---|
| Revelar la **intención** | `int d;` | `int daysSinceLastDeploy;` | Sin comentario ni contexto se entiende qué es |
| Evitar **desinformar** | `accountList` (y es un `Set`) | `accounts` | El nombre no debe mentir sobre el tipo o el uso |
| Evitar **ruido** | `SiteData`, `SiteInfo`, `SiteManager` | `Site`, `SiteRegistry` | `Data`, `Info`, `Manager` no añaden significado |
| Nombres **pronunciables y buscables** | `genymdhms`, `7` | `generationTimestamp`, `MAX_RETRIES` | Se pueden discutir en voz alta y encontrar con el buscador |
| **Un concepto, una palabra** | `fetch`, `retrieve` y `get` mezclados | Siempre `find` para buscar en repositorio | La coherencia reduce la carga mental |
| Clases = **sustantivos** | `ProcessDeployment` | `DeploymentPlan` | Las clases representan cosas |
| Métodos = **verbos** | `deployment()` (¿crea?, ¿obtiene?) | `startDeployment()`, `findDeployment()` | Los métodos hacen algo |
| Longitud proporcional al **alcance** | `i` como campo de clase | `i` en un bucle de 3 líneas; `activeSiteCount` en un campo | Cuanto más lejos se usa, más descriptivo |

=== "Antes"

    ```java
    List<int[]> get(List<int[]> l) {
        List<int[]> r = new ArrayList<>();
        for (int[] x : l)
            if (x[0] == 4) r.add(x);
        return r;
    }
    ```
    ¿Qué es `l`? ¿Qué significa `x[0] == 4`? Hay que conocer el contexto para entenderlo.

=== "Después"

    ```java
    List<Cell> flaggedCells(List<Cell> board) {
        return board.stream()
                    .filter(Cell::isFlagged)
                    .toList();
    }
    ```
    El mismo algoritmo, pero se lee como una frase: "las celdas marcadas del tablero".

## 2. Funciones

### Reglas

1. **Pequeñas.** Una función que cabe en la pantalla se entiende de un vistazo. Si hay que desplazarse, hace demasiado.
2. **Hacen una sola cosa.** Prueba: si puedes extraer de ella otra función con un nombre que no sea una simple
   reformulación, hacía más de una cosa.
3. **Un solo nivel de abstracción.** No mezclar decisiones de alto nivel ("aplicar descuentos") con detalles
   (`total = total * 0.9`). Se lee de arriba abajo como un índice: cada función llama a las del nivel inferior.
4. **Pocos argumentos** (0-2 ideal). Con más de 3, agrúpalos en un objeto con nombre.
5. **Sin efectos secundarios ocultos.** Si `checkPassword()` además inicia la sesión, el nombre miente y alguien lo
   llamará solo para comprobar… e iniciará una sesión sin querer.
6. **Separación comando/consulta (CQS).** Una función **cambia estado** (comando, devuelve `void`) **o devuelve
   información** (consulta, sin efectos), no ambas cosas.
7. **Sin argumentos booleanos**: `render(true)` esconde dos funciones distintas; mejor `renderForPrint()` y `renderForScreen()`.
8. **Excepciones en lugar de códigos de error** y el manejo de errores como "una cosa" en sí misma.

=== "Antes"

    ```java
    public void process(Order o, boolean sendEmail) {
        if (o.getItems().isEmpty()) throw new IllegalArgumentException();
        double total = 0;
        for (Item i : o.getItems()) total += i.getPrice() * i.getQty();
        if (o.getCustomer().isVip()) total *= 0.9;
        o.setTotal(total);
        repo.save(o);
        if (sendEmail) mailer.send(o.getCustomer().getEmail(), "Pedido " + o.getId());
    }
    ```
    Mezcla validación, cálculo, regla de descuento, persistencia y notificación; el booleano esconde dos comportamientos.

=== "Después"

    ```java
    public void placeOrder(Order order) {                 // alto nivel: se lee como una lista de pasos
        validate(order);
        order.setTotal(totalWithDiscounts(order));
        repository.save(order);
    }

    public void placeOrderAndNotify(Order order) {
        placeOrder(order);
        notifier.orderPlaced(order);
    }

    private Money totalWithDiscounts(Order order) {       // nivel inferior: el detalle
        Money subtotal = order.subtotal();
        return discountPolicy.applyTo(order.customer(), subtotal);
    }
    ```

## 3. Comentarios

Un comentario suele ser la señal de que **no se consiguió expresar algo en el código**. Antes de comentar, intenta
renombrar o extraer una función cuyo nombre diga lo mismo que el comentario. Además, los comentarios **no se
mantienen**: el código cambia y el comentario queda mintiendo.

| Buenos comentarios | Malos comentarios |
|---|---|
| El **porqué** de una decisión no evidente | Repetir lo que el código ya dice (`// incrementa i`) |
| Advertencias de consecuencias ("no llamar en paralelo: la API externa lo prohíbe") | Comentarios desactualizados |
| TODO con referencia a una tarea | Código comentado ("por si acaso": Git ya lo guarda) |
| Documentación de APIs públicas (Javadoc) | Diarios de cambios y autores (para eso está Git) |
| Aclarar algo que el lenguaje no puede expresar (una expresión regular compleja, un formato) | Comentarios obligatorios en cada método que no dicen nada |

```java
// Malo: repite el código
// incrementa i
i++;

// Bueno: explica el porqué, que no está en el código
// Flux reconcilia cada 10 min; esperamos 2 ciclos antes de marcar el nodo edge como caído.
Duration staleThreshold = Duration.ofMinutes(20);
```

## 4. Formato

- **Metáfora del periódico**: arriba lo importante y general (el titular: métodos públicos), abajo el detalle.
- **Cercanía vertical**: lo que se usa junto, junto. Una función se declara cerca (y debajo) de quien la llama.
- **Una convención para todo el equipo aplicada por una herramienta** (Spotless, google-java-format, Prettier) en el
  CI: el formato no debe discutirse en las revisiones.

## 5. Objetos y estructuras de datos

- Un **objeto** esconde sus datos y expone **comportamiento** (`rollout.completeWave()`).
- Una **estructura de datos** expone datos y no tiene comportamiento (un DTO, un *record* de transporte).
- Ambas son válidas; el problema son los **híbridos**: clases con *getters/setters* de todo y además lógica, que tienen
  lo peor de los dos mundos.

**Ley de Deméter**: un método solo debe hablar con sus "amigos inmediatos" (sus campos, sus parámetros, lo que crea),
no con los amigos de sus amigos.

```java
// "Choque de trenes": este código conoce la estructura interna de 3 objetos
String city = order.getCustomer().getAddress().getCity();

// Mejor: pedir lo que necesitas; si cambia cómo se guarda la dirección, solo cambia Order
String city = order.shippingCity();
```

## 6. Manejo de errores

- Usa **excepciones**, no códigos de retorno: con códigos, cada llamada va seguida de un `if` y la lógica se pierde.
- **No devuelvas `null`**: obliga a cada llamante a comprobarlo y un olvido provoca un `NullPointerException` lejos de
  la causa. Alternativas: `Optional<T>`, colección vacía, patrón *Null Object*, o una excepción si es un error.
- **No pases `null`** como argumento.
- Define excepciones **en términos del llamante** (`ClusterUnavailableException`), no de la librería que usas.
- **Envuelve las APIs de terceros**: si cambias de librería, solo cambia el envoltorio.

```java
// Envolver la librería externa: el resto del código no conoce a KubernetesClientException
public class ClusterGateway {
    public Deployment find(String name) {
        try {
            return client.apps().deployments().withName(name).get();
        } catch (KubernetesClientException e) {
            throw new ClusterUnavailableException("No se pudo leer " + name, e);   // conservar la causa
        }
    }
}
```

## 7. Tests unitarios

- **Las tres leyes de TDD**: no escribir código de producción sin un test que falle; no escribir más test del necesario
  para fallar; no escribir más código del necesario para que pase.
- **Los tests son código de primera**: si están sucios, nadie los mantiene y acaban borrándose.
- **F.I.R.S.T.**: *Fast* (rápidos), *Independent* (sin depender unos de otros), *Repeatable* (mismo resultado en
  cualquier entorno), *Self-validating* (pasan o fallan, sin revisar a mano), *Timely* (escritos a tiempo, no al final).
- **Un concepto por test** y estructura *Arrange-Act-Assert* (o *Given-When-Then*).

```java
@Test
void vipCustomerGetsTenPercentDiscount() {
    // Arrange
    var order = anOrder().forVipCustomer().withItem("100.00").build();
    // Act
    Money total = pricing.totalFor(order);
    // Assert
    assertThat(total).isEqualTo(Money.of("90.00"));
}
```

Más en [Testing](../diseno/testing.md).

## 8. Clases

- **Pequeñas**, pero medidas en **responsabilidades**, no en líneas → [SRP](../diseno/solid.md#s-single-responsibility).
- **Alta cohesión**: los métodos usan la mayoría de los campos. Si un subgrupo de métodos usa solo un subgrupo de
  campos, ahí dentro hay **otra clase** esperando a ser extraída.
- **Organizadas para el cambio**: aisladas de los detalles concretos mediante interfaces → [OCP y DIP](../diseno/solid.md).

## 9. Code smells (señales de código problemático)

| Smell | Síntoma | Refactor típico |
|---|---|---|
| **Método largo** | Hay que desplazarse para leerlo | *Extract Method* |
| **Clase dios** | Todo pasa por ella; cientos de líneas y dependencias | *Extract Class*, aplicar SRP |
| **Obsesión por primitivos** | `String email`, `double money`, `String siteId` por todas partes | *Value Objects* (`Email`, `Money`, `SiteId`) |
| **Duplicación** | El mismo bloque copiado en varios sitios | *Extract Method*, plantilla |
| **Switch sobre tipos** | El mismo `switch(type)` repetido | Polimorfismo / *Strategy* |
| **Envidia de funcionalidad** | Un método usa más datos de otra clase que de la suya | *Move Method* a esa clase |
| **Lista larga de parámetros** | `f(a, b, c, d, e, f)` | *Parameter Object* |
| **Cirugía de escopeta** | Un cambio pequeño obliga a tocar 10 ficheros | Agrupar la responsabilidad en un sitio |
| **Cambio divergente** | Una clase cambia por motivos muy distintos | Dividirla (SRP) |
| **Comentarios como desodorante** | Comentarios que explican código confuso | Renombrar y extraer hasta que sobren |

!!! tip "La regla del boy scout"
    "Deja el código un poco más limpio de lo que lo encontraste." No hace falta un gran *refactor*: renombrar una
    variable o extraer una función cada vez que tocas algo mantiene el código sano con el tiempo.

## Preguntas de repaso

??? question "¿Qué es la separación comando/consulta y por qué importa?"
    Un método o **modifica estado** (comando) o **devuelve información** (consulta), no ambas. Mezclarlo produce sorpresas:
    `if (set("user", "bob"))` — ¿comprueba o asigna? Separarlo facilita razonar, cachear y probar.

??? question "¿Por qué evitar devolver null?"
    Obliga a cada llamante a comprobarlo; un olvido produce un `NullPointerException` lejos del origen. Alternativas:
    `Optional<T>`, colección vacía, *Null Object* o una excepción si es un error.

??? question "¿Cuándo sí es bueno un comentario?"
    Cuando explica el **porqué** (una decisión o restricción externa), advierte de consecuencias, documenta una API pública
    o aclara algo que el código no puede expresar.

??? question "Nombra 4 code smells y su refactor"
    Método largo → *Extract Method*; clase dios → *Extract Class*; obsesión por primitivos → *Value Object*; switch sobre
    tipos → polimorfismo/*Strategy*.

## Ejercicios

!!! exercise "Ejercicio 1 · Básico — Renombrar"
    Mejora los nombres: `int t; // tiempo en segundos desde el último heartbeat`, `List<String> list2`,
    `boolean flag`, `void doIt(Site s)` (que marca el sitio como caído y avisa), `class DataManager`.

    ??? success "Solución"
        `long secondsSinceLastHeartbeat` (o mejor un `Duration timeSinceLastHeartbeat`), `List<String> unreachableSiteIds`
        (según lo que contenga), `boolean isDecommissioned` (según lo que indique), `void markAsDownAndNotify(Site site)` (y
        probablemente separarlo en dos: `markAsDown` y `notifyDown`), `class SiteRegistry` (o el nombre del concepto de
        negocio que gestiona). El comentario del primero sobra con el nombre nuevo.

!!! exercise "Ejercicio 2 · Básico — Separar comando y consulta"
    `public boolean reserveIp(String site)` reserva una IP y devuelve `true` si lo consigue o `false` si no quedan.
    ¿Qué problema tiene y cómo lo rediseñas?

    ??? success "Solución"
        Mezcla comando (reserva) y consulta (hay IPs); además, un `false` es fácil de ignorar y el llamante puede seguir
        como si tuviera IP. Opciones: `IpAddress reserveIp(SiteId site)` que **devuelve** lo reservado y lanza
        `NoIpAvailableException` si no quedan; o un resultado explícito (`sealed interface Reservation permits Reserved,
        Exhausted`) que obliga a tratar ambos casos. Si se necesita consultar antes, `boolean hasAvailableIps()` aparte.

!!! exercise "Ejercicio 3 · Medio — Refactorizar una función"
    Refactoriza aplicando las reglas de funciones:
    ```java
    public String check(List<Site> sites, boolean html) {
        StringBuilder sb = new StringBuilder();
        int down = 0;
        for (Site s : sites) {
            long secs = Duration.between(s.getLastHeartbeat(), Instant.now()).getSeconds();
            if (secs > 600) {
                down++;
                if (html) sb.append("<li>").append(s.getCode()).append("</li>");
                else sb.append("- ").append(s.getCode()).append("\n");
            }
        }
        if (html) return "<p>" + down + " caídos</p><ul>" + sb + "</ul>";
        return down + " caídos\n" + sb;
    }
    ```

    ??? success "Solución"
        ```java
        private static final Duration HEARTBEAT_TIMEOUT = Duration.ofMinutes(10);

        public List<Site> downSites(List<Site> sites, Instant now) {           // una cosa: detectar
            return sites.stream().filter(s -> isDown(s, now)).toList();
        }

        private boolean isDown(Site site, Instant now) {
            return Duration.between(site.lastHeartbeat(), now).compareTo(HEARTBEAT_TIMEOUT) > 0;
        }

        interface DownSitesReport { String render(List<Site> downSites); }   // otra cosa: presentar

        class HtmlReport implements DownSitesReport {
            public String render(List<Site> down) {
                String items = down.stream().map(s -> "<li>" + s.code() + "</li>").collect(joining());
                return "<p>" + down.size() + " caídos</p><ul>" + items + "</ul>";
            }
        }

        class TextReport implements DownSitesReport {
            public String render(List<Site> down) {
                String items = down.stream().map(s -> "- " + s.code() + "\n").collect(joining());
                return down.size() + " caídos\n" + items;
            }
        }
        ```
        Cambios: el booleano desaparece (dos implementaciones), el número mágico 600 tiene nombre, `Instant.now()` se pasa
        como parámetro (probable), y detectar y presentar quedan separados.

!!! exercise "Ejercicio 4 · Avanzado — Limpiar una clase real"
    Toma una clase de más de 200 líneas de uno de tus proyectos (`java-api-gitops` o `spring-boot-jwt`) y aplica, en este
    orden: nombres, funciones pequeñas, eliminación de comentarios innecesarios, y extracción de una clase si hay grupos de
    métodos que usan grupos de campos distintos. ¿Cómo verificas que no has roto nada?

    ??? success "Solución"
        Procedimiento (el resultado depende de tu código):
        1. **Antes de tocar**: asegurar tests que cubran el comportamiento público de la clase; si no existen, escribir
           *characterization tests* que fijen lo que hace hoy.
        2. **Pasos pequeños** con el IDE (renombrar, extraer método, mover método son refactorizaciones automáticas y
           seguras), ejecutando los tests después de cada paso y haciendo commits frecuentes.
        3. **Cohesión**: listar qué campos usa cada método; los grupos que no se solapan son candidatos a nueva clase.
        4. **Verificar**: tests en verde, *diff* revisado (sin cambios de comportamiento mezclados con el *refactor*),
           cobertura igual o mayor, y opcionalmente *mutation testing* para comprobar que los tests detectan cambios.
