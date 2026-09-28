# Java y Spring

Java sigue siendo uno de los lenguajes dominantes en backend empresarial, y Spring el framework de referencia sobre él.
Un arquitecto que trabaja en este ecosistema necesita entender **qué pasa por debajo** (la JVM), **qué ofrece el
lenguaje moderno** y **cómo funciona Spring por dentro**, no solo cómo usarlo.

| Página | Qué cubre |
|---|---|
| [La JVM por dentro](jvm.md) | Bytecode, carga de clases, compilación JIT, memoria, recolectores de basura, contenedores, diagnóstico |
| [Java moderno (8 → 25)](java-moderno.md) | Lambdas, *streams*, *records*, clases selladas, *pattern matching*, hilos virtuales y novedades hasta Java 25 LTS |
| [Spring y Spring Boot](spring.md) | Inversión de control, *beans*, proxies y AOP, autoconfiguración, transacciones, JPA, web, seguridad, pruebas, observabilidad |

## Versiones LTS (soporte a largo plazo)

| Versión | Publicación | Por qué importa |
|---|---|---|
| Java 8 | 2014 | Lambdas y *streams*; todavía presente en sistemas heredados |
| Java 11 | 2018 | Primera LTS del nuevo ciclo; cliente HTTP estándar |
| Java 17 | 2021 | *Records*, clases selladas; mínimo de Spring Boot 3 |
| Java 21 | 2023 | **Hilos virtuales**, *pattern matching* en `switch`, colecciones secuenciadas |
| Java 25 | 2025 | *Scoped values*, *stream gatherers*, ficheros fuente compactos, mejoras de arranque (AOT) |

Desde 2017 hay una versión nueva **cada seis meses** (marzo y septiembre) y una **LTS cada dos años**. Las versiones
intermedias sirven para probar novedades; en producción se suele usar una LTS.
