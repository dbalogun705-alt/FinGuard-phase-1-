/* ==========================================================================
   FinGuard – Cashflow Buffer page
   Requires api.js (+ dashboard.js for the shell guard). Loaded after both.

   Generates a fresh analysis (POST /api/analyses) so the numbers reflect the
   user's latest debts/income, falls back to the last saved analysis, and
   shows an empty state if the user hasn't completed the assessment yet.
   The "Upcoming Obligations" list comes straight from GET /api/debts.
   ========================================================================== */

(function () {
  "use strict";

  var FG = window.FinGuard;
  if (!FG || !FG.session.isAuthed()) return; // dashboard.js handles the redirect

  function naira(n) {
    var v = parseFloat(n);
    return "₦" + (isFinite(v) ? Math.round(v) : 0).toLocaleString("en-NG");
  }

  function pct(part, whole) {
    if (!whole) return 0;
    return Math.max(0, Math.min(100, (part / whole) * 100));
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

  function showEmpty() {
    var empty = document.getElementById("bufferEmpty");
    var data = document.getElementById("bufferData");
    if (empty) empty.classList.remove("d-none");
    if (data) data.classList.add("d-none");
  }

  function renderAnalysis(analysis) {
    var s = analysis.snapshot || {};
    var income = (s.monthlyIncome || 0) + (s.additionalIncome || 0);
    var debtPayments = s.totalMonthlyDebtPayments || 0;
    var expenses = s.recurringExpenses || 0;
    var outflow = s.totalObligations != null ? s.totalObligations : debtPayments + expenses;
    var buffer = s.buffer != null ? s.buffer : income - outflow;
    var balance = s.accountBalance || 0;
    var monthsCovered = outflow > 0 ? balance / outflow : 0;

    var debtPct = pct(debtPayments, income);
    var expensesPct = pct(expenses, income);
    var bufferPct = Math.max(0, 100 - debtPct - expensesPct);

    document.getElementById("bufferData").classList.remove("d-none");
    document.getElementById("bufferEmpty").classList.add("d-none");

    var gaugePct = Math.max(0, Math.min(100, (monthsCovered / 6) * 100)); // 6 months = a full ring
    var gauge = document.getElementById("bufferGauge");
    if (gauge) gauge.setAttribute("stroke-dasharray", gaugePct + ", 100");
    var bufferMonths = document.getElementById("bufferMonths");
    if (bufferMonths) bufferMonths.textContent = monthsCovered.toFixed(1);
    var status = document.getElementById("bufferStatus");
    if (status) {
      status.textContent =
        monthsCovered >= 3
          ? "Buffer is Healthy 👍"
          : monthsCovered >= 1
          ? "Buffer is Thin ⚠️"
          : "Buffer is Critical 🔴";
    }

    document.getElementById("afterObligations").textContent = naira(buffer);
    document.getElementById("monthlyOutflow").textContent = naira(outflow);
    document.getElementById("monthsCovered").textContent =
      monthsCovered.toFixed(1) + " Months";

    document.getElementById("segDebt").style.width = debtPct + "%";
    document.getElementById("segExpenses").style.width = expensesPct + "%";
    document.getElementById("segBuffer").style.width = bufferPct + "%";

    document.getElementById("debtPct").textContent = debtPct.toFixed(1) + "%";
    document.getElementById("expensesPct").textContent = expensesPct.toFixed(1) + "%";
    document.getElementById("bufferPct").textContent = bufferPct.toFixed(1) + "%";

    document.getElementById("debtAmount").textContent = naira(debtPayments);
    document.getElementById("expensesAmount").textContent = naira(expenses);
    document.getElementById("bufferAmount").textContent = naira(buffer);
  }

  FG.api
    .generateAnalysis()
    .catch(function () {
      return FG.api.getLatestAnalysis();
    })
    .then(function (analysis) {
      if (!analysis) {
        showEmpty();
        return;
      }
      renderAnalysis(analysis);
    })
    .catch(function () {
      showEmpty();
    });

  var list = document.getElementById("obligationsList");
  if (!list) return;

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
