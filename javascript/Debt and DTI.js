// =====================================================
// FINGUARD - DEBT BURDEN & DTI
// =====================================================


// DTI VALUE

const dtiValue = 0.75;


// Display DTI value inside the circle

const dtiRatio = document.getElementById("dtiRatio");

if (dtiRatio) {

    dtiRatio.textContent = dtiValue.toFixed(2);

}


// Display DTI value beside the circle

const dtiRatioLarge =
    document.getElementById("dtiRatioLarge");

if (dtiRatioLarge) {

    dtiRatioLarge.textContent =
        dtiValue.toFixed(2);

}


// =====================================================
// TOTAL MONTHLY DEBT
// =====================================================

const debtRow =
    document.getElementById("dtiDebtRow");

if (debtRow) {

    debtRow.addEventListener("click", function () {

        alert(
            "Your total monthly debt is ₦310,000."
        );

    });

}


// =====================================================
// MONTHLY INCOME
// =====================================================

const incomeRow =
    document.getElementById("dtiIncomeRow");

if (incomeRow) {

    incomeRow.addEventListener("click", function () {

        alert(
            "Your monthly income is ₦1,250,000."
        );

    });

}


// =====================================================
// DTI RATIO
// =====================================================

const ratioRow =
    document.getElementById("dtiRatioRow");

if (ratioRow) {

    ratioRow.addEventListener("click", function () {

        alert(
            "Your DTI Ratio is 0.75."
        );

    });

}


// =====================================================
// RISK BAND
// =====================================================

const riskRow =
    document.getElementById("dtiRiskRow");

if (riskRow) {

    riskRow.addEventListener("click", function () {

        alert(
            "Your current Risk Band is Moderate."
        );

    });

}
// Sidebar
window.addEventListener("message", function (event) {
  if (event.source !== document.querySelector(".sidebar-frame").contentWindow) {
    return;
  }

  document.body.classList.toggle("sidebar-collapsed", event.data.collapsed);
});