// coi-serviceworker loader: Enables COOP/COEP headers for WebContainers on static hosting (GitHub Pages)
// Only loads coi-serviceworker when running under /browser-ide/ path (GitHub Pages deployment)
// In dev mode, Vite's server headers handle COOP/COEP directly
(function () {
  if (window.location.pathname.startsWith('/browser-ide/')) {
    window.coi = {
      coepCredentialless: function () {
        return true;
      },
      quiet: false,
    };
    var s = document.createElement('script');
    s.src = '/browser-ide/coi-serviceworker.min.js';
    document.head.appendChild(s);
  }
})();
