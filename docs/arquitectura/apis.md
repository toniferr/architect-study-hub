# Diseño de APIs <span class="nivel medio">Medio</span>

Una API pública es un **contrato** difícil de cambiar: los clientes dependen de ella y no controlas cuándo se actualizan.
Diseñarla bien es una de las responsabilidades más duraderas de un arquitecto.

## 1. Estilos de API

| Estilo | Fortalezas | Debilidades | Cuándo |
|---|---|---|---|
| **REST** (HTTP + JSON) | Universal, cacheable, sencillo de depurar | Sobre/infra-obtención de datos, sin contrato fuerte por defecto | APIs públicas, CRUD, integración general |
| **gRPC** (HTTP/2 + Protobuf) | Rápido, contrato tipado, *streaming* bidireccional, generación de código | Menos amigable en navegador, binario | Servicio a servicio, baja latencia, edge ↔ hub |
| **GraphQL** | El cliente pide exactamente lo que necesita; un esquema tipado | Caché HTTP difícil, consultas costosas, complejidad en el servidor | BFF para UIs con necesidades variadas |
| **Asíncrona** (eventos, colas) | Desacoplamiento temporal, escalabilidad | Consistencia eventual, depuración más difícil | Integración entre dominios, notificaciones |
| **WebSocket / SSE** | Tiempo real (servidor → cliente) | Conexiones persistentes que escalar | Dashboards en vivo, chat, progreso |

## 2. Diseño primero (*API-first*)

1. Escribir el **contrato** (OpenAPI, Protobuf, AsyncAPI) y revisarlo con los consumidores.
2. Generar *mocks*, SDKs y documentación a partir de él.
3. Implementar y validar la implementación contra el contrato en CI.

```yaml
# OpenAPI 3.1 (extracto)
paths:
  /sites/{siteId}/deployments:
    get:
      summary: Lista los despliegues de un sitio, del más reciente al más antiguo
      parameters:
        - { name: siteId, in: path, required: true, schema: { type: string, example: site-042 } }
        - { name: limit, in: query, schema: { type: integer, default: 20, maximum: 100 } }
        - { name: cursor, in: query, schema: { type: string } }
      responses:
        "200":
          description: Página de despliegues
          content:
            application/json:
              schema: { $ref: "#/components/schemas/DeploymentPage" }
        "404": { $ref: "#/components/responses/NotFound" }
```

## 3. REST bien hecho

### Recursos y URLs

| ✅ Bien | ❌ Mal | Por qué |
|---|---|---|
| `GET /sites/42/deployments` | `GET /getDeploymentsForSite?id=42` | Recursos (sustantivos), el verbo lo pone HTTP |
| `POST /rollouts` | `POST /createRollout` | Ídem |
| `POST /rollouts/7/cancel` | `PUT /rollouts/7 {status: "CANCELLED"}` con efectos ocultos | Las **acciones** con semántica propia pueden modelarse como subrecurso |
| `/sites/42` | `/Sites/42/` | Minúsculas, sin barra final, consistencia |

### Modelo de madurez de Richardson

| Nivel | Qué añade |
|---|---|
| 0 | Un único endpoint (estilo RPC sobre HTTP) |
| 1 | Recursos con URLs propias |
| 2 | Verbos y códigos HTTP correctos ← donde está la mayoría de APIs buenas |
| 3 | HATEOAS: la respuesta incluye enlaces a las acciones posibles |

### Códigos de estado

| Código | Cuándo |
|---|---|
| 200 / 201 / 202 / 204 | OK / creado (+ cabecera `Location`) / aceptado para proceso asíncrono / sin contenido |
| 400 | Petición mal formada |
| 401 / 403 | No autenticado / autenticado pero sin permiso |
| 404 | No existe (o no debes saber que existe) |
| 409 | Conflicto de estado (versión obsoleta, duplicado) |
| 412 | Precondición fallida (`If-Match` con ETag obsoleto) |
| 422 | Validación semántica fallida |
| 429 | Demasiadas peticiones (+ `Retry-After`) |
| 500 / 502 / 503 / 504 | Error interno / *gateway* / no disponible / *timeout* |

