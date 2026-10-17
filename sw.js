/* Service worker: aplikacja działa offline (pliki z pamięci podręcznej, w tle sprawdzamy nowe wersje).
   Po zmianie plików podnieś numer wersji w CACHE. */
var CACHE = "ks-v1", FILES = ["./", "index.html", "druk.html", "css/app.css?v=1", "css/print.css?v=1", "js/astro.js?v=1", "js/orbit.js?v=1",
  "js/place.js?v=1", "js/app.js?v=1", "js/print.js?v=1", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png"];
self.addEventListener("install", function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES) }).then(function () { return self.skipWaiting() })) });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (n) { return n !== CACHE }).map(function (n) { return caches.delete(n) })) }).then(function () { return self.clients.claim() }))
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;   // wyszukiwarka miast idzie prosto do sieci
  e.respondWith(caches.match(e.request).then(function (hit) {
    var net = fetch(e.request).then(function (r) { if (r.ok) { var c = r.clone(); caches.open(CACHE).then(function (ca) { ca.put(e.request, c) }) } return r });
    return hit || net
  }))
});
