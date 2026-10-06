# Entrevista: Plataforma

Kubernetes, GitOps, IaC, edge, observabilidad, CI/CD y seguridad. Si es tu especialidad, espera repreguntas hasta el
fondo y preguntas del tipo "cuéntame una incidencia": prepara ejemplos reales para cada bloque.

## Kubernetes

Teoría: [Kubernetes](../plataforma/kubernetes.md)

??? question "Básico · ¿Qué es el bucle de reconciliación y por qué es la idea central de Kubernetes?"
    Declaras el **estado deseado** en objetos de la API; los **controladores** observan continuamente el estado real
    y actúan para acercarlo al deseado (observar → comparar → actuar), de forma idempotente y repetida. Por eso
    Kubernetes se recupera solo de fallos: si muere un Pod, el ReplicaSet ve que faltan réplicas y crea otro.

    **Repregunta:** ¿qué componentes intervienen? — El **kube-apiserver** (único que habla con etcd), etcd
    (estado), el **kube-controller-manager** (controladores integrados), el *scheduler* y el kubelet de cada nodo.

??? question "Básico · ¿Qué ocurre, paso a paso, al hacer kubectl apply de un Deployment?"
    1. El **kube-apiserver** autentica, autoriza (RBAC), pasa los *admission controllers* (mutación y validación) y
       guarda el objeto en **etcd**.
    2. El controlador de Deployments (en el kube-controller-manager) crea un **ReplicaSet**; el de ReplicaSets crea
       los **Pods**.
    3. El **scheduler** asigna cada Pod a un nodo (filtrado y puntuación).
    4. El **kubelet** del nodo lo ve, pide al *runtime* (containerd) que descargue la imagen y arranque los
       contenedores, y configura red (CNI) y volúmenes (CSI).
    5. Las probes marcan el Pod como listo y entra en los **EndpointSlices** del Service.

    **Repregunta:** ¿cómo se hace un *rolling update*? — El Deployment crea un ReplicaSet nuevo y va escalando uno y
    reduciendo el otro según `maxSurge` y `maxUnavailable`.

??? question "Medio · ¿Qué diferencia hay entre requests y limits y qué es la clase QoS?"
    - **Requests**: lo que el *scheduler* reserva para colocar el Pod.
    - **Limits**: el máximo. Superar el de **CPU** provoca *throttling*; superar el de **memoria**, **OOMKill**.
    - **QoS**: *Guaranteed* (requests = limits en todo), *Burstable* (algo definido) y *BestEffort* (nada). Ante
      presión de memoria, el kubelet desaloja primero BestEffort, luego Burstable.

    **Repregunta:** ¿pondrías límite de CPU? — Muchas plataformas no lo hacen (el *throttling* daña la latencia y la
    CPU es compresible); sí siempre request, y **límite de memoria igual al request**.

??? question "Medio · Explica liveness, readiness y startup probes."
    - **Readiness**: ¿puede recibir tráfico? Si falla, se saca del Service, pero no se reinicia.
    - **Liveness**: ¿está vivo? Si falla, el kubelet **reinicia** el contenedor. Debe comprobar solo el propio
      proceso, nunca dependencias externas.
    - **Startup**: protege los arranques lentos; liveness y readiness no empiezan hasta que pasa.

    **Repregunta:** ¿qué incidencia típica causa una liveness mal hecha? — Reinicios en cascada cuando una dependencia
    (BD) va lenta: todos los Pods se reinician a la vez y empeoran la situación.

??? question "Medio · ¿Cómo escalas en Kubernetes?"
    - **HPA**: réplicas según CPU, memoria o métricas propias o externas.
    - **VPA**: ajusta requests (útil para recomendar; en modo automático reinicia Pods).
    - **KEDA**: escalado por eventos (*lag* de Kafka, colas), incluido a cero.
    - **Cluster Autoscaler / Karpenter**: añaden o quitan nodos cuando hay Pods sin sitio.

    **Repregunta:** ¿por qué el HPA con CPU funciona mal en Java? — El arranque y el JIT disparan la CPU de los Pods
    nuevos; conviene ventanas de estabilización o escalar por una métrica de negocio (peticiones, *lag*).