### Errores estructurados (RFC 9457 *Problem Details*)

```json
{
  "type": "https://api.acme.com/problems/rollout-halted",
  "title": "Rollout detenido",
  "status": 409,
  "detail": "La oleada 2 superó el umbral del 2 % de errores",
  "instance": "/rollouts/7f3a",
  "wave": 2,
  "errorRate": 0.034
}
```

## 4. Idempotencia y concurrencia

`POST` no es idempotente: un reintento tras un *timeout* puede crear dos recursos o cobrar dos veces.

```http
POST /payments
Idempotency-Key: 5f1c2e0a-8f7b-4c7e-9a1e-2b3c4d5e6f70
Content-Type: application/json

{ "amount": 100, "currency": "EUR" }
```

El servidor guarda la clave con la respuesta durante un tiempo (p. ej. 24 h): si llega de nuevo, devuelve la misma
respuesta sin repetir la operación.

**Control de concurrencia optimista** con ETags:

```http
GET /rollouts/7            → 200, ETag: "v12"
PUT /rollouts/7            If-Match: "v12"   → 200 (o 412 si alguien lo cambió antes)
```

## 5. Paginación, filtrado y operaciones largas

| Paginación | Cómo | Pros / contras |
|---|---|---|
| *Offset* | `?offset=40&limit=20` | Simple; lenta en tablas grandes; salta o repite elementos si cambian los datos |
| **Cursor** | `?cursor=eyJpZCI6MTIzfQ&limit=20` | Estable y eficiente (`WHERE id < :last`); no permite saltar a la página N |

**Operaciones largas**: responder `202 Accepted` con un recurso de estado que el cliente consulta (o un *webhook*):

```http
POST /sites/42/rollouts      → 202 Accepted, Location: /operations/9c1
GET  /operations/9c1         → 200 { "status": "RUNNING", "progress": 0.4 }
```

## 6. Versionado y evolución

- **Cambios compatibles** (no requieren versión): añadir campos opcionales, nuevos endpoints, nuevos valores tolerados.
- **Incompatibles**: quitar o renombrar campos, cambiar tipos o semántica, hacer obligatorio algo opcional.
- Estrategias: versión en la URL (`/v2/…`, la más explícita), en cabecera o *media type*, o evolución sin versiones
  (solo cambios aditivos + deprecación).
- **Tolerant reader**: los clientes ignoran campos desconocidos.
- Deprecación: cabeceras `Deprecation` y `Sunset`, métricas de uso por versión, plazos comunicados.
- En gRPC/Protobuf: nunca reutilizar números de campo; marcar los eliminados como `reserved`.

## 7. Seguridad de APIs

| Tema | Buenas prácticas |
|---|---|
| **Autenticación** | OAuth 2.0 / **OpenID Connect**; *access tokens* de corta duración; mTLS entre servicios |
| **Autorización** | Comprobar en **cada** recurso que el usuario puede acceder a **ese** objeto (el fallo nº 1 de OWASP API: BOLA) |
| ***Scopes*** | Permisos de grano fino por token (`deployments:read`) |
| **JWT** | Validar firma, `iss`, `aud`, `exp`; no aceptar `alg: none`; no meter datos sensibles (solo está codificado, no cifrado) |
| **Entrada** | Validar contra el esquema; límites de tamaño; no confiar en IDs del cliente |
| **Salida** | No devolver más datos de los necesarios (*excessive data exposure*) |
| **Protección** | *Rate limiting* y cuotas en el *gateway* → [Rate limiter](../system-design/rate-limiter.md) |

### OWASP API Security Top 10 (2023)

Autorización rota a nivel de objeto (BOLA) · autenticación rota · autorización rota a nivel de propiedad ·
consumo de recursos sin límite · autorización rota a nivel de función · acceso sin restricciones a flujos de negocio
sensibles · SSRF · mala configuración de seguridad · inventario de APIs deficiente · consumo inseguro de APIs de terceros.

