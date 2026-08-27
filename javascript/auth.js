/* ==========================================================================
   FinGuard – auth screens (signup.html, signin.html)
   Requires api.js to be loaded first.
   ========================================================================== */

(function () {
  "use strict";

  var FG = window.FinGuard;
  if (!FG) return;

  /* --------------------------- shared helpers ------------------------- */

  function showAlert(msg) {
    var el = document.getElementById("authAlert");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("d-none");
  }

  function clearAlert() {
    var el = document.getElementById("authAlert");
    if (el) el.classList.add("d-none");
  }

  function setBusy(form, busy) {
    var btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    if (busy) {
      btn.dataset.label = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Please wait…";
    } else {
      btn.disabled = false;
      if (btn.dataset.label) btn.textContent = btn.dataset.label;
    }
  }

  // Password show / hide
  document.querySelectorAll("[data-toggle-password]").forEach(function (icon) {
    icon.addEventListener("click", function () {
      var input = icon.parentElement.querySelector('input');
      if (!input) return;
      var toText = input.type === "password";
      input.type = toText ? "text" : "password";
      icon.classList.toggle("bi-eye-slash", !toText);
      icon.classList.toggle("bi-eye", toText);
    });
  });

  /* ------------------------------- sign up ---------------------------- */

  var signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      clearAlert();

      var data = {
        firstName: signupForm.firstName.value.trim(),
        lastName: signupForm.lastName.value.trim(),
        email: signupForm.email.value.trim(),
        password: signupForm.password.value,
      };

      if (!data.firstName || !data.lastName || !data.email || !data.password) {
        showAlert("Please fill in every field.");
        return;
      }
      // NOTE: the backend currently rejects names shorter than 5 characters
      // (and returns HTTP 500). Mirror that here so users get a clean message.
      // TODO(backend): confirm / relax this rule.
      if (data.firstName.length < 5 || data.lastName.length < 5) {
        showAlert("First and last name must each be at least 5 characters.");
        return;
      }
      if (data.password.length < 6) {
        showAlert("Password must be at least 6 characters.");
        return;
      }

      setBusy(signupForm, true);
      FG.api
        .register(data)
        .then(function () {
          // Backend has no verification step yet – verify.html is a UI-only
          // screen. Carry the email through so the next screens can use it.
          try {
            sessionStorage.setItem("fg_signup_email", data.email);
          } catch (err) {}
          window.location.href = "verify.html";
        })
        .catch(function (err) {
          setBusy(signupForm, false);
          showAlert(err.message);
        });
    });
  }

  /* ------------------------------- sign in ---------------------------- */

  var signinForm = document.getElementById("signinForm");
  if (signinForm) {
    // Prefill the email captured during sign-up, if any.
    try {
      var pre = sessionStorage.getItem("fg_signup_email");
      if (pre && !signinForm.email.value) signinForm.email.value = pre;
    } catch (err) {}

    signinForm.addEventListener("submit", function (e) {
      e.preventDefault();
      clearAlert();

      var data = {
        email: signinForm.email.value.trim(),
        password: signinForm.password.value,
      };

      if (!data.email || !data.password) {
        showAlert("Enter your email and password.");
        return;
      }

      setBusy(signinForm, true);
      FG.api
        .login(data)
        .then(function () {
          try {
            sessionStorage.removeItem("fg_signup_email");
          } catch (err) {}
          // Returning users with a saved profile go straight to the
          // dashboard; everyone else starts the assessment.
          var next = FG.session.getProfileId()
            ? "cashflow-buffer.html"
            : "assessment-income.html";
          window.location.href = next;
        })
        .catch(function (err) {
          setBusy(signinForm, false);
          showAlert(err.message);
        });
    });
  }
})();
