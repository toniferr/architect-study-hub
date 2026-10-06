# Entrevista: Cloud

AWS, Azure y Google Cloud, sus equivalencias, costes y FinOps. Las preguntas de cloud en una entrevista de arquitecto
rara vez son "qué es S3": son **dónde ejecutarías esto, cómo lo harías resistente y cuánto costaría**.

## Conceptos comunes y equivalencias

Teoría: [Equivalencias entre nubes](../cloud/equivalencias.md)

??? question "Básico · ¿Qué diferencia hay entre región y zona de disponibilidad, y cómo diseñas para alta disponibilidad?"
    Una **región** es un área geográfica con varias **zonas de disponibilidad**: centros de datos independientes
    (energía, red, refrigeración) conectados con baja latencia. Diseño:

    - **Multi-AZ** como estándar: balanceador y réplicas repartidas en 2-3 zonas, base de datos con réplica síncrona
      en otra zona.
    - **Multirregión** solo si el negocio lo exige (desastre regional, latencia global, regulación): mucho más caro y
      complejo por los datos.

    **Repregunta:** ¿qué son RTO y RPO? — Tiempo máximo para recuperar el servicio y cantidad máxima de datos que se
    puede perder; deciden la estrategia (copia de seguridad, *pilot light*, *warm standby*, activo-activo).

??? question "Medio · ¿Dónde ejecutarías un servicio: VM, contenedores gestionados, Kubernetes o serverless?"
    - **Funciones** (Lambda, Azure Functions, Cloud Run functions): eventos y cargas esporádicas, cero operación,
      pago por uso; límites de duración y arranques en frío.
    - **Contenedores sin clúster** (Cloud Run, ECS Fargate, Azure Container Apps): servicios HTTP con poca operación,
      escalado a cero.
    - **Kubernetes gestionado** (EKS, AKS, GKE): muchos servicios, plataforma común, portabilidad, ecosistema; exige
      un equipo de plataforma.
    - **VMs**: software heredado, licencias, control total.

    **Repregunta:** ¿cuándo serverless sale más caro? — Con carga alta y constante: a partir de cierto uso sostenido,
    contenedores o VMs reservadas son más baratos.

??? question "Medio · ¿Cómo diseñas la red de una plataforma en la nube?"
    - Red privada (VPC / VNet) con **subredes públicas** solo para balanceadores y **privadas** para cargas y datos,
      en varias zonas.
    - Salida a Internet por NAT; acceso a servicios gestionados por **endpoints privados** (sin pasar por Internet).
    - **Hub-spoke**: un hub con firewall, conectividad híbrida (VPN, Direct Connect / ExpressRoute / Interconnect) y
      DNS; *spokes* por entorno o equipo.
    - Planificar los **rangos CIDR** sin solaparse con on-premise ni entre sí.

    **Repregunta:** ¿por qué importa el NAT en el coste? — Se cobra por hora y por GB procesado; mucho tráfico hacia
    servicios de la nube por NAT es un coste oculto típico (se evita con endpoints privados).

## AWS, Azure y Google Cloud

Teoría: [AWS](../cloud/aws.md) · [Azure](../cloud/azure.md) · [Google Cloud](../cloud/gcp.md)

??? question "Medio · ¿Cómo evalúa AWS IAM si una petición está permitida?"
    1. Por defecto, todo **denegado**.
    2. Un `Allow` explícito en alguna política aplicable lo permite…
    3. …salvo un `Deny` explícito en cualquier sitio: **el Deny siempre gana**.
    4. SCPs de la organización, *permission boundaries* y políticas de sesión **limitan** el máximo: no conceden nada.

    Buenas prácticas: roles con credenciales temporales en lugar de usuarios con claves, mínimo privilegio, una cuenta
    por entorno o carga dentro de AWS Organizations.

    **Repregunta:** ¿por qué varias cuentas? — Aislamiento de seguridad y de cuotas, radio de impacto limitado y
    facturación separada.

??? question "Medio · ¿Qué tipos de almacenamiento ofrece la nube y cuándo usar cada uno?"
    - **Objetos** (S3, Blob Storage, Cloud Storage): datos no estructurados, ilimitado y barato, acceso por API; clases
      frías y ciclo de vida.
    - **Bloques** (EBS, Managed Disks, Persistent Disk): disco de una VM, baja latencia, una zona.
    - **Ficheros** (EFS, Azure Files, Filestore): sistema de ficheros compartido entre máquinas.
    - Bases de datos gestionadas para datos estructurados.

    **Repregunta:** ¿qué garantías de consistencia tiene S3? — Consistencia fuerte de lectura tras escritura para
    objetos (desde 2020).

??? question "Medio · ¿Cómo se organizan los recursos y los permisos en Azure?"
    Jerarquía: **tenant** de Microsoft Entra ID → **grupos de administración** → **suscripciones** → **grupos de
    recursos** → recursos. Los permisos (**Azure RBAC**) y las **Azure Policies** se asignan en cualquier nivel y se
    heredan hacia abajo.

    Identidades: usuarios y grupos de Entra ID, *service principals* para aplicaciones y **managed identities** para
    que los recursos de Azure se autentiquen sin secretos.

    **Repregunta:** ¿*managed identity* asignada por el sistema o por el usuario? — Del sistema: ligada a un recurso y
    se borra con él. Del usuario: independiente y compartible entre varios recursos.

