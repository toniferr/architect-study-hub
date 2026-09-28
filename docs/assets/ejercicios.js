// Filtro de texto de la página de ejercicios (compatible con la navegación instantánea de Material)
function initExerciseFilter() {
  const input = document.getElementById("ej-filtro");
  if (!input) return;
  const normalize = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  input.addEventListener("input", () => {
    const q = normalize(input.value.trim());
    document.querySelectorAll(".md-typeset table tbody tr").forEach((row) => {
      row.style.display = !q || normalize(row.textContent).includes(q) ? "" : "none";
    });
  });
}

if (typeof document$ !== "undefined") {
  document$.subscribe(initExerciseFilter);   // se ejecuta en cada navegación
} else {
  document.addEventListener("DOMContentLoaded", initExerciseFilter);
}
