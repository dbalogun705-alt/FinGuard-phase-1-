// =====================================================
// FINGUARD - RISK EXPLANATION
// =====================================================


// ================================
// BOTTOM INFORMATION BUTTON
// ================================

const riskInfoButton =
    document.getElementById("riskInfoButton");


riskInfoButton.addEventListener("click", function () {

    alert(
        "FinGuard explains your financial situation in simple language without complicated financial terms."
    );

});
// Sidebar
window.addEventListener("message", function (event) {
  if (event.source !== document.querySelector(".sidebar-frame").contentWindow) {
    return;
  }

  document.body.classList.toggle("sidebar-collapsed", event.data.collapsed);
});