# System Design Interview <span class="nivel medio">Medio</span>

> *Alex Xu, vol. 1 (2020) y vol. 2 (con Sahn Lam, 2022).* Idea central: diseñar un sistema es una
> **conversación estructurada** sobre trade-offs; no existe una única respuesta correcta.

!!! tip "En una frase"
    Aclara requisitos → estima → diseño de alto nivel → profundiza en 1-2 piezas → cierra con
    cuellos de botella y mejoras. **Piensa en voz alta** todo el rato.

## 1. El marco de 4 pasos (45-60 min)

| Paso | Tiempo | Qué hacer | Error típico |
|---|---|---|---|
| **1. Entender el problema y acotar** | 5-10 min | Preguntar requisitos funcionales y no funcionales, usuarios, escala | Empezar a dibujar sin preguntar |
| **2. Diseño de alto nivel** | 10-15 min | Diagrama de cajas, API, modelo de datos. Pedir *feedback* | Entrar en detalles demasiado pronto |
| **3. Profundizar** | 10-25 min | Las 1-2 piezas más críticas (las de mayor riesgo) | Querer profundizar en todo |
| **4. Cerrar** | 3-5 min | Cuellos de botella, fallos, monitorización, siguientes pasos | Decir "está perfecto" |

### Preguntas del paso 1 (plantilla)

- ¿Cuáles son las **funcionalidades** imprescindibles? ¿Qué queda **fuera**?
- ¿Cuántos **usuarios** (DAU)? ¿Qué **ratio lectura/escritura**?
- ¿Qué **latencia** y **disponibilidad** se esperan? ¿Se tolera **consistencia eventual**?
- ¿Tamaño de los datos? ¿Cuánto tiempo se **retienen**?
- ¿Web, móvil, ambos? ¿Global o una región?

## 2. Estimaciones "back-of-the-envelope"

### Números que conviene saber

| Operación | Latencia aproximada |
|---|---|
| Referencia a caché L1 | 1 ns |
| Referencia a memoria principal | 100 ns |
| Leer 1 MB secuencial de memoria | 250 µs |
| Ida y vuelta en el mismo datacenter | 0,5 ms |
| Leer 1 MB secuencial de SSD | 1 ms |
| *Seek* de disco HDD | 10 ms |
| Ida y vuelta Europa ↔ EE. UU. | ~150 ms |

Son las cifras "clásicas" (Jeff Dean). El hardware actual es más rápido; lo que importa es el
**orden de magnitud**: memoria ≫ SSD ≫ red entre regiones.

| Potencia | Aproximación | Nombre |
|---|---|---|
| 2^10 | mil | KB |
| 2^20 | millón | MB |
| 2^30 | mil millones | GB |
| 2^40 | billón | TB |

| Disponibilidad | Caída al año |
|---|---|
| 99 % | 3,65 días |
| 99,9 % | 8,77 horas |
| 99,99 % | 52,6 minutos |
| 99,999 % | 5,26 minutos |

!!! tip "Atajo"
    Un día tiene ~**86 400 s ≈ 10^5 s**. Así, 1 millón de peticiones/día ≈ **12 QPS**.

### Ejemplo resuelto: tipo Twitter

- 300 M usuarios mensuales, 50 % activos al día → **150 M DAU**.
- Cada usuario publica 2 tweets/día → 300 M tweets/día → 300 M / 10^5 ≈ **3 500 QPS** de escritura. Pico ×2 ≈ **7 000 QPS**.
- 10 % de tweets con media de 1 MB → 30 M × 1 MB = **30 TB/día** de media → ~**55 PB en 5 años**.

!!! exercise "Ejercicio · Medio — Estimar QPS y almacenamiento"
    Estima QPS y almacenamiento para: (a) un servicio de telemetría de 50 000 nodos edge que envían
    un evento de 2 KB cada 10 s; (b) un chat con 10 M DAU y 40 mensajes/día por usuario de 100 bytes.

    ??? question "Solución (a)"
        50 000 / 10 = **5 000 eventos/s**. 5 000 × 2 KB = 10 MB/s → ×86 400 ≈ **864 GB/día** ≈ 315 TB/año sin comprimir.
        Conclusión: hace falta compresión, *downsampling* y una base de datos de series temporales.

    ??? question "Solución (b)"
        400 M mensajes/día / 10^5 ≈ **4 000 QPS** (pico ~8 000). 400 M × 100 B = **40 GB/día** ≈ 14,6 TB/año.

## 3. Bloques de construcción que se repiten

Todos se explican con detalle en [Fundamentos de system design](../system-design/fundamentos.md).

- Balanceador de carga · servidores *stateless* · escalado horizontal
- Caché (Redis/Memcached) · CDN
- Replicación de BBDD (líder/seguidores) · *sharding*
- Colas de mensajes (Kafka, RabbitMQ, SQS) · procesamiento asíncrono
- *Consistent hashing* · *rate limiting* · generadores de IDs únicos
- Monitorización, logging, métricas · despliegue multi-región

## 4. Casos del libro (vol. 1 y 2)

