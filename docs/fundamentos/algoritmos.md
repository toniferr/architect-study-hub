# Algoritmos y estructuras de datos <span class="nivel medio">Medio</span>

Un ingeniero de primera no memoriza soluciones: **reconoce la estructura del problema**, sabe qué estructura de datos
lo resuelve y **razona el coste** antes de escribir código. Esta página explica cada pieza desde cero.

## 1. Complejidad (Big O) { #big-o }

### Qué mide

La notación Big O describe **cómo crece** el coste de un algoritmo (tiempo o memoria) cuando crece el tamaño de la
entrada, que llamamos **n**. No mide segundos: mide la **tendencia**. Responde a la pregunta "si multiplico los datos
por 10, ¿cuánto más tarda?".

Reglas para calcularla:

1. **Se cuentan operaciones básicas** en función de n (comparaciones, accesos, asignaciones).
2. **Se ignoran las constantes**: O(2n) y O(n) son lo mismo, O(n/2) también. Lo que importa es la forma de crecer.
3. **Se queda el término dominante**: O(n² + n) = O(n²), porque para n grande n² aplasta a n.
4. **Se suele analizar el peor caso**, salvo que se diga otra cosa (caso medio, amortizado).

### Las complejidades habituales

| Complejidad | Nombre | Qué significa | n = 1 000 | n = 1 000 000 | Ejemplo |
|---|---|---|---|---|---|
| O(1) | Constante | No depende de n | 1 | 1 | Acceso por índice, `HashMap.get` |
| O(log n) | Logarítmica | Cada paso descarta una fracción (la mitad) | ~10 | ~20 | Búsqueda binaria |
| O(n) | Lineal | Mira cada elemento una vez | 10³ | 10⁶ | Recorrer una lista |
| O(n log n) | Lineal-log | Divide en mitades y recorre cada nivel | ~10⁴ | ~2·10⁷ | Ordenar |
| O(n²) | Cuadrática | Compara cada elemento con todos | 10⁶ | 10¹² ⚠️ | Dos bucles anidados |
| O(2ⁿ) | Exponencial | Cada elemento duplica el trabajo | ∞ | ∞ | Todos los subconjuntos |

!!! tip "Regla práctica para estimar"
    Un ordenador hace ~10⁸-10⁹ operaciones simples por segundo. Con n = 10⁶: O(n log n) ≈ 2·10⁷ operaciones → milisegundos;
    O(n²) ≈ 10¹² → **horas**. Por eso estimar antes de implementar evita incidentes cuando los datos crecen.

### Cómo se calcula en código

```java
// O(n): un bucle que recorre n elementos
for (int x : arr) sum += x;

// O(a + b): bucles CONSECUTIVOS se suman (y si son del mismo tamaño, O(2n) = O(n))
for (int x : a) print(x);
for (int y : b) print(y);

// O(a · b): bucles ANIDADOS se multiplican
for (int x : a)
    for (int y : b) print(x + y);

// O(log n): la variable se divide entre 2 en cada vuelta → log₂(n) vueltas
while (n > 1) n = n / 2;

// O(n log n): n veces una operación O(log n)
for (int x : arr) treeSet.add(x);       // cada add en un árbol balanceado es O(log n)

// O(2ⁿ): cada llamada genera dos llamadas hasta profundidad n
int fib(int n) { return n <= 1 ? n : fib(n - 1) + fib(n - 2); }
```

### Conceptos complementarios

- **Complejidad espacial**: memoria extra que usa el algoritmo (sin contar la entrada). Una recursión de profundidad n
  usa O(n) de pila aunque no cree estructuras.
- **Coste amortizado**: `ArrayList.add` normalmente es O(1), pero cuando el array interno se llena, copia todo a uno el
  doble de grande (O(n)). Como eso ocurre cada vez menos a menudo, el coste **medio por operación** sigue siendo O(1).
- **Caso medio vs. peor caso**: `HashMap.get` es O(1) de media, pero O(n) en el peor caso (todas las claves con el mismo
  *hash*); Java 8+ lo mitiga convirtiendo el *bucket* en árbol (O(log n)).
