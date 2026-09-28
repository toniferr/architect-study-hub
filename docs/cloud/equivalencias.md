# Equivalencias entre nubes

Tabla de traducción de servicios entre AWS, Azure y Google Cloud. Útil para leer arquitecturas de otra nube
o planificar una migración. Las equivalencias son **aproximadas**: los servicios difieren en límites, precio y matices.

## Cómputo

| Necesidad | AWS | Azure | Google Cloud |
|---|---|---|---|
| Máquinas virtuales | EC2 | Virtual Machines | Compute Engine |
| Grupos con autoescalado | Auto Scaling Groups | VM Scale Sets | Managed Instance Groups |
| Kubernetes gestionado | EKS | AKS | GKE (Standard / Autopilot) |
| Contenedores sin gestionar clúster | ECS + Fargate, App Runner | Container Apps, Container Instances | Cloud Run |
| Funciones serverless | Lambda | Functions | Cloud Run functions |
| PaaS de aplicaciones web | Elastic Beanstalk | App Service | App Engine |
| Procesamiento por lotes | Batch | Batch | Batch |
| Servidores ARM propios | Graviton | Cobalt | Axion |

## Almacenamiento

| Necesidad | AWS | Azure | Google Cloud |
|---|---|---|---|
| Objetos | S3 | Blob Storage | Cloud Storage |
| Archivo frío | S3 Glacier (Instant/Flexible/Deep Archive) | Blob Cool / Cold / Archive | Nearline / Coldline / Archive |
| Discos de bloque | EBS | Managed Disks | Persistent Disk / Hyperdisk |
| Sistema de ficheros compartido | EFS, FSx | Azure Files, NetApp Files | Filestore |
| Copias de seguridad | AWS Backup | Azure Backup | Backup and DR |
| Transferencia masiva offline | Snowball | Data Box | Transfer Appliance |

## Bases de datos

| Necesidad | AWS | Azure | Google Cloud |
|---|---|---|---|
| Relacional gestionada | RDS (PostgreSQL, MySQL, MariaDB, Oracle, SQL Server) | Azure SQL Database, Database for PostgreSQL / MySQL | Cloud SQL |
| Relacional de alto rendimiento | Aurora | Azure SQL Hyperscale | AlloyDB |
| Relacional distribuida global | Aurora DSQL | — (Cosmos DB cubre el caso NoSQL global) | Spanner |
| Clave-valor / documento | DynamoDB, DocumentDB | Cosmos DB | Firestore |
| Columnar ancha | Keyspaces (Cassandra) | Cosmos DB (API Cassandra), Managed Instance for Apache Cassandra | Bigtable |
| Caché en memoria | ElastiCache (Valkey, Redis OSS, Memcached) | Azure Managed Redis / Azure Cache for Redis | Memorystore |
| Grafos | Neptune | Cosmos DB (API Gremlin) | Spanner Graph |
| Series temporales | Timestream | Data Explorer | Bigtable / BigQuery |
| Data warehouse | Redshift | Microsoft Fabric (Synapse) | BigQuery |

## Red

| Necesidad | AWS | Azure | Google Cloud |
|---|---|---|---|
| Red privada | VPC (regional) | Virtual Network (regional) | VPC (**global**) |
| Firewall de instancias | Security Groups, NACLs | Network Security Groups | Firewall rules / policies |
| Balanceador L7 | ALB | Application Gateway, Front Door (global) | Cloud Load Balancing (HTTP(S), global) |
| Balanceador L4 | NLB | Load Balancer | Cloud Load Balancing (TCP/UDP) |
| CDN | CloudFront | Front Door / Azure CDN | Cloud CDN |
| DNS | Route 53 | Azure DNS, Traffic Manager | Cloud DNS |
| Conexión dedicada | Direct Connect | ExpressRoute | Cloud Interconnect |
| VPN | Site-to-Site VPN | VPN Gateway | Cloud VPN |
| NAT de salida | NAT Gateway | NAT Gateway | Cloud NAT |
| Acceso privado a servicios | PrivateLink | Private Link / Private Endpoint | Private Service Connect |
| Interconexión de redes | Transit Gateway | Virtual WAN, VNet peering | Network Connectivity Center, VPC peering |
| Gestión de APIs | API Gateway | API Management | Apigee, API Gateway |
| WAF / DDoS | WAF, Shield | WAF, DDoS Protection | Cloud Armor |

## Integración y mensajería

| Necesidad | AWS | Azure | Google Cloud |
|---|---|---|---|
| Colas | SQS | Service Bus Queues, Storage Queues | Pub/Sub, Cloud Tasks |
| Pub/sub | SNS | Service Bus Topics | Pub/Sub |
| Bus de eventos | EventBridge | Event Grid | Eventarc |
| Streaming | Kinesis Data Streams | Event Hubs | Pub/Sub, Dataflow |
| Kafka gestionado | MSK | Event Hubs (API Kafka), Confluent en Azure | Managed Service for Apache Kafka |
| Orquestación de flujos | Step Functions | Logic Apps, Durable Functions | Workflows |

## Identidad y seguridad

