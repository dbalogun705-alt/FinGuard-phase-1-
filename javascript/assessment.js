(function () {
  "use strict";

  var FG = window.FinGuard;
  if (!FG || !FG.session.isAuthed()) return;

  var DRAFT_KEY = "fg_assessment_draft";
  var CURRENCY = "NGN";

  function readDraft() {
    try {
      return JSON.parse(
        sessionStorage.getItem(DRAFT_KEY) || "{}"
      );
    } catch (e) {
      return {};
    }
  }

  function writeDraft(patch) {
    var current = readDraft();

    Object.keys(patch).forEach(function (key) {
      current[key] = patch[key];
    });

    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify(current)
      );
    } catch (e) {}
  }

  function toNumber(value) {
    return (
      parseFloat(
        String(value || "").replace(/[^0-9.]/g, "")
      ) || 0
    );
  }

  function naira(n) {
    return "₦" + Number(n || 0).toLocaleString("en-NG");
  }

  function flash(el, message, type) {
    if (!el) return;

    el.textContent = message;
    el.classList.remove(
      "d-none",
      "alert-danger",
      "alert-success",
      "alert-warning"
    );

    el.classList.add(
      type === "success"
        ? "alert-success"
        : type === "warning"
        ? "alert-warning"
        : "alert-danger"
    );
  }

  function busy(btn, on, label) {
    if (!btn) return;

    btn.disabled = on;

    if (on) {
      btn.dataset.oldText =
        btn.textContent;
      btn.textContent =
        label || "Please wait...";
    } else {
      btn.textContent =
        btn.dataset.oldText ||
        "Calculate my Financial Position";
    }
  }

  /* =========================================================
     INCOME
     ========================================================= */

  var incomeNext =
    document.getElementById("incomeNext");

  if (incomeNext) {
    var incomeInput =
      document.getElementById("monthlyIncome");

    var balanceInput =
      document.getElementById("accountBalance");

    var incomeAlert =
      document.getElementById("assessmentAlert");

    var draftIncome = readDraft();

    if (
      incomeInput &&
      draftIncome.monthlyIncome
    ) {
      incomeInput.value =
        Number(
          draftIncome.monthlyIncome
        ).toLocaleString("en-NG");
    }

    if (
      balanceInput &&
      draftIncome.accountBalance
    ) {
      balanceInput.value =
        Number(
          draftIncome.accountBalance
        ).toLocaleString("en-NG");
    }

    incomeNext.addEventListener(
      "click",
      function () {
        var monthlyIncome =
          toNumber(
            incomeInput
              ? incomeInput.value
              : 0
          );

        var accountBalance =
          toNumber(
            balanceInput
              ? balanceInput.value
              : 0
          );

        if (monthlyIncome <= 0) {
          flash(
            incomeAlert,
            "Please enter your monthly income."
          );

          if (incomeAlert) {
            incomeAlert.classList.remove(
              "d-none"
            );
          }

          return;
        }

        writeDraft({
          monthlyIncome:
            monthlyIncome,
          accountBalance:
            accountBalance
        });

        window.location.href =
          "assessment-debts.html";
      }
    );
  }

  /* =========================================================
     DEBTS
     ========================================================= */

  var debtContainer =
    document.getElementById("debtList");

  if (debtContainer) {
    var debtAlert =
      document.getElementById(
        "assessmentAlert"
      );

    var debtForm =
      document.getElementById("debtForm");

    var debtName =
      document.getElementById("debtName");

    var debtBalance =
      document.getElementById("debtBalance");

    var debtRepayment =
      document.getElementById(
        "debtRepayment"
      );

    var editingDebtId = null;

    function loadDebts() {
      FG.api
        .getDebts()
        .then(function (debts) {
          debtContainer.innerHTML = "";

          (debts || []).forEach(
            function (debt) {
              var row =
                document.createElement(
                  "div"
                );

              row.className =
                "debt-item";

              row.innerHTML =
                '<div>' +
                "<strong>" +
                (debt.name ||
                  "Debt") +
                "</strong>" +
                "<div>" +
                naira(
                  debt.balance
                ) +
                "</div>" +
                "</div>" +
                '<div>' +
                '<button type="button" class="btn btn-sm btn-outline-primary edit-debt" data-id="' +
                debt._id +
                '">Edit</button> ' +
                '<button type="button" class="btn btn-sm btn-outline-danger delete-debt" data-id="' +
                debt._id +
                '">Delete</button>' +
                "</div>";

              debtContainer.appendChild(
                row
              );
            }
          );
        })
        .catch(function (err) {
          flash(
            debtAlert,
            err.message ||
              "Unable to load debts."
          );
        });
    }

    if (debtForm) {
      debtForm.addEventListener(
        "submit",
        function (event) {
          event.preventDefault();

          var payload = {
            name: debtName
              ? debtName.value.trim()
              : "",
            balance: toNumber(
              debtBalance
                ? debtBalance.value
                : 0
            ),
            monthlyRepayment:
              toNumber(
                debtRepayment
                  ? debtRepayment.value
                  : 0
              )
          };

          if (!payload.name) {
            flash(
              debtAlert,
              "Please enter the debt name."
            );
            return;
          }

          var request;

          if (editingDebtId) {
            request =
              FG.api.updateDebt(
                editingDebtId,
                payload
              );
          } else {
            request =
              FG.api.createDebt(
                payload
              );
          }

          request
            .then(function () {
              editingDebtId = null;

              if (debtForm) {
                debtForm.reset();
              }

              loadDebts();
            })
            .catch(function (err) {
              flash(
                debtAlert,
                err.message ||
                  "Unable to save debt."
              );
            });
        }
      );
    }

    debtContainer.addEventListener(
      "click",
      function (event) {
        var button =
          event.target.closest(
            "button"
          );

        if (!button) return;

        var id =
          button.getAttribute(
            "data-id"
          );

        if (
          button.classList.contains(
            "delete-debt"
          )
        ) {
          FG.api
            .deleteDebt(id)
            .then(loadDebts)
            .catch(function (err) {
              flash(
                debtAlert,
                err.message ||
                  "Unable to delete debt."
              );
            });
        }

        if (
          button.classList.contains(
            "edit-debt"
          )
        ) {
          FG.api
            .getDebts()
            .then(function (debts) {
              var debt =
                (debts || []).find(
                  function (item) {
                    return (
                      item._id === id
                    );
                  }
                );

              if (!debt) return;

              editingDebtId = id;

              if (debtName) {
                debtName.value =
                  debt.name || "";
              }

              if (debtBalance) {
                debtBalance.value =
                  Number(
                    debt.balance || 0
                  ).toLocaleString(
                    "en-NG"
                  );
              }

              if (debtRepayment) {
                debtRepayment.value =
                  Number(
                    debt.monthlyRepayment ||
                      0
                  ).toLocaleString(
                    "en-NG"
                  );
              }
            });
        }
      }
    );

    var debtsNext =
      document.getElementById(
        "debtsNext"
      );

    if (debtsNext) {
      debtsNext.addEventListener(
        "click",
        function () {
          window.location.href =
            "assessment-expenses.html";
        }
      );
    }

    loadDebts();
  }

  /* =========================================================
     EXPENSES
     ========================================================= */

  var expenseInputs =
    document.querySelectorAll(
      "[data-expense]"
    );

  if (expenseInputs.length) {
    var expTotalEl =
      document.getElementById(
        "expenseTotal"
      );

    var obligationsEl =
      document.getElementById(
        "obligationsTotal"
      );

    var expenseAlert =
      document.getElementById(
        "assessmentAlert"
      );

    var draftEx = readDraft();

    var monthlyDebtRepayments = 0;

    FG.api
      .getDebts()
      .then(function (debts) {
        monthlyDebtRepayments =
          (debts || []).reduce(
            function (
              sum,
              debt
            ) {
              return (
                sum +
                toNumber(
                  debt.monthlyRepayment
                )
              );
            },
            0
          );

        recalcExpenses();
      })
      .catch(function () {});

    function recalcExpenses() {
      var total = 0;

      expenseInputs.forEach(
        function (input) {
          total += toNumber(
            input.value
          );
        }
      );

      if (expTotalEl) {
        expTotalEl.textContent =
          naira(total);
      }

      if (obligationsEl) {
        obligationsEl.textContent =
          naira(
            total +
              monthlyDebtRepayments
          ) + "/mo";
      }

      return total;
    }

    expenseInputs.forEach(
      function (input) {
        var key =
          input.getAttribute(
            "data-expense"
          );

        if (
          draftEx.expenses &&
          draftEx.expenses[key] !=
            null
        ) {
          input.value =
            Number(
              draftEx.expenses[key]
            ).toLocaleString(
              "en-NG"
            );
        }

        input.addEventListener(
          "input",
          recalcExpenses
        );

        input.addEventListener(
          "blur",
          function () {
            var n =
              toNumber(
                input.value
              );

            input.value = n
              ? n.toLocaleString(
                  "en-NG"
                )
              : "";

            recalcExpenses();
          }
        );
      }
    );

    recalcExpenses();

    /* =====================================================
       FINAL CALCULATE BUTTON
       ===================================================== */

    var calcBtn =
      document.getElementById(
        "calculatePosition"
      );

    if (calcBtn) {
      calcBtn.addEventListener(
        "click",
        function (event) {
          event.stopImmediatePropagation();

          if (
            calcBtn.dataset.saving ===
            "true"
          ) {
            return;
          }

          if (expenseAlert) {
            expenseAlert.classList.add(
              "d-none"
            );
          }

          var expenses = {};
          var recurringExpenses = 0;

          expenseInputs.forEach(
            function (input) {
              var value =
                toNumber(
                  input.value
                );

              var expenseName =
                input.getAttribute(
                  "data-expense"
                );

              expenses[
                expenseName
              ] = value;

              recurringExpenses +=
                value;
            }
          );

          var d = readDraft();

          if (!d.monthlyIncome) {
            flash(
              expenseAlert,
              "We couldn't find your income. Please start again from step 1."
            );

            if (expenseAlert) {
              expenseAlert.classList.remove(
                "d-none"
              );
            }

            return;
          }

          writeDraft({
            expenses: expenses
          });

          var profile = {
            monthlyIncome:
              toNumber(
                d.monthlyIncome
              ),

            recurringExpenses:
              recurringExpenses,

            additionalIncome:
              toNumber(
                d.additionalIncome
              ) || 0,

            accountBalance:
              toNumber(
                d.accountBalance
              ) || 0,

            currency: CURRENCY
          };

          /*
           * IMPORTANT:
           * Prevent multiple requests from
           * repeated clicks.
           */
          calcBtn.dataset.saving =
            "true";

          busy(
            calcBtn,
            true,
            "Calculating..."
          );

          /*
           * USE THE WORKING CREATE ENDPOINT.
           *
           * We are NOT using
           * updateFinancialProfile()
           * because your server does not
           * support that feature.
           */
          FG.api
            .createAssessmentFinancialProfile(
              profile
            )

            .then(function (result) {
              console.log(
                "Financial profile created successfully:",
                result
              );

              calcBtn.dataset.saving =
                "false";

              window.location.href =
                "assessment-complete.html";
            })

            .catch(function (err) {
              console.error(
                "Financial profile API error:",
                err
              );

              calcBtn.dataset.saving =
                "false";

              busy(
                calcBtn,
                false
              );

              if (expenseAlert) {
                flash(
                  expenseAlert,
                  err.message ||
                    "Unable to save your financial profile."
                );

                expenseAlert.classList.remove(
                  "d-none"
                );
              }
            });
        },
        true
      );
    }
  }

  /* =========================================================
     ASSESSMENT COMPLETE
     ========================================================= */

  if (
    document.getElementById(
      "summaryIncome"
    )
  ) {
    var completeDraft =
      readDraft();

    var summaryIncome =
      document.getElementById(
        "summaryIncome"
      );

    var summaryObligations =
      document.getElementById(
        "summaryObligations"
      );

    var summaryBuffer =
      document.getElementById(
        "summaryBuffer"
      );

    Promise.all([
      FG.api
        .getFinancialProfile()
        .catch(function () {
          return null;
        }),

      FG.api
        .getDebts()
        .catch(function () {
          return [];
        })
    ]).then(function (results) {
      var profile =
        results[0] || {};

      var debts =
        results[1] || [];

      var income =
        toNumber(
          profile.monthlyIncome
        ) ||
        toNumber(
          completeDraft.monthlyIncome
        );

      var expenses =
        toNumber(
          profile.recurringExpenses
        );

      var repayments =
        debts.reduce(
          function (
            sum,
            debt
          ) {
            return (
              sum +
              toNumber(
                debt.monthlyRepayment
              )
            );
          },
          0
        );

      var totalOutflow =
        expenses +
        repayments;

      var buffer =
        income -
        totalOutflow;

      if (summaryIncome) {
        summaryIncome.textContent =
          naira(income);
      }

      if (
        summaryObligations
      ) {
        summaryObligations.textContent =
          naira(
            totalOutflow
          ) + "/mo";
      }

      if (summaryBuffer) {
        summaryBuffer.textContent =
          naira(buffer);
      }
    });
  }
})();