- **Las constantes sí importan en la práctica** cuando n es pequeño o fijo: un O(n) que accede a memoria contigua
  (array) puede ser más rápido que un O(log n) que salta por punteros (árbol) para cientos de elementos.

## 2. Estructuras de datos

Cada estructura es un **compromiso**: acelera unas operaciones a costa de otras o de memoria.

| Estructura | Acceso | Búsqueda | Inserción | Borrado | En Java | Cuándo usarla |
|---|---|---|---|---|---|---|
| Array dinámico | O(1) | O(n) | O(1)* al final | O(n) | `ArrayList` | Colección indexada; la opción por defecto |
| Lista enlazada | O(n) | O(n) | O(1) con referencia | O(1) con referencia | `LinkedList` | Inserciones/borrados en medio con el nodo a mano (LRU) |
| Tabla hash | — | O(1) media | O(1) media | O(1) media | `HashMap`, `HashSet` | "¿Existe?", contar, indexar por clave |
| Pila (LIFO) | O(1) tope | — | O(1) | O(1) | `ArrayDeque` | Deshacer, paréntesis, recorrido en profundidad |
| Cola (FIFO) | O(1) frente | — | O(1) | O(1) | `ArrayDeque` | Recorrido en anchura, productor/consumidor |
| Heap (montículo) | O(1) mínimo | O(n) | O(log n) | O(log n) | `PriorityQueue` | Obtener repetidamente el menor/mayor, top-k |
| Árbol balanceado | O(log n) | O(log n) | O(log n) | O(log n) | `TreeMap`, `TreeSet` | Datos ordenados, rangos, "el siguiente mayor que X" |
| Trie | — | O(L) | O(L) | O(L) | (propia) | Búsqueda por prefijo (L = longitud de la clave) |
| Grafo | — | O(V+E) | O(1) | O(E) | `Map<K, List<K>>` | Relaciones: redes, dependencias |
| Bloom filter | — | O(k) probabilística | O(k) | ✗ | Guava | "¿Seguro que NO está?" con memoria mínima |

\* amortizado.

### Cómo funcionan por dentro (lo que hay que saber explicar)

**Tabla hash (`HashMap`)**

1. Calcula `hashCode()` de la clave y lo reduce a un índice del array interno (*bucket*).
2. Si dos claves caen en el mismo *bucket* (**colisión**), se guardan encadenadas; desde Java 8, si un *bucket* supera
   8 elementos se convierte en un árbol.
3. Cuando el número de elementos supera el 75 % de la capacidad (**factor de carga**), duplica el array y redistribuye
   todo (*rehash*).
4. Consecuencia: `equals` y `hashCode` deben ser **coherentes** (objetos iguales → mismo *hash*), y las claves no deben
   mutar mientras están en el mapa (cambiaría su *hash* y no se encontrarían).

**Heap binario (`PriorityQueue`)**

Un árbol casi completo guardado en un array, donde cada padre es menor que sus hijos (*min-heap*). El mínimo está
siempre en la raíz (O(1)). Insertar o extraer requiere "reordenar" subiendo o bajando por una rama: O(log n). No sirve
para buscar un elemento arbitrario (O(n)).

**Árbol balanceado (`TreeMap`, rojo-negro)**

Árbol de búsqueda binario que se reequilibra para que su altura sea siempre O(log n). Mantiene las claves ordenadas y
permite `floorKey(x)` (mayor ≤ x), `ceilingKey(x)`, `subMap(a, b)` (rangos).

**Estructuras de las bases de datos**

- **B-tree / B+tree**: árbol con cientos de hijos por nodo, diseñado para leer bloques de disco; poca altura (3-4 niveles
  para millones de filas). Es el índice por defecto de casi todas las bases de datos relacionales.
- **LSM-tree**: acumula escrituras en memoria y las vuelca a ficheros ordenados que se fusionan; escrituras muy rápidas
  (Cassandra, RocksDB, Kafka Streams).

**Estructuras probabilísticas**

Cambian exactitud por memoria mínima: **Bloom filter** (pertenencia: puede dar falsos positivos, nunca falsos negativos),
**HyperLogLog** (cuántos elementos distintos hay, con ~1 % de error y unos KB), **Count-Min Sketch** (frecuencias aproximadas).

## 3. Algoritmos de ordenación

