# Datos

Cómo se mueven, procesan y analizan los datos a escala: mensajería de eventos, procesamiento en *streaming* y
plataformas analíticas. Las bases de datos transaccionales están en [Fundamentos](../fundamentos/bases-de-datos.md).

| Página | Qué cubre |
|---|---|
| [Apache Kafka](kafka.md) | *Topics*, particiones, *offsets*, grupos de consumidores, replicación, garantías de entrega, Connect, Schema Registry |
| [Procesamiento en streaming](streaming.md) | Tiempo de evento, ventanas, *watermarks*, estado, Kafka Streams, Flink, CDC |
| [Plataformas de datos](plataformas-datos.md) | OLTP vs. OLAP, data warehouse, data lake, lakehouse, Iceberg, ETL/ELT, dbt, data mesh |

```mermaid
flowchart LR
    APP[Aplicaciones<br/>OLTP] -- CDC / eventos --> K[[Kafka]]
    DEV[Dispositivos edge<br/>telemetría] --> K
    K --> SP[Streaming<br/>Flink / Kafka Streams]
    SP --> RT[Vistas en tiempo real<br/>alertas]
    K --> LH[(Lakehouse<br/>Iceberg en S3)]
    LH --> T[Transformación<br/>dbt / Spark]
    T --> BI[BI, ML, informes]
```
