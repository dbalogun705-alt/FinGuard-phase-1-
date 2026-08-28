/* ==========================================================================
   FinGuard – assessment wizard wiring
   Pages: assessment-income / assessment-debts / assessment-expenses /
          assessment-complete
   Requires api.js (+ dashboard.js for the shell). Loaded after both.

   Flow
     1. Income   -> monthlyIncome + savings kept in sessionStorage
     2. Debts    -> real CRUD against /api/debts
     3. Expenses -> sum the rows, then POST /api/financial-profile with
                    everything collected so far
     4. Complete -> read /api/financial-profile/:id + /api/debts and show a
                    summary
   ========================================================================== */

(function () {
  "use strict";

  var FG = window.FinGuard;
  if (!FG || !FG.session.isAuthed()) return; // dashboard.js handles the redirect

  var DRAFT_KEY = "fg_assessment_draft";
  var CURRENCY = "NGN";

  /* ------------------------------ helpers ----------------------------- */

  function readDraft() {
    try {
      return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function writeDraft(patch) {
    var next = Object.assign(readDraft(), patch);
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    } catch (e) {}
    return next;
  }

  function toNumber(value) {
    var n = parseFloat(String(value == null ? "" : value).replace(/[^0-9.]/g, ""));
    return isFinite(n) ? n : 0;
  }

  function naira(n) {
    return "₦" + Math.round(toNumber(n)).toLocaleString("en-NG");
  }

  function flash(el, message, type) {
    if (!el) return;
    el.textContent = message;
    el.className = "alert py-2 small alert-" + (type || "danger");
  }

  function busy(btn, on, label) {
    if (!btn) return;
    if (on) {
      btn.dataset.label = btn.dataset.label || btn.textContent;
      btn.disabled = true;
      btn.textContent = label || "Working…";
    } else {
      btn.disabled = false;
      if (btn.dataset.label) btn.textContent = btn.dataset.label;
    }
  }

  /* ============================== INCOME ============================= */

  var incomeInput = document.getElementById("monthlyIncome");
  if (incomeInput) {
    var draft = readDraft();
    if (draft.monthlyIncome) incomeInput.value = Number(draft.monthlyIncome).toLocaleString("en-NG");

    var savingsInput = document.getElementById("accountBalance");
    if (savingsInput && draft.accountBalance) {
      savingsInput.value = Number(draft.accountBalance).toLocaleString("en-NG");
    }

    var clearBtn = document.getElementById("clearIncome");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        incomeInput.value = "";
        incomeInput.focus();
      });
    }

    var incomeNext = document.getElementById("incomeNext");
    if (incomeNext) {
      incomeNext.addEventListener("click", function () {
        var monthlyIncome = toNumber(incomeInput.value);
        var alertEl = document.getElementById("assessmentAlert");
        if (monthlyIncome <= 0) {
          flash(alertEl, "Enter your monthly income to continue.");
          alertEl.classList.remove("d-none");
          return;
        }
        writeDraft({
          monthlyIncome: monthlyIncome,
          accountBalance: savingsInput ? toNumber(savingsInput.value) : 0,
        });
        window.location.href = "assessment-debts.html";
      });
    }
  }

  /* ============================== DEBTS ============================= */

  var debtList = document.getElementById("debtList");
  if (debtList) {
    var debtTotalEl = document.getElementById("debtTotal");
    var debtAlert = document.getElementById("assessmentAlert");
    var addForm = document.getElementById("addDebtForm");
    var addToggle = document.getElementById("toggleAddDebt");
    var formTitle = document.getElementById("debtFormTitle");
    var formSubmit = document.getElementById("debtFormSubmit");
    var cancelBtn = document.getElementById("cancelDebtForm");

    var debtsById = {};
    var editingId = null;

    var renderDebts = function (debts) {
      debtsById = {};
      if (!debts || !debts.length) {
        debtList.innerHTML =
          '<p class="text-muted small mb-3" id="debtEmpty">No debts added yet. Use the button below to add your first loan.</p>';
        if (debtTotalEl) debtTotalEl.textContent = naira(0);
        return;
      }
      var total = 0;
      debtList.innerHTML = debts
        .map(function (d) {
          debtsById[d._id] = d;
          total += toNumber(d.monthlyRepayment);
          var type = String(d.debtType || "").replace(/_/g, " ");
          return (
            '<div class="fg-card tint-amber p-3 mb-2">' +
            '<div class="d-flex justify-content-between align-items-center">' +
            "<div><h6 class=\"fw-bold m-0\">" +
            escapeHtml(d.lenderName || "Loan") +
            '</h6><small class="text-muted text-capitalize">' +
            escapeHtml(type) +
            " · balance " +
            naira(d.outstandingBalance) +
            "</small></div>" +
            '<div class="d-flex align-items-center gap-2">' +
            '<span class="fw-bold text-amber">' +
            naira(d.monthlyRepayment) +
            "/mo</span>" +
            '<button type="button" class="btn btn-sm btn-link link-blue p-0" data-edit-debt="' +
            escapeHtml(d._id) +
            '" aria-label="Edit">Edit</button>' +
            '<button type="button" class="btn btn-sm btn-link text-danger p-0" data-delete-debt="' +
            escapeHtml(d._id) +
            '" aria-label="Remove">&times;</button>' +
            "</div></div></div>"
          );
        })
        .join("");
      if (debtTotalEl) debtTotalEl.textContent = naira(total);
    };

    var loadDebts = function () {
      debtList.innerHTML =
        '<p class="text-muted small mb-3">Loading your debts…</p>';
      FG.api
        .getDebts()
        .then(renderDebts)
        .catch(function (err) {
          debtList.innerHTML =
            '<p class="text-danger small mb-3">' +
            escapeHtml(err.message) +
            "</p>";
        });
    };

    var closeForm = function () {
      editingId = null;
      if (addForm) {
        addForm.reset();
        addForm.classList.add("d-none");
      }
      if (formTitle) formTitle.textContent = "Add a debt";
      if (formSubmit) {
        formSubmit.textContent = "Add debt";
        delete formSubmit.dataset.label;
      }
    };

    var openForm = function (debt) {
      editingId = debt ? debt._id : null;
      if (formTitle) formTitle.textContent = debt ? "Edit debt" : "Add a debt";
      if (formSubmit) {
        formSubmit.textContent = debt ? "Save changes" : "Add debt";
        delete formSubmit.dataset.label;
      }
      if (debt) {
        addForm.lenderName.value = debt.lenderName || "";
        addForm.debtType.value = debt.debtType || "personal_loan";
        addForm.outstandingBalance.value = toNumber(
          debt.outstandingBalance
        ).toLocaleString("en-NG");
        addForm.monthlyRepayment.value = toNumber(
          debt.monthlyRepayment
        ).toLocaleString("en-NG");
      } else {
        addForm.reset();
      }
      debtAlert.classList.add("d-none");
      addForm.classList.remove("d-none");
      addForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
      addForm.lenderName.focus();
    };

    debtList.addEventListener("click", function (e) {
      var editBtn = e.target.closest("[data-edit-debt]");
      if (editBtn) {
        var debt = debtsById[editBtn.getAttribute("data-edit-debt")];
        if (debt) openForm(debt);
        return;
      }
      var btn = e.target.closest("[data-delete-debt]");
      if (!btn) return;
      var id = btn.getAttribute("data-delete-debt");
      busy(btn, true, "…");
      FG.api
        .deleteDebt(id)
        .then(function () {
          if (editingId === id) closeForm();
          loadDebts();
        })
        .catch(function (err) {
          busy(btn, false);
          flash(debtAlert, err.message);
          debtAlert.classList.remove("d-none");
        });
    });

    if (addToggle && addForm) {
      addToggle.addEventListener("click", function () {
        if (addForm.classList.contains("d-none")) openForm(null);
        else closeForm();
      });
    }
    if (cancelBtn) cancelBtn.addEventListener("click", closeForm);

    if (addForm) {
      addForm.addEventListener("submit", function (e) {
        e.preventDefault();
        debtAlert.classList.add("d-none");
        var debt = {
          lenderName: addForm.lenderName.value.trim(),
          debtType: addForm.debtType.value,
          outstandingBalance: toNumber(addForm.outstandingBalance.value),
          monthlyRepayment: toNumber(addForm.monthlyRepayment.value),
        };
        if (!debt.lenderName || debt.monthlyRepayment <= 0) {
          flash(debtAlert, "Add a lender name and a monthly repayment.");
          debtAlert.classList.remove("d-none");
          return;
        }
        var isEdit = !!editingId;
        busy(formSubmit, true, isEdit ? "Saving…" : "Adding…");
        var call = isEdit
          ? FG.api.updateDebt(editingId, debt)
          : FG.api.createDebt(debt);
        call
          .then(function () {
            busy(formSubmit, false);
            closeForm();
            loadDebts();
          })
          .catch(function (err) {
            busy(formSubmit, false);
            flash(debtAlert, err.message);
            debtAlert.classList.remove("d-none");
          });
      });
    }

    var debtsNext = document.getElementById("debtsNext");
    if (debtsNext) {
      debtsNext.addEventListener("click", function () {
        window.location.href = "assessment-expenses.html";
      });
    }

    loadDebts();
  }

  /* ============================= EXPENSES =========================== */

  var expenseInputs = document.querySelectorAll("[data-expense]");
  if (expenseInputs.length) {
    var expTotalEl = document.getElementById("expenseTotal");
    var obligationsEl = document.getElementById("obligationsTotal");
    var expenseAlert = document.getElementById("assessmentAlert");
    var draftEx = readDraft();

    var monthlyDebtRepayments = 0;
    FG.api
      .getDebts()
      .then(function (debts) {
        monthlyDebtRepayments = (debts || []).reduce(function (sum, d) {
          return sum + toNumber(d.monthlyRepayment);
        }, 0);
        recalcExpenses();
      })
      .catch(function () {
        /* leave repayments at 0 if the call fails */
      });

    var recalcExpenses = function () {
      var total = 0;
      expenseInputs.forEach(function (input) {
        total += toNumber(input.value);
      });
      if (expTotalEl) expTotalEl.textContent = naira(total);
      if (obligationsEl) {
        obligationsEl.textContent = naira(total + monthlyDebtRepayments) + "/mo";
      }
      return total;
    };

    expenseInputs.forEach(function (input) {
      var key = input.getAttribute("data-expense");
      if (draftEx.expenses && draftEx.expenses[key] != null) {
        input.value = Number(draftEx.expenses[key]).toLocaleString("en-NG");
      }
      input.addEventListener("input", recalcExpenses);
      input.addEventListener("blur", function () {
        var n = toNumber(input.value);
        input.value = n ? n.toLocaleString("en-NG") : "";
        recalcExpenses();
      });
    });
    recalcExpenses();

    var calcBtn = document.getElementById("calculatePosition");
    if (calcBtn) {
      calcBtn.addEventListener("click", function () {
        expenseAlert.classList.add("d-none");
        var expenses = {};
        var recurringExpenses = 0;
        expenseInputs.forEach(function (input) {
          var v = toNumber(input.value);
          expenses[input.getAttribute("data-expense")] = v;
          recurringExpenses += v;
        });

        var d = readDraft();
        if (!d.monthlyIncome) {
          flash(
            expenseAlert,
            "We couldn't find your income. Please start again from step 1."
          );
          expenseAlert.classList.remove("d-none");
          return;
        }
        writeDraft({ expenses: expenses });

        var profile = {
          monthlyIncome: toNumber(d.monthlyIncome),
          recurringExpenses: recurringExpenses,
          additionalIncome: toNumber(d.additionalIncome) || 0,
          accountBalance: toNumber(d.accountBalance) || 0,
          currency: CURRENCY,
        };

        busy(calcBtn, true, "Calculating…");
        FG.api
          .createFinancialProfile(profile)
          .then(function () {
            window.location.href = "assessment-complete.html";
          })
          .catch(function (err) {
            busy(calcBtn, false);
            flash(expenseAlert, err.message);
            expenseAlert.classList.remove("d-none");
          });
      });
    }
  }

  /* ============================= COMPLETE =========================== */

  var summaryIncome = document.getElementById("summaryIncome");
  if (summaryIncome) {
    var summaryObligations = document.getElementById("summaryObligations");
    var summaryBuffer = document.getElementById("summaryBuffer");

    // Fall back to the numbers collected during this session if the backend
    // profile endpoint is unavailable (it currently 404s).
    var d = readDraft();
    var draftProfile = {
      monthlyIncome: toNumber(d.monthlyIncome),
      additionalIncome: toNumber(d.additionalIncome),
      accountBalance: toNumber(d.accountBalance),
      recurringExpenses: d.expenses
        ? Object.keys(d.expenses).reduce(function (s, k) {
            return s + toNumber(d.expenses[k]);
          }, 0)
        : 0,
    };

    Promise.all([
      FG.api.getFinancialProfile().catch(function () {
        return null;
      }),
      FG.api.getDebts().catch(function () {
        return [];
      }),
    ]).then(function (results) {
      var profile = results[0] || draftProfile;
      var debts = results[1] || [];

      var income =
        toNumber(profile.monthlyIncome) + toNumber(profile.additionalIncome);
      var repayments = debts.reduce(function (sum, d) {
        return sum + toNumber(d.monthlyRepayment);
      }, 0);
      var outflow = repayments + toNumber(profile.recurringExpenses);

      summaryIncome.textContent = naira(income);
      if (summaryObligations) summaryObligations.textContent = naira(repayments);

      if (summaryBuffer) {
        // TODO(backend): replace with the official cashflow-buffer figure
        // once the backend exposes it. This is a provisional client-side
        // estimate: months your cash balance covers total monthly outflow.
        var balance = toNumber(profile.accountBalance);
        var months = outflow > 0 ? balance / outflow : 0;
        summaryBuffer.textContent = months
          ? months.toFixed(1) + " Months"
          : "—";
      }
    });
  }

  /* ------------------------------------------------------------------- */

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
})();
