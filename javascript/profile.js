(function () {
  "use strict";

  var editButton = document.getElementById("editProfileButton");
  if (editButton) {
    editButton.addEventListener("click", function () {
      alert("Profile editing will be available soon.");
    });
  }

  document.querySelectorAll("[data-profile-action]").forEach(function (row) {
    row.addEventListener("click", function () {
      var action = this.getAttribute("data-profile-action");

      if (action === "Delete Account") {
        if (window.confirm("Are you sure you want to delete your account?")) {
          alert("Account deletion will be available soon.");
        }
        return;
      }

      alert(action + " settings will be available soon.");
    });
  });
})();
