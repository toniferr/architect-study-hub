# Certificaciones

Mapa de las certificaciones de los tres grandes proveedores cloud y de las neutrales más valoradas para arquitectura de
software y plataforma, con **datos verificados en septiembre de 2026** (ver [fuentes](#fuentes)).

## Cómo funcionan las certificaciones

- **Qué validan**: conocimientos (exámenes tipo test) o habilidades prácticas (exámenes en terminal, como CKA). Las
  prácticas son más difíciles de aprobar sin experiencia real y por eso suelen valorarse más.
- **Formato**: examen supervisado, en un centro o **online** con cámara (el entorno se revisa antes de empezar).
- **Caducan**: hay que renovarlas (con un examen, una evaluación gratuita o aprobando un nivel superior), porque la
  tecnología cambia.
- **Los catálogos cambian cada año**: los proveedores retiran exámenes y los sustituyen por otros. 2026 ha sido un año de
  muchos cambios, sobre todo por la IA.

!!! warning "Antes de preparar un examen"
    Comprueba en la página oficial que el examen sigue vigente, su código actual y su precio en tu país (pueden variar por
    impuestos y moneda): [AWS](https://aws.amazon.com/certification/) · [Microsoft Learn](https://learn.microsoft.com/credentials/) ·
    [Google Cloud](https://cloud.google.com/learn/certification) · [Linux Foundation / CNCF](https://training.linuxfoundation.org/certification-catalog/).

## Comparativa rápida

| | AWS | Microsoft Azure | Google Cloud |
|---|---|---|---|
| Niveles | Foundational → Associate → Professional + Specialty | Fundamentals → Associate → Expert + Specialty | Foundational → Associate → Professional |
| Precio (USD) | 100 / 150 / 300 | 99 / 165 / 165 (varía por país) | 99 / 125 / 200 |
| Validez | 3 años | Role-based: **1 año** con renovación **gratuita** online; Fundamentals no caduca | Professional **2 años**; Associate y Foundational **3 años** |
| Ventaja al aprobar | 50 % de descuento en el siguiente examen | Laboratorios gratuitos en Microsoft Learn | 50 % de descuento para la renovación |

---

## AWS

| Nivel | Certificación | Código | Para quién |
|---|---|---|---|
| Foundational | Cloud Practitioner | CLF-C02 | Visión general, perfiles no técnicos |
| Foundational | AI Practitioner | AIF-C01 | Conceptos de IA e IA generativa en AWS |
| Associate | **Solutions Architect – Associate** | SAA-C03 | Diseño de arquitecturas en AWS (la más demandada) |
| Associate | Developer – Associate | DVA-C02 | Desarrollo sobre servicios AWS |
| Associate | **CloudOps Engineer – Associate** (antes SysOps Administrator) | SOA-C03 | Operación, monitorización, automatización, contenedores, multi-cuenta |
| Associate | Data Engineer – Associate | DEA-C01 | Pipelines de datos |
| Associate | Machine Learning Engineer – Associate | MLA-C01 | ML en producción con SageMaker |
| Professional | **Solutions Architect – Professional** | SAP-C02 | Arquitecturas complejas, multi-cuenta, migraciones, costes |
| Professional | **DevOps Engineer – Professional** | DOP-C02 | CI/CD, IaC, operación a escala |
| Professional | **Generative AI Developer – Professional** | AIP-C01 | Aplicaciones con modelos fundacionales (Bedrock), RAG, agentes. 300 $, 3 años |
| Specialty | Security – Specialty | **SCS-C03** | Seguridad en AWS, incluida la de cargas de IA/ML (SCS-C02 dejó de ofrecerse el 1-12-2025) |

**Retiradas recientes**: Machine Learning – Specialty (último examen el 31-03-2026) y **Advanced Networking –
Specialty** (último examen el 25-08-2026, sin sustituto anunciado). Antes, en 2024: Data Analytics, Database y SAP on AWS.
Las certificaciones ya obtenidas siguen siendo válidas hasta su fecha de caducidad.

AWS ha lanzado además la microcredencial **Agentic AI Demonstrated**, que evalúa habilidades prácticas en un entorno AWS real.

## Microsoft Azure

Microsoft está reorganizando en 2026 buena parte de sus certificaciones para integrar la IA en los roles de desarrollo,
seguridad y datos.

| Nivel | Certificación | Examen | Estado (septiembre de 2026) |
|---|---|---|---|
| Fundamentals | Azure Fundamentals | AZ-900 | Vigente |
| Fundamentals | Azure AI Fundamentals | AI-900 → **AI-901** | AI-900 retirado el 30-06-2026 |
| Fundamentals | Data Fundamentals / Security, Compliance & Identity | DP-900 / SC-900 | Vigentes |
| Associate | **Azure Administrator** | AZ-104 | Vigente (base de las Expert) |
| Associate | Azure Developer → **Azure AI Cloud Developer** | AZ-204 → **AI-200** | AZ-204 retirado el 31-07-2026; AI-200 incluye RAG, bases vectoriales y cargas de IA en contenedores |
| Associate | Azure AI Engineer | AI-102 → **AI-103** | AI-102 retirado el 30-06-2026 |
| Associate | Azure Data Scientist | DP-100 → **AI-300** | DP-100 retirado el 01-06-2026 |
| Associate | Azure Security Engineer | AZ-500 → **SC-500** | AZ-500 retirado el 31-08-2026 |
| Associate | Windows Server Hybrid Administrator | AZ-800/801 → **AZ-802** | Retirados el 30-09-2026 |
| Associate | Azure Network Engineer | AZ-700 | Vigente |
| Associate | Fabric Data Engineer | DP-700 | Vigente (sustituyó a DP-203 en 2025) |
| Expert | **Azure Solutions Architect Expert** | AZ-305 (+ AZ-104) | Vigente |
| Expert | **DevOps Engineer Expert** | AZ-400 (+ AZ-104 o el certificado de desarrollador) | Vigente; comprueba qué certificados de desarrollador aceptan como requisito tras la retirada de AZ-204 |
| Expert | Cybersecurity Architect Expert | SC-100 | Vigente |

## Google Cloud

| Nivel | Certificación | Precio | Validez |
|---|---|---|---|
| Foundational | Cloud Digital Leader | 99 $ | 3 años |
| Foundational | Generative AI Leader | 99 $ | 3 años |
| Associate | **Associate Cloud Engineer** | 125 $ | 3 años |
| Associate | Associate Data Practitioner | 125 $ | 3 años |
| Professional | **Professional Cloud Architect** | 200 $ | 2 años |
| Professional | Cloud DevOps Engineer · Cloud Developer · Data Engineer · Machine Learning Engineer · Cloud Security Engineer · Cloud Network Engineer · Cloud Database Engineer · Security Operations Engineer | 200 $ | 2 años |

La renovación se puede hacer a partir de 60 días antes de caducar (Professional) o 180 días (Associate y Foundational).

---

## Neutrales de proveedor

### Kubernetes y cloud native (Linux Foundation / CNCF)

| Certificación | Tipo | Precio | Relevancia para tu perfil |
|---|---|---|---|
| **CKA** — Certified Kubernetes Administrator | Práctica (terminal, 2 h) | 445 $ | ⭐ Base práctica de operación de Kubernetes |
| **CKAD** — Certified Kubernetes Application Developer | Práctica | 445 $ | Diseño de aplicaciones en Kubernetes |
| **CKS** — Certified Kubernetes Security Specialist | Práctica (requiere CKA vigente) | 445 $ | ⭐ Seguridad de clústeres y cadena de suministro |
| KCNA / KCSA | Teórica | 250 $ | Introducción cloud native / seguridad |
| **CGOA** — Certified GitOps Associate | Teórica, incluye un reintento | 250 $ | ⭐ Valida justo tu especialidad (principios OpenGitOps, patrones) |
| CAPA · PCA · OTCA · ICA · CCA | Teórica / práctica | 250-445 $ | Argo, Prometheus, OpenTelemetry, Istio, Cilium |

Validez habitual: **2 años**. Quien tiene KCNA, KCSA, CKA, CKAD y CKS recibe el título de **Kubestronaut**. La Linux
Foundation ofrece descuentos frecuentes (30-50 %, más en *Black Friday* y KubeCon) y paquetes de varios exámenes.

### Infraestructura como código

| Certificación | Emisor | Notas |
|---|---|---|
| **Terraform Associate** | HashiCorp (IBM) | Muy solicitada en ofertas de plataforma |
| Terraform Authoring and Operations Professional | HashiCorp | Práctica, nivel avanzado |
| Vault Associate / Consul Associate | HashiCorp | Secretos / *service networking* |

### Arquitectura de software y empresa

| Certificación | Emisor | Notas |
|---|---|---|
| **iSAQB CPSA-F** (Foundation) → CPSA-A (Advanced) | iSAQB | Extendida en Europa; arquitectura de software sin atarse a un proveedor |
| **TOGAF** Enterprise Architecture (Foundation / Practitioner) | The Open Group | Arquitectura empresarial y gobierno; grandes corporaciones y sector público |
| SAFe Architect | Scaled Agile | Organizaciones que usan SAFe |

### Seguridad

| Certificación | Emisor | Notas |
|---|---|---|
| **CCSP** — Certified Cloud Security Professional | ISC2 | Seguridad cloud neutral; exige experiencia acreditada |
| CISSP (+ concentración ISSAP para arquitectos) | ISC2 | Referencia general; exige 5 años de experiencia |
| CCSK | Cloud Security Alliance | Seguridad cloud, más accesible |

### Costes

| Certificación | Emisor | Notas |
|---|---|---|
| FinOps Certified Practitioner | FinOps Foundation | Fundamentos de FinOps; también Engineer y Professional |

---

## Qué aporta cada combinación

| Objetivo profesional | Combinación que lo respalda |
|---|---|
| Arquitecto de plataforma / cloud native | CKA + CKS + CGOA + Terraform Associate + una Professional de arquitectura cloud |
| Arquitecto cloud en un proveedor | Associate de arquitectura → Professional (AWS SAP-C02, Azure AZ-305, GCP Professional Cloud Architect) |
| Arquitecto de software (aplicaciones) | iSAQB CPSA-F/A + certificación de arquitectura de un proveedor |
| Arquitecto empresarial | TOGAF + Professional cloud |
| Arquitecto con foco en seguridad | CKS + CCSP + Security Specialty (SCS-C03) o SC-500 |
| Arquitecto con foco en IA | AWS Generative AI Developer – Professional, Azure AI-103 / AI-200, Google Generative AI Leader + Professional ML Engineer |

!!! tip "Lo que no mide un certificado"
    Las certificaciones abren filtros de selección y dan estructura al estudio, pero lo que diferencia a un arquitecto es
    explicar decisiones reales con sus trade-offs. Un repositorio público con una plataforma bien documentada (ADRs,
    diagramas, IaC) pesa tanto como varios certificados.

## Ejercicios

!!! exercise "Ejercicio 1 · Básico — Prerrequisitos y validez"
    ¿Qué necesitas para obtener Azure Solutions Architect Expert y CKS? ¿Cada cuánto hay que renovarlas?

    ??? success "Solución"
        **Azure Solutions Architect Expert**: aprobar AZ-104 (Administrator) y AZ-305; se renueva **cada año** con una
        evaluación online gratuita en Microsoft Learn. **CKS**: tener la **CKA vigente** y aprobar el examen práctico de CKS;
        validez de 2 años.

!!! exercise "Ejercicio 2 · Básico — ¿Sigue vigente?"
    Un compañero quiere preparar este año AWS Advanced Networking – Specialty y Azure AZ-204. ¿Qué le dices?

    ??? success "Solución"
        Ninguno de los dos exámenes está disponible: Advanced Networking se retiró el 25-08-2026 sin sustituto (para redes
        en AWS, la preparación de SAP-C02 cubre buena parte) y AZ-204 se retiró el 31-07-2026, sustituido por **AI-200**
        (Azure AI Cloud Developer Associate), con un temario orientado a aplicaciones de IA. Moraleja: comprobar siempre la
        página oficial antes de empezar a estudiar.

!!! exercise "Ejercicio 3 · Medio — Elegir qué certificar"
    Con tu perfil (arquitecto de plataforma GitOps edge, Java, Kubernetes) y 12 meses por delante, ¿qué certificaciones
    darían más valor y en qué orden?

    ??? success "Solución"
        Una propuesta razonada (no la única):
        1. **CKA**: valida la base práctica de Kubernetes que ya usas; muy reconocida en ofertas de plataforma.
        2. **CGOA** (250 $): rápida y alineada con tu especialidad, diferenciadora.
        3. **Arquitectura de la nube más demandada en tu mercado**: AWS SAP-C02 o Azure AZ-305.
        4. **CKS** si quieres orientarte a seguridad de plataforma, o **Terraform Associate** si las ofertas piden IaC.
        Criterio: combinar una base neutral (Kubernetes/GitOps) con una nube y priorizar lo que aparezca en las ofertas
        concretas a las que aspiras.

## Fuentes { #fuentes }

- [AWS: nuevas certificaciones de IA y actualización de Security Specialty](https://aws.amazon.com/blogs/training-and-certification/big-news-aws-expands-ai-certification-portfolio-and-updates-security-certification/)
- [AWS Certified Generative AI Developer – Professional](https://aws.amazon.com/certification/certified-generative-ai-developer-professional/)
- [AWS Certified CloudOps Engineer – Associate (SOA-C03)](https://docs.aws.amazon.com/aws-certification/latest/sysops-administrator-associate-03/sysops-administrator-associate-03.html)
- [Retirada de AWS Advanced Networking – Specialty](https://www.certcrush.app/blog/aws-advanced-networking-specialty-retiring-2026)
- [Microsoft Q&A: AZ-204 y AI-200](https://learn.microsoft.com/en-au/answers/questions/5955907/will-ai-200-replace-az-204-after-its-retirement)
- [Certificaciones de Microsoft que se retiran en 2026](https://www.certificationcamps.com/microsoft-certifications-retiring/)
- [Google Cloud: renovación de certificaciones](https://support.google.com/cloud-certification/answer/9907853?hl=en)
- [Coste de certificaciones de Google Cloud 2026](https://trainingcost.com/certifications/google-cloud-certification-training-cost)
- [Linux Foundation: Certified GitOps Associate (CGOA)](https://training.linuxfoundation.org/certification/certified-gitops-associate-cgoa/)
- [Guía de certificaciones de Kubernetes 2026](https://spacelift.io/blog/kubernetes-certification)
