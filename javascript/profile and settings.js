// =====================================
// SETTINGS PAGE
// =====================================

// Settings rows
const settingRows = document.querySelectorAll(".setting-row[data-setting]");

settingRows.forEach(function (row) {
  row.addEventListener("click", function () {
    const settingName = this.dataset.setting;

    alert(settingName + " selected.");
  });
});

// =====================================
// SWITCHES
// =====================================

document.querySelectorAll(".switch input").forEach(function (toggle, index) {
  const storageKey = "fg-setting-toggle-" + index;
  const savedValue = localStorage.getItem(storageKey);

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

// =====================================
// LOG OUT
// =====================================

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
  logoutButton.addEventListener("click", function () {
    const confirmLogout = confirm("Are you sure you want to log out?");

    if (confirmLogout) {
      alert("You have been logged out.");
    }
  });
}
