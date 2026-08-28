window.addEventListener("message", function (event) {
  if (event.source !== document.querySelector(".sidebar-frame").contentWindow) {
    return;
  }

  document.body.classList.toggle("sidebar-collapsed", event.data.collapsed);
});