| Algoritmo | Medio | Peor | Espacio | Estable | Idea |
|---|---|---|---|---|---|
| Quicksort | O(n log n) | O(n²) | O(log n) | No | Elegir un pivote, separar menores y mayores, repetir en cada lado |
| Merge sort | O(n log n) | O(n log n) | O(n) | Sí | Dividir en mitades, ordenar cada una, **mezclar** |
| TimSort | O(n log n) | O(n log n) | O(n) | Sí | Híbrido que aprovecha tramos ya ordenados; el de Java para objetos |
| Heap sort | O(n log n) | O(n log n) | O(1) | No | Construir un *heap* y extraer el máximo repetidamente |
| Counting / Radix | O(n + k) | O(n + k) | O(n + k) | Sí | Contar ocurrencias de claves enteras acotadas |

- **Estable** = mantiene el orden relativo de elementos iguales. Importa al ordenar por varios criterios sucesivos
  (primero por fecha, luego por región: la región no desordena las fechas).
- Java usa **dual-pivot quicksort** para primitivos (la estabilidad no importa) y **TimSort** para objetos.
- El límite teórico de cualquier ordenación **por comparación** es O(n log n).

## 4. Grafos

Un **grafo** son **vértices** (nodos) unidos por **aristas**, que pueden tener dirección y peso. Modela dependencias
entre despliegues, redes, rutas, relaciones.

| Representación | Memoria | Comprobar si existe arista | Recorrer vecinos | Cuándo |
|---|---|---|---|---|
| **Lista de adyacencia** | O(V + E) | O(grado) | O(grado) | Grafos dispersos (lo habitual) |
| Matriz de adyacencia | O(V²) | O(1) | O(V) | Grafos densos o pequeños |

| Problema | Algoritmo | Coste | Idea |
|---|---|---|---|
| Recorrer, componentes, ciclos | DFS / BFS | O(V + E) | Visitar marcando los ya vistos |
| Camino más corto sin pesos | BFS | O(V + E) | Por niveles: el primero que llega es el más corto |
| Camino más corto con pesos ≥ 0 | Dijkstra | O((V + E) log V) | Expandir siempre el nodo pendiente más cercano (heap) |
| Pesos negativos | Bellman-Ford | O(V · E) | Relajar todas las aristas V−1 veces |
| Orden según dependencias | Orden topológico | O(V + E) | Procesar nodos sin dependencias pendientes |
| Árbol de expansión mínima | Kruskal / Prim | O(E log E) | Añadir la arista más barata que no forme ciclo |
| Conectividad dinámica | Union-Find | ~O(1) amortizado | Conjuntos con "representante" y compresión de caminos |

## 5. Patrones de resolución

Casi todos los problemas algorítmicos son variaciones de **unos 10-15 patrones**. Se reconocen por las pistas del enunciado.

| Pista en el enunciado | Patrón |
|---|---|
| Array/string **ordenado**, pares que suman X | Two pointers |
| **Subarray/substring contiguo** más largo/corto con condición | Sliding window |
| ¿Existe? ¿Duplicado? ¿Frecuencia? | Hash map / set |
| Ordenado + buscar, o "mínimo valor que cumple" | Binary search |
| Árbol / grafo, niveles, camino más corto sin pesos | BFS |
| Árbol / grafo, explorar todo, ciclos, componentes | DFS |
| **Top-k**, k-ésimo mayor, mezclar k listas | Heap |
| **Todas** las combinaciones / permutaciones / subconjuntos | Backtracking |
| Óptimo (máx/mín/nº de formas) con subproblemas repetidos | Programación dinámica |
| Sumas de rangos repetidas | Prefix sum |
| "Siguiente mayor/menor" | Stack monótona |
| Dependencias / orden de tareas | Orden topológico |

### Two pointers

**Idea**: dos índices que se mueven por el array según una regla, evitando comparar todos los pares (O(n²) → O(n)).
**Por qué funciona** (array ordenado): si la suma es pequeña, la única forma de aumentarla es mover el izquierdo a la
derecha; si es grande, mover el derecho a la izquierda. Cada paso descarta posibilidades con seguridad.

