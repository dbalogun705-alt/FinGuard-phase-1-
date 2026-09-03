// =====================================
// OVERVIEW PAGE
// =====================================

// Notification button
const notificationBtn = document.getElementById("notificationBtn");

if (notificationBtn) {
  notificationBtn.addEventListener("click", function () {
    alert("You have no new notifications.");
  });
}

// Profile button
const profileBtn = document.getElementById("profileBtn");

if (profileBtn) {
  profileBtn.addEventListener("click", function () {
    window.location.href = "profile and settings.html";
  });
}

// Financial Health details
const scoreDetails = document.getElementById("scoreDetails");

if (scoreDetails) {
  scoreDetails.addEventListener("click", function () {
    alert("Your Financial Health Score is 75% - Good.");
  });
}

// Recent Alert details
const alertDetails = document.getElementById("alertDetails");

if (alertDetails) {
  alertDetails.addEventListener("click", function () {
    alert("Your cashflow buffer may not cover more than 2 months of expenses.");
  });
}

// Quick Actions
const actions = document.querySelectorAll(".action");

actions.forEach(function (action) {
  action.addEventListener("click", function () {
    const actionName = this.dataset.action;

    if (actionName === "assessment") {
      alert("Opening Financial Assessment...");
    } else if (actionName === "debt") {
      alert("Opening Debt & DTI...");
    } else if (actionName === "cashflow") {
      alert("Opening Cashflow Buffer...");
    } else if (actionName === "forecast") {
      alert("Opening Shortfall Forecast...");
    }
  });
});

document.addEventListener("DOMContentLoaded", async function () {
  // Guard route
  if (!FinGuard.requireAuth("signin.html")) return;

  try {
    // Fetch profile and latest analysis simultaneously
    const profile = await FinGuard.api.getFinancialProfile();
    const analyses = await FinGuard.api.getAnalyses();
    const latest = Array.isArray(analyses) ? analyses[0] : analyses;

    // Render profile numbers
    if (profile) {
      document.getElementById("incomeValue").textContent =
        `₦${(profile.monthlyIncome || 0).toLocaleString()}`;
      document.getElementById("obligationsValue").textContent =
        `₦${(profile.recurringExpenses || 0).toLocaleString()}`;
    }

    // Render score and indicators
    if (latest) {
      document.getElementById("healthScoreGauge").textContent =
        `${latest.score || 0}%`;
      document.getElementById("dtiRatioValue").textContent =
        latest.dtiRatio || "N/A";
    }
  } catch (err) {
    console.error("Dashboard error:", err.message);
  }
});
