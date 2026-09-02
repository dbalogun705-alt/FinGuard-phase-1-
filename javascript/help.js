(function () {
  "use strict";

  var search = document.getElementById("help-search");
  var questions = document.querySelectorAll(".help-question");
  var supportButton = document.getElementById("supportButton");

  questions.forEach(function (question) {
    question.addEventListener("click", function () {
      var existingAnswer = this.nextElementSibling;

      if (existingAnswer && existingAnswer.classList.contains("help-answer")) {
        existingAnswer.remove();
        this.classList.remove("is-open");
        return;
      }

      var answer = document.createElement("p");
      answer.className = "help-answer";
      answer.textContent = this.getAttribute("data-answer");
      this.insertAdjacentElement("afterend", answer);
      this.classList.add("is-open");
    });
  });

  search.addEventListener("input", function () {
    var query = this.value.trim().toLowerCase();

    questions.forEach(function (question) {
      question.hidden =
        query && question.textContent.toLowerCase().indexOf(query) === -1;
    });
  });

  supportButton.addEventListener("click", function () {
    window.location.href = "mailto:support@finguard.com";
  });
})();
