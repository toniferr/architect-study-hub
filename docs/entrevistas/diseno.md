# Entrevista: Diseño y código

Código limpio, SOLID, patrones de diseño y testing. Aquí no basta con recitar definiciones: te pedirán ejemplos
reales y que digas cuándo **no** aplicar cada principio.

## Código limpio

Teoría: [Código Limpio](../libros/clean-code.md)

??? question "Básico · ¿Qué es para ti código limpio?"
    Código que **otra persona entiende y cambia con seguridad**: nombres que revelan la intención, funciones pequeñas
    que hacen una cosa a un mismo nivel de abstracción, sin duplicación, con errores tratados de forma explícita y
    **cubierto por tests** que permiten refactorizar. Se lee mucho más de lo que se escribe.

    **Repregunta:** ¿cuándo está justificado un comentario? — Para explicar el **porqué** (una decisión, un
    requisito legal, una advertencia), nunca para repetir el qué; si hace falta explicar el qué, mejor renombrar o
    extraer una función.

??? question "Medio · Nombra cinco code smells y cómo los corriges."
    - **Función larga** → extraer funciones.
    - **Clase dios / demasiadas responsabilidades** → separar por motivo de cambio.
    - **Obsesión por primitivos** (un email como `String`) → tipos de valor (`record Email`).
    - **Lista larga de parámetros** → objeto parámetro o *builder*.
    - **Envidia de funcionalidad** (un método usa más datos de otra clase) → mover el método.
    - **Cirugía a escopeta** (un cambio toca muchos ficheros) → agrupar lo que cambia junto.

    **Repregunta:** ¿cómo refactorizas código sin tests? — Primero tests de caracterización que fijen el
    comportamiento actual; luego cambios pequeños apoyados en las refactorizaciones automáticas del IDE.

??? question "Medio · ¿Excepciones o valores de retorno para los errores?"
    Excepciones para lo **excepcional** (fallos de infraestructura, errores de programación), sin tragarlas y con
    contexto. Para fallos **esperados del dominio** (saldo insuficiente, validación), un resultado explícito
    (`Optional`, un tipo `Result`, un `sealed interface` con éxito/error) hace el contrato visible y obliga a
    tratarlo.

    Reglas: no devolver `null`, no usar excepciones para el control de flujo normal, traducir excepciones en los
    límites de capa.

    **Repregunta:** ¿excepciones comprobadas en Java? — Rompen la encapsulación (la firma arrastra detalles de la
    implementación) y se llevan mal con lambdas; la mayoría de frameworks modernos usan no comprobadas.

??? question "Avanzado · ¿Cómo gestionas la deuda técnica en un equipo con presión de entregas?"
    - Hacerla **visible**: registrarla con su coste (qué ralentiza, qué riesgo tiene), no como "código feo".
    - **Regla del boy scout**: mejorar lo que tocas en cada cambio.
    - Reservar **capacidad fija** (p. ej. 15-20 %) en vez de "sprints de deuda" que nunca llegan.
    - Priorizar por **impacto × frecuencia de cambio**: la deuda en código que nadie toca puede esperar.
    - Hablar en el idioma de negocio: tiempo de entrega, incidencias, coste de oportunidad.

    **Repregunta:** ¿cómo la mides? — Tiempo de entrega de cambios en esa zona, tasa de fallos, *hotspots*
    (complejidad × frecuencia de cambio en el historial de Git).

## SOLID

Teoría: [Principios SOLID](../diseno/solid.md)

??? question "Básico · Explica SOLID en una frase cada principio."
    - **S**ingle Responsibility: una clase tiene **un único motivo para cambiar** (un actor al que responde).
    - **O**pen/Closed: abierta a extensión, cerrada a modificación: se añade comportamiento sin tocar lo que funciona.
    - **L**iskov: un subtipo debe poder sustituir a su tipo base **sin romper las expectativas** de quien lo usa.
    - **I**nterface Segregation: interfaces pequeñas y específicas; nadie depende de métodos que no usa.
    - **D**ependency Inversion: el código de alto nivel depende de **abstracciones**, no de detalles.

    **Repregunta:** ¿cuál es el más importante para la arquitectura? — La inversión de dependencias: es lo que permite
    la arquitectura hexagonal y limpia (el dominio no conoce la base de datos).

