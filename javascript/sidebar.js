const toggleButton = document.querySelector(".toggle-btn");
const sidebar = document.getElementById("sidebar");

function notifyParent() {
  window.parent.postMessage(
    { collapsed: sidebar.classList.contains("expand") },
    "*",
  );
}

toggleButton.addEventListener("click", function () {
  const isExpanded = sidebar.classList.toggle("expand");
  toggleButton.setAttribute("aria-expanded", String(!isExpanded));
  notifyParent();
});

notifyParent();
