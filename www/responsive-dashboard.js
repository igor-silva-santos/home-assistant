/**
 * Injeta CSS responsivo e modo kiosk opcional (query ?kiosk=1)
 */
(function () {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/local/responsive-dashboard.css";
  document.head.appendChild(link);

  const params = new URLSearchParams(window.location.search);
  if (params.get("kiosk") === "1") {
    document.body.classList.add("ft-kiosk-mode");
  }

  window.addEventListener("orientationchange", () => {
    document.documentElement.style.setProperty(
      "--ft-orientation",
      window.innerWidth > window.innerHeight ? "landscape" : "portrait"
    );
  });
  document.documentElement.style.setProperty(
    "--ft-orientation",
    window.innerWidth > window.innerHeight ? "landscape" : "portrait"
  );
})();
