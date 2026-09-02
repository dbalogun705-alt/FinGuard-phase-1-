// =========================================
// FINGUARD NOTIFICATIONS JAVASCRIPT
// =========================================


// =========================================
// FILTER NOTIFICATIONS
// =========================================

const notifyTabs =
    document.querySelectorAll(".notify-tab");

const notifyItems =
    document.querySelectorAll(".notify-item");


notifyTabs.forEach(function (tab) {

    tab.addEventListener("click", function () {

        // Remove active from all tabs

        notifyTabs.forEach(function (item) {

            item.classList.remove("active");

        });


        // Add active to clicked tab

        tab.classList.add("active");


        // Get selected category

        const selectedFilter =
            tab.getAttribute("data-filter");


        // Show or hide notifications

        notifyItems.forEach(function (item) {

            const notificationType =
                item.getAttribute("data-type");


            if (
                selectedFilter === "all" ||
                notificationType === selectedFilter
            ) {

                item.style.display = "flex";

            } else {

                item.style.display = "none";

            }

        });

    });

});


// =========================================
// VIEW OLDER NOTIFICATIONS
// =========================================

const notifyOlderBtn =
    document.getElementById("notifyOlderBtn");

const notifyOlderContent =
    document.getElementById("notifyOlderContent");


notifyOlderBtn.addEventListener("click", function () {

    if (
        notifyOlderContent.style.display === "block"
    ) {

        notifyOlderContent.style.display = "none";

        notifyOlderBtn.innerHTML =
            'View older notifications <i class="bi bi-chevron-down"></i>';

    } else {

        notifyOlderContent.style.display = "block";

        notifyOlderBtn.innerHTML =
            'Hide older notifications <i class="bi bi-chevron-up"></i>';

    }

});


// =========================================
// CLICK NOTIFICATION
// =========================================

notifyItems.forEach(function (item) {

    item.addEventListener("click", function () {

        const title =
            item.querySelector("h3");

        if (title) {

            console.log(
                "Notification selected: " +
                title.textContent
            );

        }

    });

});
/ Sidebar
window.addEventListener("message", function (event) {
  if (event.source !== document.querySelector(".sidebar-frame").contentWindow) {
    return;
  }

  document.body.classList.toggle("sidebar-collapsed", event.data.collapsed);
});