```java
int[] twoSumSorted(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left < right) {
        int sum = nums[left] + nums[right];
        if (sum == target) return new int[]{left, right};
        if (sum < target) left++;          // necesito una suma mayor
        else right--;                      // necesito una suma menor
    }
    return new int[0];
}
```

### Sliding window

**Idea**: mantener una "ventana" `[start, end]` que se amplía por la derecha y se encoge por la izquierda cuando deja de
cumplir la condición. Cada elemento entra y sale una vez: O(n).

```java
// Longitud de la subcadena más larga sin caracteres repetidos
int longestUniqueSubstring(String s) {
    Map<Character, Integer> lastSeen = new HashMap<>();
    int best = 0, start = 0;
    for (int end = 0; end < s.length(); end++) {
        char c = s.charAt(end);
        if (lastSeen.containsKey(c) && lastSeen.get(c) >= start) {
            start = lastSeen.get(c) + 1;          // el carácter se repite dentro de la ventana: encoger
        }
        lastSeen.put(c, end);
        best = Math.max(best, end - start + 1);
    }
    return best;
}
```

### Hash map

**Idea**: cambiar memoria por tiempo. En lugar de buscar el complemento recorriendo el array (O(n) por elemento),
guardarlo en un mapa y consultarlo en O(1).

```java
int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> indexOf = new HashMap<>();      // valor → índice
    for (int i = 0; i < nums.length; i++) {
        Integer j = indexOf.get(target - nums[i]);        // ¿he visto ya el complemento?
        if (j != null) return new int[]{j, i};
        indexOf.put(nums[i], i);
    }
    return new int[0];
}
```

### Binary search

**Idea**: en un espacio **ordenado** (o con una condición que pasa de falso a verdadero una sola vez), mirar el centro y
descartar la mitad que no puede contener la respuesta. O(log n).

```java
// Primera versión defectuosa: isBad es false, false, ..., true, true (monótona)
int firstBadVersion(int n) {
    int lo = 1, hi = n;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;             // evita desbordamiento de (lo + hi) / 2
        if (isBad(mid)) hi = mid;                 // la respuesta es mid o anterior
        else lo = mid + 1;                        // la respuesta es posterior
    }
    return lo;
}
```

!!! tip "Aplicación real"
    `git bisect` es exactamente este algoritmo para encontrar el commit que introdujo un fallo: con 1 000 commits,
    bastan ~10 pruebas.

### BFS (búsqueda en anchura)

**Idea**: explorar por **niveles** usando una **cola**: primero todos los vecinos a distancia 1, luego a distancia 2…
Por eso el primer camino que llega al destino es el más corto (en número de pasos).

```java
int shortestPath(int[][] grid) {                   // 0 = libre, 1 = muro; de esquina a esquina
    int rows = grid.length, cols = grid[0].length;
    int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
    boolean[][] seen = new boolean[rows][cols];
    Deque<int[]> queue = new ArrayDeque<>();
    queue.add(new int[]{0, 0, 0});                 // fila, columna, distancia
    seen[0][0] = true;
    while (!queue.isEmpty()) {
        int[] cur = queue.poll();
        if (cur[0] == rows - 1 && cur[1] == cols - 1) return cur[2];
        for (int[] d : dirs) {
            int r = cur[0] + d[0], c = cur[1] + d[1];
            if (r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c] == 0 && !seen[r][c]) {
                seen[r][c] = true;                 // marcar al encolar, no al sacar: evita duplicados
                queue.add(new int[]{r, c, cur[2] + 1});
            }
        }
    }
    return -1;                                     // no hay camino
}
```

### DFS (búsqueda en profundidad)

**Idea**: avanzar por un camino hasta el final antes de retroceder (recursión o **pila**). Útil para explorar todo,
detectar ciclos y recorrer árboles.

```java
int maxDepth(TreeNode node) {
    if (node == null) return 0;                    // caso base
    return 1 + Math.max(maxDepth(node.left), maxDepth(node.right));
}
```

### Orden topológico

**Idea** (algoritmo de Kahn): empezar por los nodos sin dependencias; al "procesar" uno, restar 1 a las dependencias
pendientes de quienes dependen de él; cuando un nodo llega a 0, está listo. Si al final quedan nodos, hay un **ciclo**.
Es lo que hace Flux con `dependsOn` entre `Kustomizations`.