??? question "Avanzado · ¿Cómo garantizas la disponibilidad durante el mantenimiento de nodos y fallos de zona?"
    - **PodDisruptionBudget**: limita cuántos Pods pueden caer a la vez en desalojos voluntarios (*drain*).
    - **topologySpreadConstraints** o antiafinidad: repartir réplicas entre nodos y **zonas**.
    - Varias réplicas, probes correctas y **apagado ordenado** (SIGTERM, `preStop`, `terminationGracePeriodSeconds`)
      para no cortar peticiones.
    - *PriorityClasses* para que lo crítico desplace a lo prescindible.

    **Repregunta:** ¿por qué se pierden peticiones al borrar un Pod aunque la app cierre bien? — La retirada de los
    endpoints se propaga con retraso; un `preStop` con una espera corta lo evita.

## GitOps

Teoría: [GitOps](../plataforma/gitops.md)

??? question "Básico · ¿Qué es GitOps y cuáles son sus cuatro principios?"
    Un modelo operativo donde **Git es la fuente de verdad** del estado deseado y un agente en el entorno lo
    **reconcilia** continuamente. Principios (OpenGitOps): **declarativo**, **versionado e inmutable**, **obtenido
    automáticamente** (*pull*) y **reconciliado continuamente**. Para cambiar producción se hace una PR, no un comando.

    **Repregunta:** ¿qué ganas frente a un CI que hace `kubectl apply`? — El CI no necesita credenciales del clúster,
    se corrige la deriva, la auditoría es el historial de Git y el *rollback* es un `git revert`.

??? question "Medio · ¿Flux o Argo CD?"
    - **Flux**: controladores independientes (fuentes, Kustomize, Helm, notificaciones), sin UI propia, ligero,
      normalmente **una instancia por clúster**. Encaja en edge, flotas y "todo como código".
    - **Argo CD**: **UI web** muy completa, modelo `Application`/`ApplicationSet`, normalmente **una instancia
      central** que gestiona muchos clústeres (*hub-spoke*), multi-tenancy con proyectos y RBAC propio.

    Los dos son proyectos graduados de la CNCF.

    **Repregunta:** ¿por qué una instancia central es un problema en el edge? — Necesita alcanzar cada clúster
    (credenciales y red hacia dentro) y es un punto único de fallo; con *pull* en cada sitio, el sitio sale hacia
    Git y funciona con conexión intermitente.

??? question "Medio · ¿Cómo estructuras los repositorios y promocionas entre entornos?"
    - Separar **código de la aplicación** y **configuración de despliegue**; plataforma (infraestructura del
      clúster) aparte de las aplicaciones.
    - **Kustomize con base + overlays** por entorno, o valores de Helm por entorno; **carpetas por entorno en una
      rama**, no ramas por entorno (las ramas divergen y se mezclan mal).
    - Promoción = PR que cambia la versión (etiqueta o *digest* de imagen) en el overlay siguiente, automatizable con
      *image automation* o el CI, con aprobación para producción.

    **Repregunta:** ¿por qué fijar por *digest* y no por etiqueta? — Una etiqueta puede moverse; el *digest* es
    inmutable y garantiza que se despliega exactamente lo probado.

??? question "Medio · ¿Cómo gestionas los secretos en GitOps?"
    Nunca en claro en Git. Opciones:

    - **Cifrados en Git**: **SOPS** (con age o KMS; Flux lo descifra de forma nativa) o Sealed Secrets.
    - **Referencias a un gestor externo**: **External Secrets Operator** con Vault o el KMS/Secret Manager de la nube;
      en Git solo va la referencia.

    Además: cifrado de etcd en reposo, RBAC estricto sobre `Secret` y rotación.

    **Repregunta:** ¿qué eliges para una flota edge desconectada? — SOPS: el secreto viaja cifrado con el resto de la
    configuración y solo necesita la clave en el sitio; un gestor externo exige conectividad.

