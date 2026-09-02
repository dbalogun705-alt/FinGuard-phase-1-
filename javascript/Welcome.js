// ===================================
// FINGUARD LANDING PAGE
// ===================================


// LOGIN BUTTON
const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", function () {
    window.location.href = "login.html";
});


// NAVBAR GET STARTED BUTTON
const navGetStarted = document.getElementById("navGetStarted");

navGetStarted.addEventListener("click", function () {
    window.location.href = "signup.html";
});


// HERO GET STARTED BUTTON
const heroGetStarted = document.getElementById("heroGetStarted");

heroGetStarted.addEventListener("click", function () {
    window.location.href = "signup.html";
});


// SEE HOW IT WORKS BUTTON
const howWorksBtn = document.getElementById("howWorksBtn");

howWorksBtn.addEventListener("click", function () {

    const section = document.getElementById("how-it-works");

    section.scrollIntoView({
        behavior: "smooth"
    });

});
// Sidebar
window.addEventListener("message", function (event) {
  if (event.source !== document.querySelector(".sidebar-frame").contentWindow) {
    return;
  }

  document.body.classList.toggle("sidebar-collapsed", event.data.collapsed);
});