```java
List<String> deployOrder(Map<String, List<String>> dependsOn) {
    Map<String, Integer> pending = new HashMap<>();              // nº de dependencias sin resolver
    Map<String, List<String>> dependents = new HashMap<>();      // quién depende de cada nodo
    for (var e : dependsOn.entrySet()) {
        pending.putIfAbsent(e.getKey(), 0);
        for (String dep : e.getValue()) {
            pending.merge(e.getKey(), 1, Integer::sum);
            pending.putIfAbsent(dep, 0);
            dependents.computeIfAbsent(dep, k -> new ArrayList<>()).add(e.getKey());
        }
    }
    Deque<String> ready = new ArrayDeque<>();
    pending.forEach((k, v) -> { if (v == 0) ready.add(k); });
    List<String> order = new ArrayList<>();
    while (!ready.isEmpty()) {
        String next = ready.poll();
        order.add(next);
        for (String d : dependents.getOrDefault(next, List.of()))
            if (pending.merge(d, -1, Integer::sum) == 0) ready.add(d);
    }
    if (order.size() != pending.size()) throw new IllegalStateException("Dependencia cíclica");
    return order;
}
```

### Heap (top-k)

**Idea**: para quedarte con los k mayores de n elementos, mantener un **min-heap de tamaño k**: si llega uno mayor que
el mínimo del heap, sustituye al mínimo. O(n log k), mucho mejor que ordenar todo (O(n log n)) cuando k es pequeño.

```java
List<Integer> topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int n : nums) freq.merge(n, 1, Integer::sum);
    PriorityQueue<Integer> minHeap = new PriorityQueue<>(Comparator.comparingInt(freq::get));
    for (int n : freq.keySet()) {
        minHeap.add(n);
        if (minHeap.size() > k) minHeap.poll();    // descarta el menos frecuente
    }
    return new ArrayList<>(minHeap);
}
```

### Backtracking

**Idea**: construir la solución paso a paso; en cada paso **elegir** una opción, **explorar** recursivamente y
**deshacer** la elección para probar la siguiente. Explora todas las combinaciones, podando las ramas inválidas.

```java
List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, 0, new ArrayList<>(), result);
    return result;
}
void backtrack(int[] nums, int start, List<Integer> current, List<List<Integer>> result) {
    result.add(new ArrayList<>(current));          // cada estado es un subconjunto válido
    for (int i = start; i < nums.length; i++) {
        current.add(nums[i]);                       // elegir
        backtrack(nums, i + 1, current, result);    // explorar
        current.remove(current.size() - 1);         // deshacer
    }
}
```

### Programación dinámica

**Idea**: si un problema se descompone en **subproblemas que se repiten**, resolver cada uno **una sola vez** y guardar
su resultado. Dos formas: **memoización** (recursión + caché, de arriba abajo) o **tabulación** (rellenar una tabla de
abajo arriba).

```java
// Nº de formas de subir n peldaños dando pasos de 1 o 2
// Para llegar al peldaño i se viene del i-1 o del i-2 → formas(i) = formas(i-1) + formas(i-2)
int climbStairs(int n) {
    int prev = 1, cur = 1;                          // formas de llegar a los peldaños 0 y 1
    for (int i = 2; i <= n; i++) {
        int next = prev + cur;
        prev = cur;
        cur = next;
    }
    return cur;
}
```

!!! tip "Receta para plantear una programación dinámica"
    1) **Estado**: define qué significa `dp[i]` en palabras. 2) **Recurrencia**: cómo se calcula a partir de estados más
    pequeños. 3) **Casos base**. 4) **Orden** de cálculo para que lo necesario ya esté calculado. 5) **Optimiza el espacio**
    si solo dependes de los últimos valores.

## 6. Problemas para practicar { #problemas-para-practicar }

Selección clásica de LeetCode agrupada por patrón.