??? question "Medio · Pon un ejemplo de violación de Liskov."
    El clásico: `Cuadrado extends Rectangulo`. Un código que hace `setAncho(5); setAlto(4)` espera área 20 y con
    un cuadrado obtiene 16. Otras señales: subclases que lanzan `UnsupportedOperationException`, que comprueban el
    tipo con `instanceof`, o que **refuerzan precondiciones** o debilitan postcondiciones.

    **Repregunta:** ¿cómo lo arreglas? — Modelar con composición o con tipos inmutables que no compartan la operación
    conflictiva; la herencia debe modelar "se comporta como", no "es un" del lenguaje natural.

??? question "Medio · ¿Inyección de dependencias e inversión de dependencias son lo mismo?"
    No. La **inversión** es un principio de diseño: el módulo de alto nivel define la abstracción (un puerto) y el
    detalle la implementa; la dependencia de código apunta hacia el dominio. La **inyección** es una técnica:
    quien usa un objeto lo recibe desde fuera (constructor) en vez de crearlo. Un contenedor (Spring) automatiza la
    inyección. Puedes inyectar sin invertir (inyectar una clase concreta de infraestructura en el dominio).

    **Repregunta:** ¿por qué inyección por constructor? — Dependencias obligatorias explícitas, objetos inmutables
    y tests sin contenedor.

??? question "Avanzado · ¿Cuándo aplicar SOLID es contraproducente?"
    Cuando se aplica por anticipado: interfaces con una única implementación "por si acaso", jerarquías de
    estrategias para un único caso, diez clases para algo de veinte líneas. Añade indirección y coste de lectura
    sin beneficio. Regla práctica: abstraer **cuando aparece la segunda variación real** (o en un límite de
    arquitectura claro: puertos hacia infraestructura), y preferir YAGNI y KISS.

    **Repregunta:** ¿qué principio usas para decidir? — El coste del cambio: si la abstracción no reduce el coste de
    un cambio probable, sobra.

## Patrones de diseño

Teoría: [Patrones de diseño](../diseno/patrones-diseno.md)

??? question "Básico · ¿Qué diferencia hay entre Strategy y Template Method?"
    Ambos varían parte de un algoritmo. **Template Method** usa **herencia**: la clase base fija los pasos y las
    subclases sobrescriben algunos. **Strategy** usa **composición**: el algoritmo variable es un objeto que se
    inyecta y puede cambiarse en tiempo de ejecución. Hoy se prefiere Strategy (con lambdas, a menudo es solo una
    función).

    **Repregunta:** ¿un ejemplo en una plataforma? — Estrategias de despliegue intercambiables (canary, blue-green)
    o de reintento (exponencial, fijo).

??? question "Medio · Decorator vs. Proxy: ¿en qué se parecen y en qué no?"
    Los dos envuelven un objeto con la misma interfaz. El **Decorator** **añade comportamiento** y se apila
    (compresión + cifrado sobre un stream). El **Proxy** **controla el acceso**: carga perezosa, seguridad, remoto,
    caché. Spring usa proxies para `@Transactional`, `@Cacheable` y `@Async`.

    **Repregunta:** ¿por qué falla `@Transactional` al llamar a un método de la misma clase? — La llamada interna no
    pasa por el proxy, así que no se abre transacción.

??? question "Medio · ¿Por qué se considera Singleton un antipatrón y qué usas en su lugar?"
    Es estado global: oculta dependencias, acopla y complica los tests (no se puede sustituir por un doble) y es
    delicado con concurrencia. Lo que sí tiene sentido es **una sola instancia gestionada por el contenedor** (los
    beans de Spring son singleton por defecto) e inyectada, no accedida con `getInstance()`.

    **Repregunta:** ¿cómo harías un singleton correcto en Java si fuera imprescindible? — Un `enum` con un único
    valor, o el *holder* estático perezoso.

??? question "Medio · ¿Qué patrones reconoces en Kubernetes?"
    - **Observer / bucle de control**: controladores que observan (*watch*) el estado y reconcilian.
    - **Sidecar** (Decorator a nivel de Pod): añade capacidades sin tocar la app (proxy de la malla, agente de logs).
    - **Ambassador** (Proxy) y **Adapter** (normalizar métricas o logs).
    - **Operator**: Command + estado deseado para automatizar la operación de un sistema.
    - **Chain of Responsibility**: los *admission controllers* encadenados.

    **Repregunta:** ¿qué es un *init container* en estos términos? — Un paso previo garantizado (Template Method:
    "prepara, luego ejecuta").

