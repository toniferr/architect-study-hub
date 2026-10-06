# Entrevista: Rol del arquitecto y preguntas conductuales

Preguntas sobre cómo ejerces el rol (decidir, comunicar, liderar sin autoridad) y preguntas conductuales ("cuéntame
una vez que…"). Aquí no hay respuesta modelo única: cada respuesta explica **qué busca el entrevistador**, una
**estructura** y los **errores** que restan. Prepáralas con historias reales tuyas y el método STAR de la
[portada de la sección](index.md#preguntas-conductuales-metodo-star).

## El rol del arquitecto

Teoría: [El rol del arquitecto](../arquitectura/rol-del-arquitecto.md)

??? question "Básico · ¿Qué hace un arquitecto de software en el día a día?"
    Traduce necesidades de negocio en **características de calidad** y **decisiones** técnicas, y se asegura de que
    se cumplen: decide estilos, límites y tecnologías (y lo documenta en ADRs), comunica con diagramas y RFCs a negocio
    e ingeniería, lidera sin autoridad, vigila el cumplimiento con *fitness functions* y *golden paths*, y **sigue
    programando** lo suficiente (PoCs, código de plataforma) para no perder el contacto con la realidad.

    **Repregunta:** ¿qué diferencia a un arquitecto de un desarrollador sénior? — La **amplitud** frente a la
    profundidad: conocer muchas opciones y sus *trade-offs*, y el alcance de las decisiones (varios equipos, años).

??? question "Medio · ¿Cómo tomas una decisión de arquitectura importante?"
    1. Entender el problema, las restricciones y quién está implicado.
    2. Priorizar las **características de calidad** con negocio.
    3. Generar 2-3 opciones reales (incluida no hacer nada).
    4. Evaluarlas, con una **PoC** si hay incertidumbre técnica.
    5. Decidir **con** los implicados y registrar un **ADR**.
    6. Validar con métricas o *fitness functions* y revisar si cambian las condiciones.

    Distinguir **decisiones reversibles** (decidir rápido) de **irreversibles** (invertir análisis) y decidir en el
    **último momento responsable**.

    **Repregunta:** ¿cómo evitas ser un cuello de botella? — Principios y *golden paths* claros para que los equipos
    decidan solos lo local, y reservar la revisión para lo transversal o irreversible.

??? question "Medio · ¿Cómo comunicas una arquitectura a audiencias distintas?"
    - **Modelo C4**: contexto (negocio y externos), contenedores (equipos y operación), componentes (desarrolladores).
      Cada audiencia, su nivel.
    - **Negocio** escucha riesgo, coste, plazo y opciones; **ingeniería**, *trade-offs* y detalles.
    - Contarlo como una historia: problema → opciones → decisión → consecuencias → cómo sabremos si funciona.
    - Documentos vivos junto al código (diagramas como código, ADRs), no presentaciones que caducan.

    **Repregunta:** ¿cómo explicarías GitOps a un director financiero? — Menos incidencias por cambios manuales,
    auditoría completa de quién cambió qué, y recuperación en minutos volviendo a una versión anterior.

??? question "Medio · ¿Qué antipatrones del rol conoces y cómo los evitas?"
    - **Torre de marfil**: diseñar sin programar ni escuchar → trabajar con los equipos, PoCs, revisar código.
    - **Arquitectura por currículum**: elegir tecnología por interés propio → criterios explícitos y ADR.
    - **Parálisis por análisis** → plazos de decisión y separar decisiones reversibles.
    - **Cuello de botella** → delegar con principios claros.
    - **Día de la marmota** (rediscutir lo decidido) → ADRs.
    - **Sobreingeniería** → diseñar para la escala y flexibilidad previsibles, con límites que permitan crecer.

    **Repregunta:** ¿cuál has cometido tú? — Elige uno real y qué aprendiste: muestra autocrítica.

??? question "Avanzado · ¿Qué es platform engineering y cómo medirías el éxito de una plataforma interna?"
    Construir una **plataforma interna como producto** (IDP) que reduce la carga cognitiva de los equipos con
    **autoservicio** y ***golden paths***: crear un servicio, desplegarlo, observarlo, con la seguridad y el
    cumplimiento ya incluidos. DevOps es la cultura; platform engineering, una forma de hacerla escalar.

    Métricas: **adopción voluntaria**, tiempo hasta el primer despliegue de un servicio nuevo, métricas **DORA** de
    los equipos que la usan, satisfacción de los desarrolladores (encuestas), tickets al equipo de plataforma y coste
    por servicio.

    **Repregunta:** ¿qué pasa si obligas a usarla? — Pierdes la señal de si aporta valor; tratarla como producto
    significa ganarse a los usuarios.

## Preguntas conductuales

Teoría: método STAR en la [portada de Entrevistas](index.md#preguntas-conductuales-metodo-star)

??? question "Básico · Háblame de ti y de tu experiencia."
    **Qué buscan**: síntesis, relevancia para el puesto y un hilo conductor.

    **Estructura** (2 minutos): presente (rol actual y ámbito: p. ej. arquitectura de una plataforma GitOps en el edge
    con Kubernetes, Flux y Java) → 1-2 logros con impacto medible → cómo llegaste aquí (lo justo) → por qué este puesto
    encaja con lo siguiente que quieres hacer.

    **Errores**: recitar el CV cronológicamente, durar diez minutos, no conectar con el puesto.

??? question "Medio · Cuéntame una decisión técnica difícil que tomaste."
    **Qué buscan**: proceso de decisión, análisis de *trade-offs*, implicar a otros y asumir consecuencias.

    **Estructura STAR**: contexto y qué estaba en juego → opciones reales que consideraste y criterios → cómo
    decidiste y con quién (PoC, ADR) → resultado medible y qué harías distinto.

    **Errores**: una decisión trivial, no mencionar alternativas, presentar solo los beneficios.

??? question "Medio · Cuéntame una vez que no estabas de acuerdo con tu equipo o con tu jefe."
    **Qué buscan**: desacuerdo **constructivo**, escucha, decidir con datos y comprometerse con la decisión final.

    **Estructura**: el desacuerdo y por qué importaba → cómo entendiste su postura (qué información tenían) → cómo
    defendiste la tuya (datos, prueba de concepto, *trade-offs* explícitos) → resultado: acuerdo, o ***disagree and
    commit*** sin sabotear → relación después.

    **Errores**: historias donde tú tenías razón y los demás eran torpes; no tener ninguna.

??? question "Medio · Cuéntame un error tuyo que llegó a producción."
    **Qué buscan**: responsabilidad, gestión de la incidencia y **aprendizaje sistémico**.

    **Estructura**: qué pasó y el impacto (honesto) → cómo lo detectaste y lo mitigaste → análisis de causa raíz
    **sin culpables** → qué cambiaste para que no se repita (un test, una alerta, una política, un despliegue
    progresivo) → qué aprendiste tú.

    **Errores**: un "error" que en realidad es un logro, culpar a otros, quedarse en "tuve más cuidado".

??? question "Medio · ¿Cómo has convencido a otros equipos sin tener autoridad sobre ellos?"
    **Qué buscan**: influencia, empatía con los objetivos de otros y paciencia.

    **Estructura**: el cambio que querías (p. ej. adoptar un *golden path* o una política común) → por qué les
    costaba (sus incentivos y miedos) → cómo lo hiciste fácil y atractivo (un piloto con un equipo aliado, quitarles
    trabajo, datos de mejora, documentación) → adopción conseguida y qué no funcionó.

    **Errores**: "escalé al director y lo impusieron".

??? question "Medio · Cuéntame cuándo tuviste que decir que no a negocio o a un cliente."
    **Qué buscan**: proteger el sistema o al equipo **sin bloquear**: ofrecer alternativas.

    **Estructura**: la petición y por qué era un problema (riesgo, coste, plazo) → cómo lo explicaste en términos de
    negocio → qué alternativa propusiste (alcance menor, fases, otro plazo) → resultado.

    **Errores**: un "no" seco técnico, o no haber dicho nunca que no.

??? question "Avanzado · Cuéntame una migración o un cambio de arquitectura grande que hayas liderado."
    **Qué buscan**: planificación, gestión del riesgo, entrega incremental y liderazgo en el tiempo.

    **Estructura**: por qué hacía falta (problema de negocio, no técnico) → estrategia (incremental, *strangler fig*,
    convivencia de versiones, criterios de *rollback*) → cómo llevaste a los equipos → obstáculos y cómo los
    resolviste → resultado medible (DORA, coste, incidencias) y lecciones.

    **Errores**: un "big bang" sin plan de vuelta atrás contado como éxito, no dar cifras.

??? question "Medio · ¿Cómo ayudas a crecer a otros ingenieros?"
    **Qué buscan**: multiplicar al equipo, no ser el héroe.

    **Estructura**: ejemplos concretos: *pairing*, revisiones de diseño que enseñan el porqué, delegar decisiones
    con red de seguridad, documentación y formaciones (p. ej. una formación interna de GitOps), y un caso de alguien
    que creció (qué cambió).

    **Errores**: generalidades ("siempre ayudo a todos") sin un ejemplo.

??? question "Medio · ¿Cómo te mantienes al día sin perseguir modas?"
    **Qué buscan**: criterio para evaluar tecnologías y aprendizaje continuo.

    **Estructura**: fuentes (documentación oficial, CNCF, papers, comunidades) → cómo evalúas algo nuevo (problema que
    resuelve, madurez, coste de adopción y salida, PoC acotada) → un **radar tecnológico** (adoptar, probar, evaluar,
    evitar) → un ejemplo de algo que adoptaste y algo que descartaste y por qué.

    **Errores**: lista de *buzzwords*; o "solo uso lo que ya conozco".

??? question "Básico · ¿Tienes alguna pregunta para nosotros?"
    **Qué buscan**: interés real y criterio. Siempre ten 3-4 preparadas.

    **Ejemplos**: ¿qué decisión de arquitectura reciente os ha costado más y por qué? · ¿cómo se toman y documentan
    las decisiones técnicas? · ¿qué esperáis que haya cambiado gracias a esta persona en un año? · ¿cómo es la
    relación entre plataforma y equipos de producto? · ¿cómo medís la fiabilidad y qué pasa cuando se agota el
    presupuesto de errores?

    **Errores**: "no, todo claro", o preguntar solo por condiciones en una entrevista técnica.
