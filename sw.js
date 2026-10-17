/* Service worker: aplikacja działa offline (pliki z pamięci podręcznej, w tle sprawdzamy nowe wersje).
   Po zmianie plików podnieś numer wersji w CACHE. */
var CACHE = "ks-v2", FILES = ["./", "index.html", "druk.html", "css/app.css?v=2", "css/print.css?v=2", "js/astro.js?v=1", "js/orbit.js?v=1",
  "js/place.js?v=2", "js/app.js?v=2", "js/print.js?v=2", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png"];
self.addEventListener("install", function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES) }).then(function () { return self.skipWaiting() })) });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (n) { return n !== CACHE }).map(function (n) { return caches.delete(n) })) }).then(function () { return self.clients.claim() }))
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;   // wyszukiwarka miast idzie prosto do sieci
  // strony (np. druk.html?y=2027…) bez parametrów: parametry czyta skrypt, plik jest ten sam
  var nav = e.request.mode === "navigate", key = nav ? new URL(e.request.url).pathname : e.request;
  var net = fetch(e.request).then(function (r) {
    if (r.ok) { var c = r.clone(); e.waitUntil(caches.open(CACHE).then(function (ca) { return ca.put(key, c) })) }
    return r
  });
  e.respondWith(caches.match(key).then(function (hit) { return hit || net }));
  e.waitUntil(net.catch(function () {}))   // bez sieci: zostaje wersja z pamięci, bez błędu w konsoli
});
