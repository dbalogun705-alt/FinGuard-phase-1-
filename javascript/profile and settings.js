
// =====================================
// SETTINGS PAGE
// =====================================

// Settings rows
const settingRows = document.querySelectorAll(
    ".setting-row[data-setting]"
);

settingRows.forEach(function (row) {

    row.addEventListener("click", function () {

        const settingName = this.dataset.setting;

        alert(settingName + " selected.");

    });

});


// =====================================
// DARK MODE
// =====================================

const darkMode = document.getElementById("darkMode");

if (darkMode) {

    darkMode.addEventListener("change", function () {

        if (this.checked) {

            document.body.classList.add("dark-mode");

        } else {

            document.body.classList.remove("dark-mode");

        }

    });

}


// =====================================
// LOG OUT
// =====================================

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {

    logoutButton.addEventListener("click", function () {

        const confirmLogout = confirm(
            "Are you sure you want to log out?"
        );

        if (confirmLogout) {

            alert("You have been logged out.");

        }

    });

}
// Sidebar
window.addEventListener("message", function (event) {
  if (event.source !== document.querySelector(".sidebar-frame").contentWindow) {
    return;
  }

  document.body.classList.toggle("sidebar-collapsed", event.data.collapsed);
});