| Patrón | Problemas recomendados |
|---|---|
| Arrays / hash | Two Sum, Contains Duplicate, Group Anagrams, Product of Array Except Self |
| Two pointers | Valid Palindrome, 3Sum, Container With Most Water |
| Sliding window | Best Time to Buy and Sell Stock, Longest Substring Without Repeating Characters |
| Stack | Valid Parentheses, Daily Temperatures |
| Binary search | Binary Search, Search in Rotated Sorted Array |
| Linked list | Reverse Linked List, Linked List Cycle, LRU Cache |
| Árboles | Invert Binary Tree, Level Order Traversal, Validate BST, Lowest Common Ancestor |
| Grafos | Number of Islands, Course Schedule, Clone Graph |
| Heap | Kth Largest Element, Top K Frequent Elements, Merge K Sorted Lists |
| DP | Climbing Stairs, Coin Change, Longest Increasing Subsequence, House Robber |

## Preguntas de repaso

??? question "¿Qué complejidad tiene fib(n) con memoización?"
    **O(n)** en tiempo y espacio: cada valor de 0 a n se calcula una sola vez y se guarda.

??? question "Un bucle i de 0 a n y dentro otro j de i a n. ¿Complejidad?"
    El interior se ejecuta n + (n−1) + … + 1 = n(n+1)/2 veces → **O(n²)**.

??? question "¿Por qué marcar como visitado al encolar en BFS y no al sacar?"
    Porque si se marca al sacar, un mismo nodo puede encolarse varias veces desde distintos vecinos antes de procesarse,
    multiplicando el trabajo y la memoria.

??? question "¿Por qué un Bloom filter nunca da falsos negativos?"
    Al insertar se ponen a 1 los k bits de las k funciones *hash*; al consultar un elemento insertado, esos bits siguen a 1
    (nunca se ponen a 0). Puede dar falsos positivos porque otros elementos pudieron poner a 1 los mismos bits.

## Ejercicios

!!! exercise "Ejercicio 1 · Básico — Calcular complejidades"
    Indica la complejidad temporal de cada fragmento:
    ```java
    // (a)
    for (int i = 0; i < n; i++) for (int j = 0; j < 10; j++) op();
    // (b)
    for (int i = 1; i < n; i *= 2) op();
    // (c)
    for (int i = 0; i < n; i++) for (int j = 1; j < n; j *= 2) op();
    // (d) list.contains(x) dentro de un bucle de n, siendo list un ArrayList de n elementos
    ```

    ??? success "Solución"
        (a) **O(n)**: el bucle interno es constante (10). (b) **O(log n)**: `i` se duplica, llega a n en log₂ n pasos.
        (c) **O(n log n)**: n veces un bucle logarítmico. (d) **O(n²)**: `contains` en `ArrayList` recorre la lista (O(n))
        y se hace n veces; con un `HashSet` sería O(n).

!!! exercise "Ejercicio 2 · Básico — Elegir la estructura"
    Elige la estructura adecuada y justifica: (a) comprobar si un `siteId` ya fue procesado; (b) procesar tareas siempre
    por la de mayor prioridad; (c) obtener todos los despliegues entre dos fechas; (d) deshacer las últimas acciones del editor.

    ??? success "Solución"
        (a) **`HashSet`**: pertenencia en O(1). (b) **`PriorityQueue`** (heap): el máximo/mínimo en O(1) y extracción en
        O(log n). (c) **`TreeMap<Instant, …>`** con `subMap(desde, hasta)`: rangos en O(log n + k). (d) **Pila**
        (`ArrayDeque` usado con `push`/`pop`): lo último en entrar es lo primero en deshacerse.

!!! exercise "Ejercicio 3 · Medio — Paréntesis equilibrados"
    Escribe `isBalanced(String s)` que diga si `()[]{}` están bien anidados. Ejemplos: `"{[()]}"` → true, `"([)]"` → false.

    ??? success "Solución"
        ```java
        boolean isBalanced(String s) {
            Deque<Character> stack = new ArrayDeque<>();
            Map<Character, Character> closing = Map.of(')', '(', ']', '[', '}', '{');
            for (char c : s.toCharArray()) {
                if (closing.containsValue(c)) stack.push(c);                     // apertura: apilar
                else if (closing.containsKey(c)) {
                    if (stack.isEmpty() || stack.pop() != closing.get(c)) return false;   // cierre que no casa
                }
            }
            return stack.isEmpty();                                              // no deben quedar aperturas
        }
        ```
        O(n) en tiempo y espacio. La pila recuerda el último paréntesis abierto, que es el único que puede cerrarse ahora.