??? question "Medio · ¿Qué rasgos diferencian a Google Cloud?"
    - **Red global**: una VPC global con subredes regionales y balanceadores globales con una IP *anycast*.
    - **Proyectos** como unidad de recursos y facturación, dentro de carpetas y organización.
    - Fuerte en datos e IA: **BigQuery** (almacén analítico *serverless* que separa almacenamiento y cómputo), Vertex AI.
    - **GKE** (Kubernetes nació en Google) y Cloud Run.
    - Descuentos automáticos por uso sostenido en algunas familias de máquinas.

    **Repregunta:** ¿cómo se cobra BigQuery? — Por datos analizados (bajo demanda) o por capacidad reservada: particionar
    y agrupar las tablas y seleccionar solo las columnas necesarias reduce mucho el coste.

??? question "Avanzado · Diseña una API en Kubernetes gestionado con alta disponibilidad en AWS."
    - **Route 53** → **CloudFront/WAF** (opcional) → **ALB** en subredes públicas de 3 zonas.
    - **EKS** con nodos en subredes privadas de las 3 zonas (Karpenter), Pods repartidos por zona y PDBs.
    - **RDS/Aurora** multi-AZ, **ElastiCache** para caché, secretos en Secrets Manager vía External Secrets.
    - Identidad de Pods con **EKS Pod Identity / IRSA**, imágenes en ECR, GitOps con Flux o Argo CD.
    - Observabilidad (CloudWatch o Prometheus/Grafana gestionados) y copias de seguridad probadas.

    **Repregunta:** ¿qué costes ocultos vigilarías? — NAT Gateway, tráfico entre zonas, *logs* y volúmenes o IPs
    olvidados.

## Costes, FinOps y certificaciones

Teoría: [Costes y FinOps](../cloud/costes.md) · [Certificaciones](../cloud/certificaciones.md)

??? question "Básico · ¿Qué es FinOps?"
    Una práctica que une finanzas, ingeniería y negocio para que los equipos **asuman el coste** de lo que usan y
    tomen decisiones de valor. Ciclo: **informar** (visibilidad, asignación por etiquetas), **optimizar**
    (*rightsizing*, descuentos, apagar lo que no se usa) y **operar** (presupuestos, alertas, gobierno continuo).

    **Repregunta:** ¿*showback* o *chargeback*? — *Showback* muestra a cada equipo lo que gasta; *chargeback* se lo
    cobra. Se empieza por *showback*.

??? question "Medio · ¿Reservas, Savings Plans o Spot?"
    - **Compromiso** (instancias reservadas, Savings Plans, CUDs): descuentos importantes a cambio de comprometer uso
      o gasto durante 1-3 años. Para la **base estable** de la carga.
    - **Spot / preemptible**: capacidad sobrante con descuentos muy grandes, que el proveedor puede **retirar con
      poco aviso**. Para cargas tolerantes a interrupciones: *batch*, CI, nodos sin estado de Kubernetes.
    - **Bajo demanda** para picos e imprevistos.

    **Repregunta:** ¿cómo usarías Spot en Kubernetes? — Grupos de nodos Spot diversificados en varios tipos, cargas sin
    estado con PDBs y manejo del aviso de interrupción (Karpenter lo gestiona).

??? question "Medio · ¿Qué costes ocultos aparecen en la nube?"
    - **Transferencia de datos**: salida a Internet, entre regiones y **entre zonas**.
    - **NAT Gateway** (hora + GB procesado).
    - **Logs y métricas** con retención excesiva o alta cardinalidad.
    - Recursos olvidados: discos, *snapshots*, IPs públicas, balanceadores, entornos de prueba encendidos.
    - Soporte, licencias y servicios gestionados sobredimensionados.

    **Repregunta:** ¿cómo los detectas? — Etiquetado obligatorio, detección de anomalías de coste y revisiones
    periódicas con el informe de facturación detallado.

??? question "Avanzado · ¿Cómo reducirías un 30 % la factura de una plataforma Kubernetes?"
    1. **Visibilidad**: coste por *namespace* y equipo (OpenCost / Kubecost) y etiquetas.
    2. ***Rightsizing*** de requests según el uso real (VPA en modo recomendación): suele ser la mayor ganancia.
    3. **Autoescalado de nodos** y consolidación (Karpenter), **Spot** para lo tolerante.
    4. **Compromisos** para la base estable.
    5. Apagar entornos no productivos fuera de horario y entornos efímeros por PR.
    6. Reducir tráfico entre zonas y por NAT, y la retención de logs.

    **Repregunta:** ¿cómo evitas que vuelva a subir? — Presupuestos y alertas por equipo, políticas que exigen requests
    y etiquetas, y el coste como métrica visible en cada revisión.

??? question "Básico · ¿Qué certificaciones tienen sentido para un arquitecto de plataforma?"
    Depende del objetivo, pero una combinación habitual:

    - Una certificación de **arquitecto de la nube principal** (AWS Solutions Architect, Azure Solutions Architect
      Expert, Google Professional Cloud Architect).
    - **Kubernetes**: CKA (operación), CKS (seguridad), CKAD (desarrollo).
    - IaC (Terraform Associate) y, según el rol, FinOps Practitioner o una de seguridad.

    La certificación demuestra amplitud; la experiencia real, profundidad. En la entrevista pesa más saber explicar
    decisiones.

    **Repregunta:** ¿qué cambia en la validez entre proveedores? — Varía (de 1 a 3 años, con renovaciones distintas):
    consulta la página de certificaciones antes de planificar.
