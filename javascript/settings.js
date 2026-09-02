(function () {
  "use strict";

  document
    .querySelectorAll(".setting-row[data-setting]")
    .forEach(function (row) {
      row.addEventListener("click", function () {
        alert(this.getAttribute("data-setting") + " selected.");
      });
    });

  document.querySelectorAll(".switch input").forEach(function (toggle, index) {
    var storageKey = "fg-setting-toggle-" + index;
    var savedValue = localStorage.getItem(storageKey);

    if (savedValue !== null) toggle.checked = savedValue === "true";

    toggle.addEventListener("change", function () {
      localStorage.setItem(storageKey, String(this.checked));

      if (this.id === "darkMode") {
        document.body.classList.toggle("dark-mode", this.checked);
      }
    });

    if (toggle.id === "darkMode" && toggle.checked) {
      document.body.classList.add("dark-mode");
    }
  });
})();
