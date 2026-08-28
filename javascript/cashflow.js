/* ==========================================================================
   FinGuard – Cashflow Buffer page
   Requires api.js (+ dashboard.js for the shell guard). Loaded after both.

   Only the "Upcoming Obligations" list is live right now – it is the user's
   debts from GET /api/debts. The gauge, the "Monthly Cashflow" breakdown and
   the After Obligations / Monthly Outflow figures are still static pending
   the backend team's cashflow-buffer formula / endpoint.
   ========================================================================== */

(function () {
  "use strict";

  var FG = window.FinGuard;
  if (!FG || !FG.session.isAuthed()) return; // dashboard.js handles the redirect

  var list = document.getElementById("obligationsList");
  if (!list) return;

  function naira(n) {
    var v = parseFloat(n);
    return "₦" + (isFinite(v) ? Math.round(v) : 0).toLocaleString("en-NG");
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }

  FG.api
    .getDebts()
    .then(function (debts) {
      if (!debts || !debts.length) {
        list.innerHTML =
          '<li class="list-group-item text-muted small py-3">No obligations on file. Add your loans in the assessment.</li>';
        return;
      }
      list.innerHTML = debts
        .map(function (d) {
          var type = String(d.debtType || "obligation").replace(/_/g, " ");
          return (
            '<li class="list-group-item d-flex justify-content-between align-items-center py-3">' +
            "<div><div class=\"fw-semibold\">" +
            escapeHtml(d.lenderName || "Loan") +
            '</div><small class="text-muted text-capitalize">' +
            escapeHtml(type) +
            "</small></div>" +
            '<span class="fw-bold text-red">' +
            naira(d.monthlyRepayment) +
            "/mo</span></li>"
          );
        })
        .join("");
    })
    .catch(function (err) {
      list.innerHTML =
        '<li class="list-group-item text-danger small py-3">' +
        escapeHtml(err.message) +
        "</li>";
    });
})();