??? question "Avanzado · ¿Cuándo un patrón empeora el código?"
    Cuando se usa por el nombre y no por el problema: Factory para un único producto, Observer que oculta el flujo
    de control y hace imposible depurar, cadenas de Decorators que nadie entiende, Visitor en un dominio que cambia
    a menudo. Un patrón es un **vocabulario** para un problema recurrente; si el problema no está, es complejidad.

    **Repregunta:** ¿qué patrones aparecen "gratis" en Java moderno? — Strategy y Command son lambdas; Builder se
    reduce con `record`; el Visitor se sustituye por *pattern matching* sobre tipos sellados.

## Testing

Teoría: [Testing](../diseno/testing.md)

??? question "Básico · Explica la pirámide de tests y sus alternativas."
    Muchos tests **unitarios** (rápidos, aislados), menos de **integración** y pocos **de extremo a extremo** (lentos
    y frágiles). Alternativas: el **trofeo** (más peso en integración) y el **panal** para microservicios (pocos
    unitarios, muchos de integración del servicio con sus dependencias reales, contratos entre servicios).

    Lo importante no es la forma, sino **confianza por segundo de ejecución**.

    **Repregunta:** ¿qué haces con un test inestable (*flaky*)? — Ponerlo en cuarentena con un ticket, buscar la causa
    (tiempo, orden, datos compartidos, concurrencia) y arreglarlo; nunca reintentar hasta que pase y olvidarse.

??? question "Medio · ¿Mock, stub o fake? ¿Cuándo usar cada uno?"
    - **Stub**: devuelve respuestas fijas (estado).
    - **Mock**: verifica **interacciones** (que se llamó a X con Y).
    - **Fake**: implementación funcional simplificada (repositorio en memoria).
    - **Spy**: objeto real que registra las llamadas.

    Abusar de mocks acopla los tests a la implementación y los hace frágiles al refactorizar. Mejor mockear solo
    lo que no es tuyo o es caro (red, reloj) y preferir fakes o dependencias reales con Testcontainers.

    **Repregunta:** ¿se mockea la base de datos? — Mejor no: un PostgreSQL real en un contenedor detecta errores de
    SQL, transacciones y migraciones que un mock nunca verá.

??? question "Medio · ¿Qué es el contract testing y qué problema resuelve?"
    Verifica que proveedor y consumidor de una API **están de acuerdo** sin levantar todos los servicios. Con
    **Pact** (dirigido por el consumidor), cada consumidor publica lo que espera y el proveedor lo verifica en su CI;
    `can-i-deploy` bloquea un despliegue que rompería a alguien. Sustituye a muchos tests E2E frágiles.

    **Repregunta:** ¿y con eventos de Kafka? — Igual, con contratos de mensajes, más un registro de esquemas con
    reglas de compatibilidad.

??? question "Medio · ¿Te parece buena métrica la cobertura de código?"
    Útil como **señal de lo que no está probado**, mala como objetivo: se puede tener un 90 % con tests sin
    aserciones. Mejor complementarla con **mutation testing** (PIT): introduce fallos y mira si los tests los
    detectan. Exigir un umbral razonable en el código nuevo funciona mejor que un número global.

    **Repregunta:** ¿qué es property-based testing? — Definir propiedades que siempre se cumplen (p. ej. que
    serializar y deserializar devuelve lo mismo) y dejar que la herramienta genere cientos de entradas.

??? question "Avanzado · ¿Cómo pruebas una plataforma GitOps y la infraestructura como código?"
    - **Estático**: `kubeconform` contra los esquemas, `kustomize build` / `helm template` de cada entorno, políticas
      con Kyverno u OPA (Conftest) en el CI.
    - **Plan**: `terraform plan` revisado en la PR, `terraform test`, validación de diffs (`flux diff`).
    - **Efímero**: un clúster `kind`/`k3d` en el CI que aplica y comprueba que todo reconcilia y está *ready*.
    - **En producción**: despliegue progresivo con análisis de métricas y *rollback* automático.

    **Repregunta:** ¿qué falla que no detecta el CI? — Diferencias reales del entorno: cuotas, CRDs ya instalados,
    red, secretos; por eso el despliegue progresivo y la observabilidad son parte del testing.
