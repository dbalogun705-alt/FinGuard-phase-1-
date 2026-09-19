/* ==========================================================================
   FinGuard – Overview page
   Requires api.js (+ dashboard.js for the shell guard). Loaded after both.
   ========================================================================== */

(function () {
  "use strict";

  var FG = window.FinGuard;
  if (!FG || !FG.session.isAuthed()) return; // dashboard.js handles the redirect

  function naira(n) {
    var v = parseFloat(n);
    return "₦" + (isFinite(v) ? Math.round(v) : 0).toLocaleString("en-NG");
  }

  // Notification button -> notifications page.
  var notificationBtn = document.getElementById("notificationBtn");
  if (notificationBtn) {
    notificationBtn.addEventListener("click", function () {
      window.location.href = "notifications.html";
    });
  }

  // Profile button -> the profile page (note the real filename has a
  // trailing space before ".html", matching every other sidebar link).
  var profileBtn = document.getElementById("profileBtn");
  if (profileBtn) {
    profileBtn.addEventListener("click", function () {
      window.location.href = "profile .html";
    });
  }

  var scoreDetails = document.getElementById("scoreDetails");
  if (scoreDetails) {
    scoreDetails.addEventListener("click", function () {
      window.location.href = "risk explanation.html";
    });
  }

  var alertDetails = document.getElementById("alertDetails");
  if (alertDetails) {
    alertDetails.addEventListener("click", function () {
      window.location.href = "risk explanation.html";
    });
  }

  // Quick actions
  document.querySelectorAll(".action").forEach(function (action) {
    action.addEventListener("click", function () {
      var actionName = this.dataset.action;
      var targets = {
        assessment: "assessment-income.html",
        debt: "Debt and DTI.html",
        cashflow: "cashflow-buffer.html",
        forecast: "Shortfall.html",
      };
      if (targets[actionName]) window.location.href = targets[actionName];
    });
  });

  /* --------------------------- greeting ------------------------------- */

  var user = FG.session.getUser();
  var greeting = document.getElementById("greetingName");
  if (greeting) {
    var hour = new Date().getHours();
    var part = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
    greeting.textContent = user && user.firstName ? part + ", " + user.firstName : part;
  }

  /* --------------------------- risk -> gauge ---------------------------- */

  var RISK_META = {
    low: { pct: 85, label: "Good", note: "You're on track. Keep it up." },
    medium: { pct: 55, label: "Fair", note: "Keep an eye on your spending." },
    high: { pct: 25, label: "Needs Attention", note: "Your finances need attention." },
  };

  function applyGauge(riskLevel) {
    var meta = RISK_META[riskLevel] || RISK_META.medium;
    var progress = document.getElementById("gaugeProgress");
    if (progress) progress.style.strokeDasharray = meta.pct + " " + (100 - meta.pct);
    var scoreValue = document.getElementById("healthScoreValue");
    if (scoreValue) scoreValue.textContent = meta.pct + "%";
    var scoreLabel = document.getElementById("healthScoreLabel");
    if (scoreLabel) scoreLabel.textContent = meta.label;
    var note = document.getElementById("healthScoreNote");
    if (note) note.textContent = meta.note;
  }

  /* --------------------------- data / empty state ----------------------- */

  function showEmptyState() {
    var empty = document.getElementById("overviewEmpty");
    if (empty) empty.classList.remove("d-none");
    document.querySelectorAll(".overview-data-section").forEach(function (el) {
      el.classList.add("d-none");
    });
  }

  function renderAnalysis(analysis) {
    var s = analysis.snapshot || {};
    var income = (s.monthlyIncome || 0) + (s.additionalIncome || 0);

    var incomeEl = document.getElementById("incomeValue");
    if (incomeEl) incomeEl.textContent = naira(income);

    var obligationsEl = document.getElementById("obligationsValue");
    if (obligationsEl) obligationsEl.textContent = naira(s.totalObligations);

    var bufferEl = document.getElementById("bufferValue");
    if (bufferEl) bufferEl.textContent = naira(s.buffer);
    var bufferNote = document.getElementById("bufferNote");
    if (bufferNote) {
      bufferNote.textContent =
        s.buffer >= 0 ? "Surplus per month" : "Shortfall per month";
    }

    var dtiEl = document.getElementById("dtiValue");
    if (dtiEl) {
      dtiEl.textContent =
        s.dtiPercentage != null ? s.dtiPercentage.toFixed(1) + "%" : "—";
    }
    var dtiLabel = document.getElementById("dtiLabel");
    if (dtiLabel) dtiLabel.textContent = (analysis.riskLevel || "").toUpperCase();

    applyGauge(analysis.riskLevel);

    var driver =
      (analysis.keyDrivers || []).find(function (k) {
        return k.severity === "high";
      }) ||
      (analysis.keyDrivers || []).find(function (k) {
        return k.severity === "medium";
      }) ||
      (analysis.keyDrivers || [])[0];

    var alertHeading = document.getElementById("alertHeading");
    var alertText = document.getElementById("alertText");
    if (driver) {
      if (alertHeading) alertHeading.textContent = driver.title;
      if (alertText) alertText.textContent = driver.explanation;
    } else if (analysis.summary) {
      if (alertHeading) alertHeading.textContent = "Your financial summary";
      if (alertText) alertText.textContent = analysis.summary;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Generate a fresh analysis so the dashboard reflects any debts/income
    // the user just added, falling back to the latest saved one, and to an
    // empty state if the user hasn't completed the assessment yet.
    FG.api
      .generateAnalysis()
      .catch(function () {
        return FG.api.getLatestAnalysis();
      })
      .then(function (analysis) {
        if (!analysis) {
          showEmptyState();
          return;
        }
        renderAnalysis(analysis);
      })
      .catch(function (err) {
        console.error("Overview: unable to load financial data:", err.message);
        showEmptyState();
      });
  });
})();