| Caso | Concepto clave que enseña | En esta web |
|---|---|---|
| Rate limiter | Token bucket, contadores en Redis | [Resuelto](../system-design/rate-limiter.md) |
| Consistent hashing | Anillo, nodos virtuales | [Fundamentos](../system-design/fundamentos.md#consistent-hashing) |
| Key-value store | CAP, quórum, vector clocks, gossip | [Resuelto](../system-design/key-value-store.md) |
| Generador de IDs únicos | Snowflake (timestamp + máquina + secuencia) | [Fundamentos](../system-design/fundamentos.md#9-generacion-de-ids-unicos-snowflake) |
| Acortador de URLs | Base62, hash vs. contador, redirección 301/302 | [Resuelto](../system-design/url-shortener.md) |
| Web crawler | BFS, *politeness*, deduplicación | [Resuelto](../system-design/web-crawler.md) |
| Sistema de notificaciones | Colas, reintentos, plantillas | [Resuelto](../system-design/notificaciones.md) |
| News feed | *Fan-out on write* vs. *on read* | [Resuelto](../system-design/news-feed.md) |
| Chat | WebSockets, presencia, orden de mensajes | [Resuelto](../system-design/chat.md) |
| Autocompletado | Trie, top-k | [Resuelto](../system-design/autocompletado.md) |
| YouTube / Google Drive | Almacenamiento de blobs, CDN, transcodificación | [Resuelto](../system-design/video.md) |
| Proximidad / Maps (vol. 2) | Geohash, quadtree | [Resuelto](../system-design/proximidad.md) |
| Pagos / wallet (vol. 2) | Idempotencia, *exactly-once*, reconciliación | [Resuelto](../system-design/pagos.md) |

## Autoevaluación

??? question "¿Qué haces en los primeros 5 minutos?"
    Preguntar: funcionalidades en alcance, escala (DAU, QPS, datos), requisitos no funcionales (latencia,
    disponibilidad, consistencia) y restricciones. Escribirlos en la pizarra y confirmarlos.

??? question "¿Cuántas QPS son 100 M de peticiones al día?"
    100 M / ~10^5 s ≈ **1 000-1 200 QPS** de media; con pico ×2-3, ~3 000 QPS.

??? question "¿Qué significa 'cuatro nueves' y cuánto downtime permite?"
    99,99 % de disponibilidad → unos **52 minutos al año**.

??? question "¿Cómo cierras una sesión de diseño?"
    Resumiendo el diseño, señalando cuellos de botella y puntos únicos de fallo, cómo escalaría ×10,
    qué monitorizaría y qué mejoraría con más tiempo.

## Ejercicios

!!! exercise "Ejercicio 1 · Básico — Estimación de telemetría"
    20 000 sitios envían cada 15 s un informe de 4 KB con el estado de sus 3 nodos. Calcula peticiones por segundo,
    volumen diario y almacenamiento anual (con compresión 5:1).

    ??? success "Solución"
        Peticiones: 20 000 / 15 ≈ **1 333/s**. Volumen: 1 333 × 4 KB ≈ 5,3 MB/s → × 86 400 ≈ **460 GB/día** sin comprimir
        → 92 GB/día comprimido → **~34 TB/año**. Conclusiones: el *throughput* es modesto para un servicio de ingesta, pero el
        almacenamiento pide *downsampling* (conservar el detalle 30 días y agregados de 5 min después) y almacenamiento frío.

!!! exercise "Ejercicio 2 · Medio — Aplicar el marco de 4 pasos"
    Aplica los pasos 1 y 2 del marco a "diseñar el servicio que indica a cada sitio edge qué versión debe ejecutar". Escribe
    las preguntas de requisitos y el diagrama de alto nivel.

    ??? success "Solución"
        **Paso 1 — preguntas**: ¿cuántos sitios (20 000)? ¿con qué frecuencia consultan (cada 5 min)? ¿el sitio debe
        funcionar sin conexión (sí: usa la última versión conocida)? ¿cómo se decide la versión (por anillo y excepciones por
        sitio)? ¿qué latencia tolera la propagación (minutos)? ¿auditoría de quién cambió qué (sí)?
        Carga: 20 000 / 300 s ≈ 67 peticiones/s, lecturas casi exclusivas.

        **Paso 2 — diseño**: la "fuente de verdad" es Git (versión por anillo y excepciones); los sitios consultan
        directamente Git/OCI (modelo GitOps: Flux) o un servicio ligero sin estado detrás de CDN que responde "versión para
        el sitio X" leyendo un índice generado a partir de Git en cada *merge*. Escrituras = PRs (auditoría gratuita).
        Resultado: un sistema casi sin carga en el hub y que funciona desconectado, porque cada sitio guarda su último estado.

!!! exercise "Ejercicio 3 · Avanzado — Cierre de una sesión de diseño"
    Para el diseño del ejercicio anterior, escribe el "paso 4": cuellos de botella, fallos, monitorización y mejoras.

    ??? success "Solución"
        - **Puntos únicos de fallo**: el proveedor de Git/registro → réplica o *mirror*, y los sitios toleran su caída
          (siguen con lo que tienen).
        - **Picos**: si todos los sitios reinician a la vez (corte eléctrico regional) consultan a la vez → CDN y *jitter* en
          el intervalo de consulta.
        - **Seguridad**: credenciales de solo lectura por sitio; artefactos firmados y verificados en el sitio.
        - **Monitorización**: % de sitios en la versión esperada por anillo, tiempo de propagación, sitios sin consultar hace > 1 h.
        - **Mejoras a ×10** (200 000 sitios): particionar el repositorio por región, índices precalculados en almacenamiento
          de objetos y *webhooks* para propagar más rápido.