??? question "Avanzado · ¿Cómo ordenas dependencias y evitas que un fallo bloquee todo el clúster en Flux?"
    - `dependsOn` entre `Kustomizations`: primero CRDs, luego controladores, luego configuración que usa esos CRDs,
      luego aplicaciones.
    - `wait: true` / `healthChecks` para no avanzar hasta que lo anterior esté sano, con `timeout`.
    - Separar en varias `Kustomizations` pequeñas: un error de una aplicación no bloquea la plataforma.
    - `prune: true`, con la anotación `kustomize.toolkit.fluxcd.io/prune: disabled` en lo que no se debe borrar
      nunca (volúmenes, *namespaces* con datos).
    - Alertas del *notification-controller* y estado del commit en el repositorio.

    **Repregunta:** ¿cómo verías qué ha fallado? — `flux get kustomizations`, `flux events`, `flux logs` y
    `kubectl describe` del objeto con su condición `Ready`.

## IaC y Config as Code

Teoría: [IaC y Config as Code](../plataforma/iac-cac.md)

??? question "Básico · ¿Declarativo o imperativo? ¿Terraform, Ansible o un operador de Kubernetes?"
    **Declarativo**: describes el estado final y la herramienta calcula los cambios (Terraform, manifiestos de
    Kubernetes). **Imperativo**: escribes los pasos (scripts, buena parte de Ansible).

    - **Terraform/OpenTofu**: aprovisionar infraestructura de nube (red, clústeres, bases de datos).
    - **Ansible**: configurar máquinas y tareas puntuales.
    - **Crossplane / operadores**: infraestructura como objetos de Kubernetes reconciliados de forma continua (encaja
      con GitOps).

    **Repregunta:** ¿qué ventaja tiene Crossplane frente a Terraform? — Reconciliación continua (corrige la deriva),
    API de Kubernetes y composiciones para autoservicio; a cambio, depende de un clúster de control.

??? question "Medio · ¿Cómo gestionas el estado de Terraform en un equipo?"
    - **Estado remoto** (S3, Azure Storage, GCS) con **bloqueo** para evitar aplicaciones simultáneas, cifrado y con
      versiones.
    - **Estados pequeños** por componente y entorno (red, clúster, datos), no uno gigante: menos radio de impacto y
      planes más rápidos.
    - `plan` en la PR revisado por alguien y `apply` solo desde el CI; detección periódica de deriva.
    - Módulos versionados y proveedores fijados.

    **Repregunta:** ¿qué haces si alguien cambió un recurso a mano? — Detectarlo con `plan`, y decidir si se importa
    el cambio al código o se revierte aplicando.

??? question "Avanzado · ¿Qué es policy as code y dónde la aplicas?"
    Reglas de cumplimiento escritas como código y evaluadas automáticamente: **OPA/Rego** (Conftest, Gatekeeper),
    **Kyverno** (YAML, nativo de Kubernetes), Sentinel, Checkov.

    En tres puntos: en el **CI** (sobre los manifiestos o el `plan`, feedback temprano), en la **admisión** del
    clúster (última barrera: imágenes firmadas, sin `privileged`, límites obligatorios) y en **auditoría** continua
    de lo que ya existe.

    **Repregunta:** ¿cómo introduces políticas sin romper a los equipos? — Primero en modo **auditoría** o
    advertencia, con métricas de incumplimiento; después en modo bloqueo, con excepciones documentadas.

## Edge computing

Teoría: [Edge computing](../plataforma/edge.md)

