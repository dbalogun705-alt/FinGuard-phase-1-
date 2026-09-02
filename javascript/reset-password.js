// =========================================
// FINGUARD - RESET PASSWORD
// =========================================


// Get the form
const resetForm = document.getElementById("resetForm");


// Get elements
const emailInput = document.getElementById("email");

const errorMessage =
    document.getElementById("errorMessage");

const successMessage =
    document.getElementById("successMessage");

const resetButton =
    document.getElementById("resetButton");


// =========================================
// FORM SUBMISSION
// =========================================

resetForm.addEventListener("submit", function (event) {

    // Stop page from refreshing
    event.preventDefault();


    // Get email
    const email = emailInput.value.trim();


    // Clear old messages
    errorMessage.textContent = "";

    successMessage.style.display = "none";


    // =========================================
    // CHECK EMPTY EMAIL
    // =========================================

    if (email === "") {

        errorMessage.textContent =
            "Please enter your email address.";

        return;
    }


    // =========================================
    // CHECK EMAIL FORMAT
    // =========================================

    if (!email.includes("@") || !email.includes(".")) {

        errorMessage.textContent =
            "Please enter a valid email address.";

        return;
    }


    // =========================================
    // BUTTON LOADING
    // =========================================

    resetButton.disabled = true;

    resetButton.textContent = "Sending...";


    // =========================================
    // TEMPORARY SUCCESS
    // =========================================

    // This is only a temporary simulation.
    // API will be added later.

    setTimeout(function () {

        successMessage.textContent =
            "Reset link sent successfully!";

        successMessage.style.display = "block";


        resetButton.disabled = false;

        resetButton.textContent =
            "Send Reset Link";


        emailInput.value = "";

    }, 1000);

});
// Sidebar
window.addEventListener("message", function (event) {
  if (event.source !== document.querySelector(".sidebar-frame").contentWindow) {
    return;
  }

  document.body.classList.toggle("sidebar-collapsed", event.data.collapsed);
});