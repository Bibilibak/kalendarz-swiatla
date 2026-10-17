/* ===== Miejsce: wyszukiwanie miasta, lokalizacja urządzenia albo współrzędne =====
   Nie zakładamy żadnego miasta: dopóki nie wybierzesz miejsca, aplikacja o nie pyta (doba zaczyna się
   o wschodzie Słońca, a wschód zależy od miejsca). Zapis w localStorage ("ks-place"), wspólny dla
   aplikacji i generatora druku. Wyszukiwanie: darmowe Open-Meteo Geocoding API (wysyłana jest tylko nazwa). */
var Place = (function () {
  var KEY = "ks-place";

  function apply(p) { lat = p.lat; lon = p.lon; tz = p.tz || ""; place = p.name || degName(p) }
  function degName(p) { return Math.abs(p.lat).toFixed(2) + "°" + (p.lat < 0 ? "S" : "N") + " " + Math.abs(p.lon).toFixed(2) + "°" + (p.lon < 0 ? "W" : "E") }
  function valid(p) { return p && validCoords(p.lat, p.lon) && (p.tz === undefined || typeof p.tz === "string") }

  // zapisane miejsce (albo null); ustawia lat / lon / tz
  function load() {
    try { var p = JSON.parse(localStorage.getItem(KEY) || "null"); if (valid(p)) { apply(p); return p } } catch (e) {}
    return null
  }
  function save(p) { apply(p); try { localStorage.setItem(KEY, JSON.stringify(p)) } catch (e) {} }
  function current() { return place ? { lat: lat, lon: lon, tz: tz, name: place } : null }

  /* Formularz wyboru miejsca w elemencie box. onPick(p) dostaje { lat, lon, tz, name }. */
  function form(box, onPick) {
    box.innerHTML =
      '<label class="pl-l">Miasto <input type="search" class="pl-city" placeholder="np. Warszawa" autocomplete="off"></label>' +
      '<div class="pl-res" role="listbox"></div>' +
      '<button type="button" class="pl-geo">Użyj mojej lokalizacji</button>' +
      '<details class="pl-man"><summary>Współrzędne ręcznie</summary>' +
      '<label>Szerokość <input type="number" step="0.001" min="-90" max="90" class="pl-lat" placeholder="52.23"></label>' +
      '<label>Długość <input type="number" step="0.001" min="-180" max="180" class="pl-lon" placeholder="21.01"></label>' +
      '<button type="button" class="pl-ok">Ustaw</button></details>' +
      '<p class="pl-msg" aria-live="polite"></p>';
    var q = box.querySelector(".pl-city"), res = box.querySelector(".pl-res"), msg = box.querySelector(".pl-msg"), timer, id = 0;
    function say(t) { msg.textContent = t }
    function pick(p) { res.innerHTML = ""; q.value = ""; say(""); onPick(p) }
    q.oninput = function () {
      clearTimeout(timer);
      var s = q.value.trim();
      if (s.length < 2) { id++; res.innerHTML = ""; return }
      timer = setTimeout(function () {
        var my = ++id;
        say("Szukam…");
        fetch("https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(s) + "&count=6&format=json&language=pl")
          .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json() })
          .then(function (d) {
            if (my !== id) return;
            res.innerHTML = ""; say(d.results && d.results.length ? "" : "Nie znaleziono.");
            (d.results || []).forEach(function (c) {
              var b = document.createElement("button");
              b.type = "button";
              b.textContent = [c.name, c.admin1 && c.admin1 !== c.name ? c.admin1 : "", c.country || ""].filter(Boolean).join(", ");
              b.onclick = function () {
                pick({ lat: +(+c.latitude).toFixed(3), lon: +(+c.longitude).toFixed(3), tz: c.timezone || "",
                  name: [c.name, c.country || ""].filter(Boolean).join(", ") })
              };
              res.appendChild(b)
            })
          })
          .catch(function (e) { if (my === id) say("Błąd wyszukiwania (" + (e && e.message || e) + "). Sprawdź internet albo wpisz współrzędne.") })
      }, 350)
    };
    q.onkeydown = function (e) { if (e.key === "Enter") { var f = res.querySelector("button"); if (f) f.click() } };
    box.querySelector(".pl-geo").onclick = function () {
      if (!navigator.geolocation) { say("Ta przeglądarka nie udostępnia lokalizacji."); return }
      say("Pobieram lokalizację…");
      navigator.geolocation.getCurrentPosition(function (p) {
        var g = { lat: +p.coords.latitude.toFixed(3), lon: +p.coords.longitude.toFixed(3), tz: "" };
        try { g.tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "" } catch (e) {}   // strefa urządzenia: jesteś na miejscu
        g.name = "Moja lokalizacja (" + degName(g) + ")";
        pick(g)
      }, function (e) { say("Nie udało się pobrać lokalizacji (" + e.message + ").") }, { timeout: 15000 })
    };
    box.querySelector(".pl-ok").onclick = function () {
      var a = parseFloat(box.querySelector(".pl-lat").value), b = parseFloat(box.querySelector(".pl-lon").value);
      if (!validCoords(a, b)) { say("Szerokość od −90 do 90, długość od −180 do 180."); return }
      var g = { lat: a, lon: b, tz: "" };   // bez strefy: daty dób według czasu słonecznego miejsca
      g.name = degName(g);
      pick(g)
    }
  }

  return { load: load, save: save, apply: apply, current: current, form: form, valid: valid }
})();