??? question "Medio · ¿Qué retos tiene una plataforma edge frente a la nube?"
    - **Conectividad** intermitente o con poco ancho de banda: los sitios deben funcionar **autónomos**.
    - **Escala de flota**: cientos o miles de sitios; nada puede hacerse a mano.
    - **Recursos limitados** y hardware heterogéneo.
    - **Seguridad física**: equipos accesibles, arranque seguro, cifrado de disco, identidad de dispositivo.
    - **Actualizaciones** seguras y reversibles, por oleadas.
    - **Observabilidad** con datos que no siempre pueden enviarse.

    **Repregunta:** ¿qué distribución de Kubernetes usarías? — Ligeras: k3s, MicroK8s, K0s; o nodos únicos
    gestionados desde un hub.

??? question "Medio · Describe una arquitectura hub & spoke con GitOps para una flota edge."
    - **Hub** (nube): repositorios Git y registro OCI (con réplica o caché cercana), CI, observabilidad central,
      inventario de la flota.
    - **Spokes** (sitios): cada clúster con su **agente GitOps (Flux)** que hace *pull* de su configuración: base
      común + overlays por región, tipo de sitio o sitio concreto.
    - **Despliegue por oleadas** (canario → anillos) cambiando la referencia que siguen los grupos de sitios.
    - Artefactos como **OCI** (manifiestos e imágenes) cacheados en el sitio para tolerar cortes.

    **Repregunta:** ¿cómo sabes en qué versión está cada sitio? — Estado de reconciliación reportado al hub
    (notificaciones, métricas de Flux) y un inventario que compara versión deseada y aplicada.

??? question "Avanzado · ¿Cómo despliegas una actualización a 2.000 sitios sin arriesgar la flota?"
    - **Anillos**: laboratorio → sitios canarios representativos → % creciente de la flota.
    - **Criterios de avance automáticos**: salud de la reconciliación, métricas clave del negocio, tasa de errores.
    - **Parada automática** y *rollback* (revertir la referencia en Git) si se incumplen.
    - Ventanas de mantenimiento por zona horaria, tolerancia a sitios desconectados (se pondrán al día al volver).
    - Compatibilidad hacia atrás entre versiones que convivirán semanas.

    **Repregunta:** ¿qué haces con un sitio que no vuelve tras la actualización? — Debe haber una vía de recuperación
    local (A/B de sistema operativo, versión anterior cacheada) porque quizá no se pueda acceder en remoto.

## Observabilidad

Teoría: [Observabilidad](../plataforma/observabilidad.md)

??? question "Básico · ¿Qué diferencia hay entre monitorización y observabilidad? ¿Cuáles son las señales?"
    **Monitorización**: vigilar lo que ya sabes que puede fallar (paneles y alertas conocidas). **Observabilidad**:
    poder responder preguntas **nuevas** sobre el sistema a partir de sus salidas, sin desplegar código nuevo.

    Señales: **métricas** (agregados baratos, para alertar), **logs** (eventos detallados), **trazas** (el recorrido
    de una petición entre servicios) y **perfiles** (dónde se gasta CPU y memoria). OpenTelemetry las unifica.

    **Repregunta:** ¿cómo correlacionas las señales? — Propagando el *trace ID* en los logs y con *exemplars* en las
    métricas.

??? question "Medio · ¿Qué son SLI, SLO, SLA y el presupuesto de errores?"
    - **SLI**: indicador medido (porcentaje de peticiones correctas en menos de 300 ms).
    - **SLO**: objetivo interno para ese SLI (99,9 % en 30 días).
    - **SLA**: compromiso contractual con penalizaciones, más laxo que el SLO.
    - **Presupuesto de errores**: lo que el SLO permite fallar (0,1 % ≈ 43 min al mes). Si se agota, se prioriza la
      fiabilidad sobre las funcionalidades nuevas.

    **Repregunta:** ¿por qué no un SLO del 100 %? — Es imposible y carísimo, y frena todo cambio; los usuarios no
    notan la diferencia por encima de cierto punto.

