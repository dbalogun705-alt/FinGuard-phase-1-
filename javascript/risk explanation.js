// =====================================
// FINGUARD - RISK EXPLANATION
// =====================================

// Recommendation button
const recommendationBtn =
    document.getElementById("recommendationBtn");

recommendationBtn.addEventListener("click", function () {

    alert(
        "Here you can view recommendations to improve your financial health."
    );

});
// Sidebar
window.addEventListener("message", function (event) {
  if (event.source !== document.querySelector(".sidebar-frame").contentWindow) {
    return;
  }

  document.body.classList.toggle("sidebar-collapsed", event.data.collapsed);
});