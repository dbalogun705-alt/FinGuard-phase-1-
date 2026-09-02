(function () {
  "use strict";

  var tabs = document.querySelectorAll(".recommendation-tab");
  var cards = document.querySelectorAll(".recommendation-card");

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var category = this.getAttribute("data-category");

      tabs.forEach(function (item) {
        item.classList.toggle("is-active", item === tab);
      });

      cards.forEach(function (card) {
        var cardCategories = card.getAttribute("data-category").split(" ");
        var shouldShow =
          category === "all" || cardCategories.indexOf(category) !== -1;
        card.classList.toggle("is-hidden", !shouldShow);
      });
    });
  });
})();