| Necesidad | AWS | Azure | Google Cloud |
|---|---|---|---|
| Permisos sobre recursos | IAM | Azure RBAC | Cloud IAM |
| Identidad de personas / SSO | IAM Identity Center | Microsoft Entra ID | Cloud Identity |
| Identidad de cargas de trabajo | IAM Roles (IRSA / Pod Identity en EKS) | Managed Identities, Workload Identity | Service Accounts, Workload Identity Federation |
| Gobierno multi-cuenta | Organizations, SCPs, Control Tower | Management Groups, Azure Policy | Organization Policies, Folders |
| Claves | KMS, CloudHSM | Key Vault, Managed HSM | Cloud KMS, Cloud HSM |
| Secretos | Secrets Manager, Parameter Store | Key Vault | Secret Manager |
| Postura de seguridad | Security Hub, GuardDuty, Inspector | Defender for Cloud | Security Command Center |
| SIEM | Security Lake (+ terceros) | Microsoft Sentinel | Google Security Operations |
| Auditoría de API | CloudTrail | Activity Log | Cloud Audit Logs |
| Identidad de usuarios finales | Cognito | Entra External ID | Identity Platform |

## Operación, DevOps e IaC

| Necesidad | AWS | Azure | Google Cloud |
|---|---|---|---|
| Métricas, logs, alertas | CloudWatch | Azure Monitor, Log Analytics | Cloud Monitoring, Cloud Logging |
| Trazas | X-Ray (+ OpenTelemetry) | Application Insights | Cloud Trace |
| Prometheus / Grafana gestionados | Managed Prometheus, Managed Grafana | Managed Prometheus, Managed Grafana | Managed Service for Prometheus |
| IaC nativo | CloudFormation, CDK | ARM, **Bicep** | Infrastructure Manager (Terraform), Config Connector |
| CI/CD | CodeBuild, CodePipeline | Azure DevOps Pipelines, GitHub Actions | Cloud Build, Cloud Deploy |
| Registro de imágenes | ECR | Container Registry (ACR) | Artifact Registry |
| GitOps gestionado | EKS Capabilities (Argo CD) / Flux autogestionado | Extensión GitOps (Flux v2) en AKS y Arc | Config Sync |
| Configuración de flota | Systems Manager | Azure Arc, Automation | GKE Fleet, VM Manager |

## Datos e IA

| Necesidad | AWS | Azure | Google Cloud |
|---|---|---|---|
| Consultas SQL sobre data lake | Athena | Fabric / Synapse serverless | BigQuery (tablas externas, BigLake) |
| ETL | Glue | Data Factory | Dataflow, Data Fusion |
| Spark / Hadoop gestionado | EMR | HDInsight, Databricks, Fabric | Dataproc |
| BI | QuickSight | Power BI | Looker |
| Modelos fundacionales (API) | Bedrock | Azure AI Foundry (Azure OpenAI) | Vertex AI (Gemini, Model Garden) |
| Plataforma ML | SageMaker AI | Azure Machine Learning | Vertex AI |
| Búsqueda / vectores | OpenSearch, Kendra | Azure AI Search | Vertex AI Search, Vector Search |
| Hardware de IA propio | Trainium, Inferentia | Maia | TPU |

## Híbrido y edge

| Necesidad | AWS | Azure | Google Cloud |
|---|---|---|---|
| Nube en tu CPD | Outposts | Azure Local | Google Distributed Cloud |
| Kubernetes en cualquier sitio | EKS Anywhere, EKS Hybrid Nodes | Arc-enabled Kubernetes | GKE Enterprise (attached clusters) |
| IoT | IoT Core, IoT Greengrass | IoT Hub, IoT Operations | (IoT Core retirado en 2023 → socios) |
| Baja latencia en ciudades / 5G | Local Zones, Wavelength | Extended Zones, Operator Nexus | Distributed Cloud Edge |

## Ejercicios

!!! exercise "Ejercicio 1 · Básico — Traducir una arquitectura"
    Traduce a Azure y a Google Cloud esta arquitectura de AWS: CloudFront → ALB → EKS → Aurora PostgreSQL + ElastiCache;
    eventos con SQS; secretos en Secrets Manager; logs en CloudWatch.

    ??? success "Solución"
        | AWS | Azure | Google Cloud |
        |---|---|---|
        | CloudFront | Front Door | Cloud CDN (+ Load Balancing global) |
        | ALB | Application Gateway (o Front Door) | Cloud Load Balancing (HTTP(S)) |
        | EKS | AKS | GKE |
        | Aurora PostgreSQL | Azure Database for PostgreSQL Flexible Server | AlloyDB (o Cloud SQL) |
        | ElastiCache | Azure Managed Redis | Memorystore |
        | SQS | Service Bus Queues | Pub/Sub (o Cloud Tasks) |
        | Secrets Manager | Key Vault | Secret Manager |
        | CloudWatch | Azure Monitor + Log Analytics | Cloud Logging + Monitoring |

!!! exercise "Ejercicio 2 · Medio — Diferencias que importan"
    Al migrar de AWS a Google Cloud, un compañero traduce "una VPC por región, interconectadas con Transit Gateway" a
    "una VPC por región con peering en GCP". ¿Qué le dirías?

    ??? success "Solución"
        En Google Cloud la **VPC es global**: una sola VPC puede tener subredes en todas las regiones y se comunican por IP
        privada sin *peering*. Replicar el diseño de AWS añadiría complejidad innecesaria. Las equivalencias de servicios son
        aproximadas: hay que revisar el **modelo** de cada nube (red global, jerarquía de recursos, identidad), no solo traducir nombres.
