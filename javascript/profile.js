/* ==========================================================================
   FinGuard – Profile page
   Requires api.js (+ dashboard.js for the shell guard). Loaded after both.

   The backend's user object only has firstName / lastName / email – there is
   no phone number, location, avatar upload or "update profile" endpoint yet,
   so those rows show the real signed-in user and the account actions stay
   as "coming soon" until the backend adds support.
   ========================================================================== */

(function () {
  "use strict";

  var FG = window.FinGuard;
  if (!FG || !FG.session.isAuthed()) return; // dashboard.js handles the redirect

  var user = FG.session.getUser();
  if (user) {
    var name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "—";
    var initials =
      (((user.firstName || "")[0] || "") + ((user.lastName || "")[0] || "")) ||
      (user.email || "?")[0];
    initials = initials.toUpperCase();

    var avatar = document.getElementById("profileAvatar");
    if (avatar) avatar.textContent = initials;

    var nameEl = document.getElementById("profileName");
    if (nameEl) nameEl.textContent = name;

    var emailEl = document.getElementById("profileEmail");
    if (emailEl) emailEl.textContent = user.email || "—";

    var fullNameRow = document.getElementById("profileFullName");
    if (fullNameRow) fullNameRow.textContent = name;

    var emailRow = document.getElementById("profileEmailRow");
    if (emailRow) emailRow.textContent = user.email || "—";
  }

  var editButton = document.getElementById("editProfileButton");
  if (editButton) {
    editButton.addEventListener("click", function () {
      alert("Editing your name/email isn't supported by the server yet.");
    });
  }

  document.querySelectorAll("[data-profile-action]").forEach(function (row) {
    row.addEventListener("click", function () {
      var action = this.getAttribute("data-profile-action");

      if (action === "Delete Account") {
        alert("Account deletion isn't supported by the server yet.");
        return;
      }
      if (action === "Password") {
        window.location.href = "reset-password.html";
        return;
      }

      alert(action + " isn't supported by the server yet.");
    });
  });
})();