!!! exercise "Ejercicio 4 · Medio — Dependencias cíclicas en Kustomizations"
    Dado un mapa `kustomization → dependsOn`, detecta si hay un ciclo y devuelve un orden válido de aplicación. Pruébalo con
    `apps → [infra]`, `infra → [crds]`, `crds → []`, y luego añade `crds → [apps]`.

    ??? success "Solución"
        El método `deployOrder` de la sección de orden topológico lo resuelve: con el primer grafo devuelve
        `[crds, infra, apps]`. Al añadir `crds → [apps]`, ningún nodo empieza con 0 dependencias pendientes, `order` queda
        vacío y se lanza "Dependencia cíclica". Para informar **qué** ciclo es, se puede hacer un DFS con tres estados
        (no visitado, en curso, terminado): encontrar un nodo "en curso" indica el ciclo, y la pila de la recursión lo contiene.

!!! exercise "Ejercicio 5 · Medio — Top 3 sitios con más errores"
    Tienes un *stream* de millones de eventos `(siteId, level)`. Devuelve los 3 sitios con más errores usando memoria
    proporcional al número de sitios, no de eventos.

    ??? success "Solución"
        1. Contar con un `HashMap<String, Long>` solo los eventos de nivel ERROR: O(eventos) tiempo, O(sitios) memoria.
        2. Top-3 con un min-heap de tamaño 3: O(sitios · log 3).
        ```java
        Map<String, Long> errors = new HashMap<>();
        events.forEach(e -> { if (e.level() == ERROR) errors.merge(e.siteId(), 1L, Long::sum); });
        PriorityQueue<Map.Entry<String, Long>> heap = new PriorityQueue<>(Map.Entry.comparingByValue());
        for (var entry : errors.entrySet()) {
            heap.add(entry);
            if (heap.size() > 3) heap.poll();
        }
        ```
        Si ni siquiera los contadores caben en memoria (cientos de millones de claves), se usa un **Count-Min Sketch** con
        un heap de candidatos: resultado aproximado con memoria fija.

!!! exercise "Ejercicio 6 · Avanzado — LRU cache en O(1)"
    Implementa una caché LRU con `get(key)` y `put(key, value)` en O(1) y capacidad fija: al superarla, se elimina el
    elemento usado hace más tiempo.

    ??? success "Solución"
        Combinar un **`HashMap`** (encontrar el nodo en O(1)) con una **lista doblemente enlazada** (mover un nodo al frente
        y quitar el último en O(1)):
        ```java
        class LruCache<K, V> {
            private final int capacity;
            private final Map<K, Node<K, V>> map = new HashMap<>();
            private final Node<K, V> head = new Node<>(null, null), tail = new Node<>(null, null);  // centinelas

            LruCache(int capacity) { this.capacity = capacity; head.next = tail; tail.prev = head; }

            V get(K key) {
                Node<K, V> n = map.get(key);
                if (n == null) return null;
                unlink(n); addFront(n);                        // usado ahora: al frente
                return n.value;
            }

            void put(K key, V value) {
                Node<K, V> n = map.get(key);
                if (n != null) { n.value = value; unlink(n); addFront(n); return; }
                if (map.size() == capacity) {                   // expulsar el menos usado (el del final)
                    Node<K, V> lru = tail.prev;
                    unlink(lru); map.remove(lru.key);
                }
                n = new Node<>(key, value);
                addFront(n); map.put(key, n);
            }

            private void unlink(Node<K, V> n) { n.prev.next = n.next; n.next.prev = n.prev; }
            private void addFront(Node<K, V> n) { n.next = head.next; n.prev = head; head.next.prev = n; head.next = n; }

            private static final class Node<K, V> {
                final K key; V value; Node<K, V> prev, next;
                Node(K key, V value) { this.key = key; this.value = value; }
            }
        }
        ```
        Atajo en Java: `LinkedHashMap` con `accessOrder = true` y `removeEldestEntry` sobrescrito hace lo mismo; implementarlo
        a mano sirve para entender el mecanismo.