??? question "Medio · ¿RED, USE o las cuatro señales doradas?"
    - **RED** (servicios): *Rate*, *Errors*, *Duration*.
    - **USE** (recursos): *Utilization*, *Saturation*, *Errors*, para CPU, disco, colas, pools.
    - **Cuatro señales doradas** (SRE de Google): latencia, tráfico, errores y saturación.

    En la práctica: RED en cada servicio, USE en la infraestructura, y alertar sobre **síntomas** que nota el
    usuario, no sobre causas.

    **Repregunta:** ¿por qué usar percentiles y no la media de latencia? — La media esconde la cola; el p99 muestra la
    experiencia de los usuarios peor atendidos (y de las peticiones con muchas llamadas).

??? question "Avanzado · ¿Cómo diseñas alertas que no generen fatiga?"
    - Alertar por **síntomas** sobre SLOs, no por cada métrica de causa.
    - **Burn rate** con varias ventanas: página si el presupuesto se quema muy rápido (14× en 1 h), ticket si se quema
      lento (en días).
    - Cada alerta que despierta a alguien debe ser **accionable** y tener un *runbook*.
    - Revisar periódicamente: alertas que nadie atiende se borran o se degradan.

    **Repregunta:** ¿cómo gestionas la cardinalidad de métricas? — Evitar etiquetas con valores ilimitados (IDs de
    usuario, URLs completas); eso va en logs o trazas.

## CI/CD

Teoría: [CI/CD](../plataforma/cicd.md)

??? question "Básico · ¿Entrega continua o despliegue continuo? ¿Qué son las métricas DORA?"
    **Entrega continua**: cada cambio queda **listo** para producción; el paso final puede ser manual. **Despliegue
    continuo**: cada cambio que pasa el *pipeline* llega a producción sin intervención.

    **DORA**: frecuencia de despliegue, tiempo de entrega de cambios, tasa de fallos de cambios y tiempo de
    recuperación. Miden a la vez velocidad y estabilidad; los equipos de alto rendimiento mejoran ambas.

    **Repregunta:** ¿cómo mejorarías el tiempo de entrega? — Lotes pequeños, *trunk-based development*, tests rápidos
    y fiables, y despliegues automatizados.

??? question "Medio · ¿Qué estrategias de despliegue conoces?"
    - **Rolling**: sustituir instancias poco a poco. Por defecto en Kubernetes.
    - **Blue-green**: dos entornos completos y se cambia el tráfico de golpe; *rollback* instantáneo, doble coste.
    - **Canary**: un % pequeño del tráfico a la versión nueva, analizando métricas antes de ampliar.
    - **Feature flags**: separar desplegar de **activar**.
    - *Progressive delivery* automatiza el canary con análisis y *rollback* (Flagger, Argo Rollouts).

    **Repregunta:** ¿qué complica blue-green o canary? — Las migraciones de base de datos: ambas versiones deben
    funcionar con el mismo esquema (expand / contract).

??? question "Medio · ¿Trunk-based development o GitFlow?"
    **Trunk-based**: ramas muy cortas (horas o un día) integradas a menudo en `main`, siempre desplegable, con
    *feature flags* para lo que no está terminado. Es lo que correlaciona con el alto rendimiento de DORA.
    **GitFlow**: ramas largas de desarrollo y *release*; encaja con software versionado e instalado por clientes, pero
    provoca integraciones grandes y conflictos.

    **Repregunta:** ¿qué necesita trunk-based para funcionar? — Un CI rápido y fiable, revisión ágil y *feature flags*.

