# ADRs y trade-offs <span class="nivel basico">Básico</span>

Un **Architecture Decision Record** (registro de decisión de arquitectura) es un documento corto que captura **una**
decisión significativa: el contexto en que se tomó, las alternativas, la decisión y sus consecuencias. Vive en el
repositorio (`docs/adr/`) junto al código, numerado y versionado.

## Por qué importan

- Dentro de un año nadie recordará **por qué** se eligió X. Sin registro, la decisión se reabre una y otra vez, o se
  revierte sin entender sus motivos (y se repite el problema que resolvía).
- Obligan a **pensar las alternativas** antes de decidir: escribir el ADR mejora la decisión.
- Sirven de **documentación de incorporación**: leer los ADRs explica la arquitectura mejor que un diagrama.
- Son **material de revisión**: se pueden discutir en una PR como cualquier cambio.

## Qué merece un ADR

Una decisión **significativa**: difícil o cara de revertir, que afecta a varios equipos o componentes, o que alguien
podría cuestionar más adelante. Ejemplos: elegir herramienta GitOps, estructura de repositorios, base de datos, estilo de
comunicación entre servicios, estrategia de secretos. No hace falta un ADR para elegir una librería de utilidades.

## Plantilla (Michael Nygard)

```markdown
# ADR-007: Usar Flux en lugar de Argo CD para los clústeres edge

## Estado
Aceptado — 2025-03-12   (otros estados: Propuesto, Rechazado, Obsoleto, Sustituido por ADR-012)

## Contexto
Tenemos ~N clústeres K3s en ubicaciones con conectividad intermitente y nodos con 4-8 GB de RAM.
Necesitamos reconciliación pull-based, bajo consumo de memoria y que cada sitio siga funcionando
aunque pierda la conexión con el hub.

## Decisión
Usaremos Flux v2 instalado en cada clúster, con Kustomize y un repositorio de flota con base + overlays.

## Alternativas consideradas
- Argo CD por clúster: UI útil, pero mayor consumo en nodos pequeños.
- Argo CD centralizado (hub-spoke): requiere conectividad constante hacia los sitios.

## Consecuencias
+ Cada sitio sigue reconciliando aunque pierda conexión con el hub.
+ Menor huella de recursos.
- Sin UI integrada: necesitamos dashboards propios (Grafana + métricas de Flux).
- El equipo debe formarse en los CRDs de Flux.
```

!!! note "El ejemplo es ilustrativo"
    Adáptalo con los datos reales de tu plataforma: número de sitios, recursos, restricciones y el motivo real.

### Reglas de uso

- Un ADR **no se edita** una vez aceptado (salvo erratas): si la decisión cambia, se escribe uno **nuevo** que lo
  sustituye y se marca el antiguo como "Sustituido por ADR-0NN". Así se conserva la historia.
- Cortos: una o dos páginas. Si necesita más, probablemente es un documento de diseño (RFC) con un ADR que lo resume.
- En la PR que implementa la decisión, o en una PR propia revisada por los afectados.

## Cómo analizar un trade-off

1. **Enumera las opciones**, al menos dos, incluida "no hacer nada".
2. **Define los criterios** que importan en **este** contexto (coste, latencia, operabilidad, conocimiento del equipo,
   riesgo, plazo) y **pondéralos**.
3. **Evalúa** cada opción contra cada criterio; si hay mucha incertidumbre, haz una **prueba de concepto** acotada.
4. **Decide** y explica qué **sacrificas** y **cómo mitigas** ese sacrificio.
5. **Define un punto de revisión**: qué señal te haría cambiar de opinión.

| Criterio (peso) | Flux (pull por clúster) | Argo CD central (push) |
|---|---|---|
| Tolerancia a desconexión (×3) | ✅ Alta (3) | ❌ Baja (1) |
| Huella de recursos (×2) | ✅ Baja (3) | ⚠️ Media (2) |
| Visibilidad / UI (×1) | ⚠️ Externa (1) | ✅ Integrada (3) |
| Multi-tenancy (×2) | ✅ Buena (3) | ✅ Buena (3) |
| **Total ponderado** | 3·3 + 2·3 + 1·1 + 2·3 = **22** | 3·1 + 2·2 + 1·3 + 2·3 = **16** |

!!! tip "La matriz no decide por ti"
    Sirve para **hacer explícitos** los criterios y sus pesos y discutirlos. Si el resultado contradice la intuición del
    equipo, casi siempre falta un criterio o un peso está mal: esa discusión es el valor del ejercicio.

## Otras herramientas de documentación

