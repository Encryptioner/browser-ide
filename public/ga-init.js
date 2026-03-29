/**
 * Google Analytics 4 initialization script.
 *
 * Kept as an external file (not inline) to avoid needing 'unsafe-inline' in
 * the Content-Security-Policy script-src directive.
 *
 * The measurement ID here must match the one in:
 *   - index.html  (gtag/js?id= query string)
 *   - src/services/analytics.ts  (GA_CONFIG.measurementId)
 */
window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
gtag('js', new Date());
gtag('config', 'G-XXXXXXXXXX', {
  send_page_view: true,
});