??? question "Avanzado · ¿Cómo aseguras la cadena de suministro de software?"
    - **SBOM** de cada imagen (Syft) y escaneo de vulnerabilidades (Trivy, Grype).
    - **Firma** de imágenes y artefactos (Sigstore/cosign) y verificación en la admisión del clúster.
    - **Procedencia** del *build* (SLSA): qué código, qué *pipeline*, qué entorno.
    - *Actions* y dependencias **fijadas por SHA**, tokens de CI con permisos mínimos y de vida corta (OIDC).
    - Imágenes base mínimas y actualizadas, registros privados con réplica.

    **Repregunta:** ¿qué ataque evita fijar las *actions* por SHA? — Que una etiqueta comprometida o movida ejecute
    código malicioso en tu *pipeline* con tus secretos.

## Seguridad

Teoría: [Seguridad](../plataforma/seguridad.md)

??? question "Básico · ¿Qué es zero trust?"
    No confiar en nada por estar "dentro de la red": cada petición se **autentica, autoriza y cifra**, con identidad
    fuerte de usuarios **y de cargas de trabajo**, mínimo privilegio y verificación continua. Sustituye el modelo de
    perímetro (VPN y red interna de confianza).

    **Repregunta:** ¿cómo se aplica entre microservicios? — mTLS con identidades de carga de trabajo (SPIFFE, malla de
    servicios) y políticas de autorización por servicio, más Network Policies.

??? question "Medio · Explica OAuth 2.0 y OpenID Connect."
    **OAuth 2.0** es **autorización delegada**: una aplicación obtiene un *access token* para actuar sobre recursos en
    nombre del usuario, sin conocer su contraseña. **OIDC** añade **autenticación** encima: un *ID token* (JWT) con
    la identidad del usuario.

    Flujos: *authorization code* + **PKCE** para aplicaciones web y móviles; *client credentials* para máquina a
    máquina. El *implicit* y el de contraseña están desaconsejados.

    **Repregunta:** ¿por qué PKCE? — Impide que un código de autorización interceptado se canjee por un token.

??? question "Medio · ¿Cómo aplicas STRIDE en un diseño?"
    Se dibuja el flujo de datos con sus **límites de confianza** y, por cada elemento, se buscan amenazas:
    **S**uplantación (autenticación), manipulación (**T**ampering, integridad), **R**epudio (auditoría), divulgación de
    **I**nformación (cifrado, acceso), **D**enegación de servicio (límites, escalado) y **E**levación de privilegios
    (autorización, aislamiento). Cada amenaza lleva su mitigación y prioridad.

    **Repregunta:** ¿cuándo se hace? — Al diseñar y en cada cambio significativo, no al final; es barato en una pizarra.

??? question "Medio · ¿Cómo aseguras un clúster de Kubernetes?"
    - **RBAC** de mínimo privilegio y ServiceAccounts por aplicación, sin montar el token si no hace falta.
    - **Pod Security Standards** (*restricted*): sin `privileged`, sin root, sistema de ficheros de solo lectura,
      sin escalada de privilegios, *capabilities* mínimas.
    - **Network Policies** con denegación por defecto.
    - Imágenes firmadas y escaneadas, admisión con Kyverno/Gatekeeper.
    - Secretos cifrados en etcd o fuera del clúster, API server no expuesto, auditoría y detección en tiempo de
      ejecución (Falco).

    **Repregunta:** ¿qué es lo primero que revisarías en un clúster heredado? — Quién tiene `cluster-admin`, Pods
    privilegiados o con `hostPath`, y si existen Network Policies.

??? question "Avanzado · ¿Cómo eliminas las credenciales de larga duración de una plataforma?"
    - **Identidad de carga de trabajo**: los Pods obtienen credenciales temporales de la nube por federación OIDC
      (IRSA / EKS Pod Identity, Workload Identity en AKS y GKE) en vez de claves estáticas.
    - **CI con OIDC** hacia la nube: sin secretos guardados en el CI.
    - Secretos dinámicos (Vault) con caducidad corta y rotación automática.
    - Certificados de vida corta emitidos automáticamente (cert-manager, SPIFFE).

    **Repregunta:** ¿qué ganas? — Una credencial filtrada caduca en minutos y no hay que rotar nada a mano.