| Herramienta | Para qué |
|---|---|
| **Modelo C4** (Simon Brown) | Diagramas con zoom: **Contexto** (el sistema y su entorno) → **Contenedores** (aplicaciones y almacenes) → **Componentes** → Código |
| **arc42** | Plantilla completa de documentación de arquitectura (objetivos, restricciones, vistas, decisiones, riesgos) |
| **RFC / documento de diseño** | Proponer y discutir una decisión amplia **antes** de tomarla |
| **Diagramas como código** | Mermaid, PlantUML, Structurizr: versionados junto al código |

## Preguntas de repaso

??? question "¿Qué se hace cuando una decisión registrada en un ADR cambia?"
    Se escribe un ADR nuevo que explica el nuevo contexto y la nueva decisión, y el antiguo se marca como "Sustituido por".
    El antiguo no se borra ni se reescribe: la historia de por qué se decidió cada cosa es valiosa.

??? question "¿Qué diferencia hay entre un RFC y un ADR?"
    El RFC propone y discute una decisión **antes** de tomarla (puede ser largo, con alternativas detalladas). El ADR
    **registra** la decisión tomada de forma breve, con su contexto y consecuencias.

## Ejercicios

!!! exercise "Ejercicio 1 · Básico — ¿Merece un ADR?"
    ¿Cuáles merecen ADR? (a) Usar AssertJ en lugar de Hamcrest. (b) Pasar de un repositorio GitOps por equipo a un
    monorepo. (c) Elegir SOPS o External Secrets para los secretos. (d) Renombrar un paquete Java.

    ??? success "Solución"
        (b) y (c): afectan a varios equipos, son caras de revertir y alguien las cuestionará. (a) es una preferencia local
        (basta una nota en la guía de estilo); (d) es un *refactor* sin impacto arquitectónico.

!!! exercise "Ejercicio 2 · Medio — Escribir un ADR"
    Escribe el ADR de la decisión "Gestionar secretos con SOPS + age en el repositorio GitOps en lugar de External Secrets
    Operator con Vault", para una flota edge con conectividad intermitente.

    ??? success "Solución"
        ```markdown
        # ADR-009: Secretos cifrados con SOPS + age en el repositorio GitOps

        ## Estado
        Aceptado — 2026-09-26

        ## Contexto
        Los sitios edge pierden conectividad durante horas o días. Necesitan poder arrancar y reconciliar
        (incluidos secretos) sin acceso a servicios centrales. Hoy no operamos Vault.

        ## Decisión
        Los secretos se guardan cifrados con SOPS (clave age por entorno/región) dentro del repositorio GitOps;
        Flux los descifra en cada clúster con la clave privada, provisionada en el alta del sitio.

        ## Alternativas consideradas
        - External Secrets + Vault: rotación centralizada y auditoría, pero cada sitio depende de alcanzar Vault.
        - Sealed Secrets: clave por clúster; con miles de clústeres, re-cifrar para cada uno es inmanejable.

        ## Consecuencias
        + Los sitios son autónomos: el secreto viaja con el estado deseado.
        + Sin servicio adicional que operar.
        - Rotar un secreto exige un commit y su propagación; la rotación automática es más difícil.
        - La clave age de cada región es crítica: se custodia en KMS y se rota anualmente (procedimiento en runbook-12).
        - Revisar si en el futuro hay conectividad fiable: External Secrets sería preferible (punto de revisión: 2027).
        ```

!!! exercise "Ejercicio 3 · Avanzado — Matriz de decisión"
    Debes elegir la base de datos para almacenar la telemetría de 20 000 sitios (5 000 eventos/s, consultas por sitio y
    rango de tiempo, retención de 13 meses). Opciones: PostgreSQL + TimescaleDB, ClickHouse, servicio gestionado de series
    temporales del proveedor cloud. Construye la matriz con criterios y pesos razonados.

    ??? success "Solución"
        | Criterio (peso) | Timescale | ClickHouse | Gestionado cloud |
        |---|---|---|---|
        | Rendimiento de ingesta y consulta analítica (×3) | 2 | 3 | 2 |
        | Coste a 13 meses de retención (×2) | 2 | 3 | 1 |
        | Operación / conocimiento del equipo (×3) | 3 (ya usan PostgreSQL) | 1 | 3 |
        | Portabilidad / *lock-in* (×1) | 3 | 3 | 1 |
        | **Total** | 6+4+9+3 = **22** | 9+6+3+3 = **21** | 6+2+9+1 = **18** |

        Casi empate entre Timescale y ClickHouse: la decisión depende de la **operación** (peso 3). Recomendación:
        Timescale ahora (el equipo ya domina PostgreSQL), con un punto de revisión explícito: si las consultas analíticas
        sobre más de 1 000 M de filas superan 5 s, evaluar ClickHouse. El ADR debe recoger ese umbral.
