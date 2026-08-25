const toggleButton = document.querySelector(".toggle-btn");
const sidebar = document.getElementById("sidebar");

toggleButton.addEventListener("click", function () {
  const isExpanded = sidebar.classList.toggle("expand");
  toggleButton.setAttribute("aria-expanded", String(!isExpanded));
});