## 8. gRPC en la práctica

```protobuf
syntax = "proto3";
package fleet.v1;

service FleetService {
  rpc GetNode(GetNodeRequest) returns (Node);
  rpc WatchNodeEvents(WatchRequest) returns (stream NodeEvent);   // streaming servidor → cliente
}

message GetNodeRequest { string node_id = 1; }

message Node {
  string id = 1;
  bool ready = 2;
  string reconciled_revision = 3;
  reserved 4;                       // campo eliminado: su número no se reutiliza
}
```

Plazos (*deadlines*) obligatorios en cada llamada, códigos de estado propios (`UNAVAILABLE`, `DEADLINE_EXCEEDED`…),
y *gRPC-Gateway* o *Connect* si también necesitas exponerlo como REST/JSON.

## 9. API gateways y gestión

- Funciones: enrutado, autenticación, *rate limiting*, transformación, observabilidad, portal de desarrolladores.
- Productos: Kong, Envoy Gateway, NGINX, Apigee, AWS API Gateway, Azure API Management; en Kubernetes, la **Gateway API**.
- **BFF** (*Backend for Frontend*): una API por tipo de cliente (web, móvil) que agrega servicios internos.

## Preguntas de repaso

??? question "¿Cómo haces idempotente un POST de pago?"
    Con una **clave de idempotencia** generada por el cliente: el servidor la registra junto con el resultado y, ante un
    reintento con la misma clave, devuelve el resultado guardado sin volver a ejecutar la operación.

??? question "¿Por qué la paginación por cursor es mejor en colecciones grandes?"
    Porque usa un índice para continuar desde el último elemento (`WHERE id < :cursor`) en lugar de recorrer y descartar
    N filas, y no se desordena si se insertan o borran elementos entre páginas.

??? question "¿Qué es BOLA y cómo se evita?"
    *Broken Object Level Authorization*: el usuario cambia un ID en la URL y accede a un objeto ajeno. Se evita comprobando
    en cada acceso que el objeto pertenece o es visible para el usuario autenticado, no solo que está autenticado.

??? question "¿Qué cambios de una API son compatibles hacia atrás?"
    Añadir endpoints, campos opcionales en peticiones y campos nuevos en respuestas (si los clientes son *tolerant readers*).
    Quitar, renombrar, cambiar tipos o semántica, o hacer obligatorio un campo, no lo son.

## Ejercicios

!!! exercise "Ejercicio 1 · Básico — Corregir el diseño REST"
    Corrige estos endpoints: `GET /getSite?id=42`, `POST /deleteSite/42`, `GET /sites/42/restart`,
    `POST /sites` que responde `200` con el sitio creado.

    ??? success "Solución"
        - `GET /sites/42` (recurso en la URL, verbo en HTTP).
        - `DELETE /sites/42` → `204 No Content`.
        - Reiniciar **modifica** estado, así que nunca `GET` (los GET pueden repetirse, cachearse o precargarse):
          `POST /sites/42/restart` → `202 Accepted` si es asíncrono.
        - `POST /sites` → **`201 Created`** con cabecera `Location: /sites/43` y el recurso en el cuerpo.

!!! exercise "Ejercicio 2 · Básico — Clasificar cambios de API"
    ¿Cuáles rompen a los clientes existentes? (a) Añadir el campo `region` a la respuesta de `GET /sites/{id}`.
    (b) Hacer obligatorio el campo `region` en `POST /sites`. (c) Cambiar `status` de texto a número. (d) Añadir el
    endpoint `GET /regions`. (e) Añadir un valor nuevo `DECOMMISSIONED` al *enum* `status`.

    ??? success "Solución"
        Rompen: (b) (los clientes que no lo envían reciben 400) y (c) (cambio de tipo). No rompen: (a) y (d). (e) **depende**:
        es compatible solo si los clientes están preparados para valores desconocidos (*tolerant reader*); muchos generadores
        de código fallan al deserializar un *enum* desconocido. Documenta siempre que los *enums* pueden crecer.

