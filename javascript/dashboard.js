/* ==========================================================================
   FinGuard – dashboard shell behaviour
   Shared by every page inside the dashboard (assessment-*, cashflow-buffer).
   Requires api.js to be loaded first.

   Responsibilities:
     - collapse / expand the sidebar
     - guard the page: bounce to signin.html when there is no token
     - show the signed-in user's name + initials in the top bar
     - wire the "Log out" link to clear the session
   ========================================================================== */

(function () {
  "use strict";

  var FG = window.FinGuard;

  /* --------------------------- sidebar toggle ------------------------- */

  document.querySelectorAll("[data-sidebar-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var shell = document.getElementById("dashboard");
      if (shell) shell.classList.toggle("is-collapsed");
    });
  });

  if (!FG) return;

  /* ------------------------------ guard ------------------------------- */

  if (!FG.requireAuth("signin.html")) return;

  /* --------------------------- user in topbar ------------------------- */

  var user = FG.session.getUser();
  if (user) {
    var name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    var initials =
      ((user.firstName || "")[0] || "") + ((user.lastName || "")[0] || "");
    initials = initials.toUpperCase() || (user.email || "?")[0].toUpperCase();

    var avatar = document.querySelector(".dashboard-avatar");
    if (avatar) {
      var badge = document.createElement("div");
      badge.className = "dashboard-avatar dashboard-avatar--initials";
      badge.textContent = initials;
      badge.title = name || user.email || "";
      avatar.replaceWith(badge);
    }

    var nameSlot = document.querySelector("[data-user-name]");
    if (nameSlot) nameSlot.textContent = name || user.email || "";
  }

  /* ------------------------------ logout ------------------------------ */

  document.querySelectorAll('[data-logout], .sidebar-footer a').forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      FG.session.clear();
      window.location.replace("signin.html");
    });
  });
})();
