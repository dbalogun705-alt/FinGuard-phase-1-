/* ==========================================================================
   FinGuard – Reset Password
   Two steps against the real backend:
     1. POST /auth/forgot-password { email }   -> sends an OTP
     2. POST /auth/reset-password  { email, otp, newPassword }
   Requires api.js to be loaded first.
   ========================================================================== */

(function () {
  "use strict";

  var FG = window.FinGuard;

  var requestForm = document.getElementById("resetForm");
  var emailInput = document.getElementById("email");
  var errorMessage = document.getElementById("errorMessage");
  var resetButton = document.getElementById("resetButton");
  var successMessage = document.getElementById("successMessage");
  var resetAlert = document.getElementById("resetAlert");
  var otpHint = document.getElementById("otpHint");
  var stepDescription = document.getElementById("stepDescription");

  var newPasswordForm = document.getElementById("newPasswordForm");
  var otpInput = document.getElementById("otp");
  var newPasswordInput = document.getElementById("newPassword");
  var confirmResetButton = document.getElementById("confirmResetButton");

  var email = "";

  function showAlert(message) {
    if (!resetAlert) return;
    resetAlert.textContent = message;
    resetAlert.classList.remove("d-none");
  }

  function clearAlert() {
    if (resetAlert) resetAlert.classList.add("d-none");
  }

  function setBusy(btn, busy, label) {
    if (!btn) return;
    if (busy) {
      btn.dataset.label = btn.dataset.label || btn.textContent;
      btn.disabled = true;
      btn.textContent = label;
    } else {
      btn.disabled = false;
      if (btn.dataset.label) btn.textContent = btn.dataset.label;
    }
  }

  if (!requestForm || !FG) return;

  requestForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearAlert();
    errorMessage.textContent = "";

    email = emailInput.value.trim();

    if (!email) {
      errorMessage.textContent = "Please enter your email address.";
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      errorMessage.textContent = "Please enter a valid email address.";
      return;
    }

    setBusy(resetButton, true, "Sending…");

    FG.api
      .forgotPassword({ email: email })
      .then(function (result) {
        setBusy(resetButton, false);

        if (result && result.otp && otpHint) {
          otpHint.textContent = "Development code: " + result.otp;
          otpHint.classList.remove("d-none");
        }

        if (stepDescription) {
          stepDescription.textContent =
            "Enter the code we sent to " + email + " and choose a new password.";
        }

        requestForm.classList.add("d-none");
        newPasswordForm.classList.remove("d-none");
      })
      .catch(function (err) {
        setBusy(resetButton, false);
        showAlert(err.message);
      });
  });

  newPasswordForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearAlert();

    var otp = otpInput.value.trim();
    var newPassword = newPasswordInput.value;

    if (otp.length !== 6) {
      showAlert("Enter the 6-digit code.");
      return;
    }
    if (newPassword.length < 12) {
      showAlert("Your new password must be at least 12 characters.");
      return;
    }

    setBusy(confirmResetButton, true, "Resetting…");

    FG.api
      .resetPassword({ email: email, otp: otp, newPassword: newPassword })
      .then(function () {
        newPasswordForm.classList.add("d-none");
        if (otpHint) otpHint.classList.add("d-none");
        successMessage.style.display = "block";
      })
      .catch(function (err) {
        setBusy(confirmResetButton, false);
        showAlert(err.message);
      });
  });
})();