!!! exercise "Ejercicio 3 · Medio — Implementar idempotencia"
    Implementa en Spring el soporte de `Idempotency-Key` para `POST /rollouts`: si llega la misma clave con el mismo
    cuerpo, devolver la respuesta original; si llega con otro cuerpo, `422`.

    ??? success "Solución"
        ```java
        @PostMapping("/rollouts")
        public ResponseEntity<RolloutDto> create(@RequestHeader("Idempotency-Key") String key,
                                                 @RequestBody @Valid CreateRollout body) {
            String bodyHash = sha256(canonicalJson(body));
            Optional<StoredResponse> previous = idempotencyStore.find(key);
            if (previous.isPresent()) {
                if (!previous.get().requestHash().equals(bodyHash))
                    throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Clave reutilizada con otro cuerpo");
                return previous.get().toResponseEntity();            // misma respuesta, sin repetir la operación
            }
            RolloutDto created = service.create(body);
            idempotencyStore.save(key, bodyHash, 201, created, Duration.ofHours(24));
            return ResponseEntity.created(URI.create("/rollouts/" + created.id())).body(created);
        }
        ```
        Para evitar la carrera de dos peticiones simultáneas con la misma clave, `idempotencyStore` debe reservar la clave de
        forma atómica **antes** de ejecutar (por ejemplo, `INSERT` con estado "en curso" y restricción única); la segunda
        petición recibe `409` mientras la primera no termine.

!!! exercise "Ejercicio 4 · Medio — Paginación por cursor"
    Diseña la paginación de `GET /sites/{id}/deployments` ordenada por fecha descendente con cursor, incluyendo la consulta SQL.

    ??? success "Solución"
        El cursor codifica la posición del último elemento devuelto: `(started_at, id)` (el `id` desempata fechas iguales),
        en Base64 para que el cliente lo trate como opaco.
        ```sql
        SELECT id, revision, status, started_at FROM deployment
        WHERE site_id = :siteId
          AND (started_at, id) < (:cursorStartedAt, :cursorId)     -- omitir en la primera página
        ORDER BY started_at DESC, id DESC
        LIMIT :limit + 1;                                          -- uno extra para saber si hay más
        ```
        Respuesta: `{ "items": [...], "nextCursor": "eyJ0IjoiMjAyNi0wOS0yNlQxMDowMFoiLCJpZCI6OTg3fQ==" }` (o `null` si no
        hay más). Índice necesario: `(site_id, started_at DESC, id DESC)`.

!!! exercise "Ejercicio 5 · Avanzado — REST o gRPC para el enlace edge-hub"
    Los agentes de 20 000 sitios envían al hub su estado cada 30 s y reciben órdenes (reiniciar, recoger diagnósticos).
    Las conexiones son móviles e intermitentes. ¿REST, gRPC o eventos? Justifica y esboza el contrato.

    ??? success "Solución"
        - **Estado periódico**: gRPC (Protobuf compacto, HTTP/2 con conexión reutilizada) o REST con JSON comprimido; con
          20 000 × 1/30 s ≈ 670 peticiones/s ambos sirven. gRPC aporta contrato tipado y menos bytes en enlaces caros.
        - **Órdenes hacia el sitio**: el sitio está detrás de NAT, así que el hub no puede llamarle. Opciones: el agente abre
          un ***stream* bidireccional** gRPC y el hub empuja órdenes por él, o el agente **consulta** órdenes pendientes en
          cada ciclo (*pull*), más simple y robusto ante desconexiones.
        - Recomendación: *pull* para órdenes (encaja con el modelo GitOps y con enlaces intermitentes), gRPC con
          *deadlines* cortos y reintentos, y órdenes **idempotentes** con ID (pueden entregarse más de una vez).
        ```protobuf
        service EdgeAgent {
          rpc ReportStatus(StatusReport) returns (Commands);   // el sitio informa y recibe órdenes pendientes
          rpc AckCommand(CommandAck) returns (Empty);
        }
        ```
