/* ===== Generator kalendarza do druku (A5) =====
   Ścienny: okładka, 12 miesięcy (A5 poziomo, rzędy po 10 dni), strona „Jak czytać”.
   Planer: A5 pionowo; okładka, „Jak czytać”, rok w skrócie, potem każda dekada (dni 1–10, 11–20, 21–koniec)
   na rozkładówce: lewa i prawa strona. Każda dekada ma 2 strony, więc zawsze zaczyna się na lewej.
   Adres może mieć parametry: ?y=2026&layout=wall|planner&lat=52.23&lon=21.01&tz=Europe/Warsaw&name=Warszawa
   (tak powstają przykładowe PDF-y w folderze przyklad/). */
(function () {
  function $(i) { return document.getElementById(i) }
  var Q = new URLSearchParams(location.search), Y, layout;
  var PH_COL = { dark: "#5a6078", lit: "#ffffff", line: "#5a6078" };   // Księżyc do druku: ciemna część szara, jasna biała

  /* ===== Dane roku ===== */
  function yearData(Y) {
    var s = OrbitCal.starts(Y), n0 = s[0], n1 = s[12] - 1, ph = phasesBetween(n0, n1), ap = OrbitCal.apsisDays(Y), b = OrbitCal.year(Y).b,
      days = {}, n;
    for (n = n0; n <= n1; n++) days[n] = dayInfo(n);
    return { Y: Y, s: s, ph: ph, ap: ap, b: b, days: days }
  }
  // zdarzenia doby n: fazy Księżyca, równonoc / przesilenie, apsydy — [{ t: tekst, deg, k: faza albo -1 }]
  function events(D, n) {
    var out = [], d = D.days[n], k = D.s.indexOf(n);
    (D.ph[n] || []).forEach(function (f) { out.push({ t: PHASE_NAMES[f.k], deg: degOf(d, f.ms), k: f.k }) });
    if (k >= 0 && k < 12 && k % 3 === 0) out.push({ t: k % 6 ? "Przesilenie" : "Równonoc", deg: degOf(d, D.b[k]), k: -1 });
    if (n === D.ap.aph) out.push({ t: "Najdalej od Słońca", deg: null, k: -2 });
    if (n === D.ap.peri) out.push({ t: "Najbliżej Słońca", deg: null, k: -2 });
    return out
  }
  function moonSvg(k, size) {
    return '<svg class="moon" viewBox="0 0 20 20" width="' + size + '" height="' + size + '" aria-hidden="true">' + phaseGlyph(k * 90, 10, 10, 8.5, PH_COL) + '</svg>'
  }
  function evIcon(e, size) { return e.k >= 0 ? moonSvg(e.k, size) : e.k === -1 ? '<span class="eq">●</span>' : '<span class="eq">◆</span>' }
  function greg(n) { return gregShort(OrbitCal.dateOf(n)) }
  function gregLong(n) { return OrbitCal.dateOf(n).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }) }

  /* ===== Koło roku (okładka) ===== */
  function wheel(D, size) {
    var c = 100, r1 = 92, r0 = 62, h = "", i;
    function p(a, r) { return [c - r * Math.cos(a * R), c - r * Math.sin(a * R)] }
    for (i = 0; i < 12; i++) {
      var a0 = i * 30, a1 = a0 + 30, A = p(a0, r1), B = p(a1, r1), C = p(a1, r0), E = p(a0, r0), m = p(a0 + 15, (r0 + r1) / 2);
      h += '<path d="M' + A + ' A' + r1 + ' ' + r1 + ' 0 0 1 ' + B + ' L' + C + ' A' + r0 + ' ' + r0 + ' 0 0 0 ' + E + 'Z" fill="' + seasColor(i / 3 | 0) +
        '" fill-opacity="' + [0.45, 0.75, 0.45][i % 3] + '" stroke="#fff" stroke-width="1.2"/>' +
        '<text x="' + m[0].toFixed(1) + '" y="' + (m[1] + 2).toFixed(1) + '" class="wl">' + ["wcz.", "pełna", "późna"][i % 3] + '</text>';
      var t = p(a0, r1 + 5);
      h += '<text x="' + t[0].toFixed(1) + '" y="' + (t[1] + 2).toFixed(1) + '" class="wd">' + a0 + '°</text>'
    }
    for (i = 0; i < 4; i++) { var q = p(i * 90 + 45, r0 - 12); h += '<text x="' + q[0].toFixed(1) + '" y="' + (q[1] + 2.5).toFixed(1) + '" class="ws">' + seasName(i) + '</text>' }
    return '<svg class="wheel" viewBox="-6 -6 212 212" width="' + size + '" height="' + size + '">' + h + '</svg>'
  }

  /* ===== Oś doby 0–360° (planer) ===== */
  function axis(d) {
    var W = 360, x0 = 6, h = "", L = d.light, i;
    function X(a) { return (x0 + a).toFixed(1) }
    if (L === null) h += '<rect x="' + x0 + '" y="9" width="' + W + '" height="7" class="' + (d.polar === "polarDay" ? "aDay" : "aNight") + '"/>';
    else h += '<rect x="' + x0 + '" y="9" width="' + L.toFixed(1) + '" height="7" class="aDay"/><rect x="' + X(L) + '" y="9" width="' + (W - L).toFixed(1) + '" height="7" class="aNight"/>';
    for (i = 0; i <= 360; i += 10) {
      var big = i % 30 === 0;
      h += '<line x1="' + X(i) + '" x2="' + X(i) + '" y1="' + (big ? 6 : 8) + '" y2="16" class="aT' + (big ? " b" : "") + '"/>';
      if (big && i < 360) h += '<text x="' + X(i) + '" y="4.8" class="aL">' + i + '</text>'
    }
    if (L !== null) h += '<text x="' + X(L) + '" y="23" class="aS">zachód ' + Math.round(L) + '°</text>';
    return '<svg class="axis" viewBox="0 0 372 24" preserveAspectRatio="xMinYMin meet">' + h + '</svg>'
  }

  /* ===== Ścienny ===== */
  function wallCover(D) {
    return page("wall cover", '<div class="cvL"><div class="cvK">Kalendarz światła</div><div class="cvY">Rok orbity ' + D.Y + '</div>' +
      '<div class="cvD">' + gregLong(D.s[0]) + ' – ' + gregLong(D.s[12] - 1) + '</div><div class="cvP">' + esc(place) + '</div>' +
      '<p class="cvT">Rok zaczyna się w dniu równonocy marcowej. Każda pora roku to 90° drogi Ziemi wokół Słońca, podzielone na 3 miesiące po 30°. Doba zaczyna się o wschodzie Słońca.</p></div>' +
      '<div class="cvR">' + wheel(D, "118mm") + '</div>')
  }
  function wallMonth(D, k) {
    var n0 = D.s[k], len = D.s[k + 1] - n0, h = "", i, col = seasColor(k / 3 | 0);
    for (i = 0; i < 40; i++) {
      if (i >= len) { h += '<div class="wc empty"></div>'; continue }
      var n = n0 + i, ev = events(D, n), L = D.days[n].light;
      h += '<div class="wc"><div class="wcH"><b>' + (i + 1) + '</b><span>' + greg(n) + '</span></div>' +
        ev.map(function (e) { return '<div class="wcE">' + evIcon(e, "3.2mm") + '<span>' + e.t + (e.deg !== null ? ' ' + degStr(e.deg) : '') + '</span></div>' }).join("") +
        '<div class="wcL">' + (L === null ? "" : Math.round(L) + "°") + '</div></div>'
    }
    return page("wall month", '<header class="wh" style="--sc:' + col + '"><div><b>' + monName(k) + '</b> <span>' + D.Y + '</span></div>' +
      '<div class="whR">' + k * 30 + '–' + (k + 1) * 30 + '° orbity · ' + len + ' dób · ' + greg(n0) + ' – ' + greg(n0 + len - 1) + '</div></header>' +
      '<div class="wg">' + h + '</div>' +
      '<footer class="wf">W rogu dnia: stopnie światła (długość dnia, 360° = doba). Fazy Księżyca i równonoce: stopnie od wschodu. ' + esc(place) + '</footer>')
  }

  /* ===== Planer ===== */
  function plannerCover(D) {
    return page("planner cover", '<div class="pvK">Kalendarz światła</div><div class="pvY">Planer · rok orbity ' + D.Y + '</div>' + wheel(D, "104mm") +
      '<div class="pvD">' + gregLong(D.s[0]) + ' – ' + gregLong(D.s[12] - 1) + '</div><div class="pvP">' + esc(place) + '</div>')
  }
  function howTo(cls) {
    return page(cls + " how", '<h2>Jak czytać ten kalendarz</h2>' +
      '<p><b>Rok orbity</b> zaczyna się w dniu równonocy marcowej (kąt roku 0°). Ziemia okrąża Słońce w 360°: każda pora roku to 90°, a każdy miesiąc to 30° — <i>wczesna</i>, <i>pełna</i> i <i>późna</i> pora roku. Ziemia biegnie nierówno (najszybciej w styczniu, gdy jest najbliżej Słońca), więc miesiące mają od 29 do 32 dni.</p>' +
      '<p><b>Doba</b> zaczyna się o wschodzie Słońca i trwa do następnego wschodu. Dzieli się na 360°: 0° to wschód, a zachód wypada tyle stopni po wschodzie, ile światła ma dzień. 1° to około 4 minuty, 15° to około godzina, 90° to około 6 godzin.</p>' +
      '<p><b>Dzień 1 miesiąca</b> to doba, w której Ziemia przechodzi przez granicę miesiąca (0°, 30°, 60°…). Granica dób zależy od miejsca, dlatego kalendarz jest liczony dla: <b>' + esc(place) + '</b>.</p>' +
      '<p><b>Oznaczenia</b></p><ul class="leg">' +
      '<li>' + moonSvg(0, "4mm") + moonSvg(1, "4mm") + moonSvg(2, "4mm") + moonSvg(3, "4mm") + '<span> nów, I kwadra, pełnia, III kwadra; liczba obok to kąt doby, np. „Pełnia 18°” = 18° po wschodzie</span></li>' +
      '<li><span class="eq">●</span> równonoc albo przesilenie (początek pory roku)</li>' +
      '<li><span class="eq">◆</span> Ziemia najdalej albo najbliżej Słońca</li>' +
      '<li>mała data obok numeru dnia: data w kalendarzu gregoriańskim</li>' +
      (cls === "planner" ? '<li><span class="sw day"></span> dzień <span class="sw night"></span> noc na osi doby 0–360°</li>' : '<li>liczba w rogu dnia: stopnie światła, czyli długość dnia</li>') +
      '</ul>')
  }
  function plannerYear(D) {
    var h = "";
    for (var k = 0; k < 12; k++) {
      var n0 = D.s[k], len = D.s[k + 1] - n0, c = "";
      for (var i = 0; i < len; i++) {
        var f = D.ph[n0 + i];
        c += '<i' + (f ? ' class="f"' : '') + '>' + (i + 1) + (f ? moonSvg(f[0].k, "2.2mm") : '') + '</i>'
      }
      h += '<div class="ym"><b style="color:' + seasColor(k / 3 | 0) + '">' + monName(k) + '</b><small>' + greg(n0) + ' – ' + greg(n0 + len - 1) + '</small><div class="ymG">' + c + '</div></div>'
    }
    return page("planner year", '<h2>Rok orbity ' + D.Y + ' w skrócie</h2><div class="yg">' + h + '</div>')
  }
  function plannerDay(D, n, num) {
    var d = D.days[n], ev = events(D, n);
    return '<div class="pd"><div class="pdH"><b>' + num + '</b><span class="g">' + greg(n) + '</span>' +
      ev.map(function (e) { return '<span class="pdE">' + evIcon(e, "3mm") + e.t + (e.deg !== null ? ' ' + degStr(e.deg) : '') + '</span>' }).join("") +
      '</div>' + axis(d) + '<div class="lines"></div></div>'
  }
  function plannerDecade(D, k, j) {
    var n0 = D.s[k], len = D.s[k + 1] - n0, a = j * 10, b = j === 2 ? len : a + 10, half = a + Math.ceil((b - a) / 2), col = seasColor(k / 3 | 0);
    function side(from, to, left) {
      var h = '<header class="ph" style="--sc:' + col + '"><b>' + monName(k) + '</b><span>' + (left ? D.Y + ' · ' + k * 30 + '–' + (k + 1) * 30 + '°' : 'dni ' + (a + 1) + '–' + b) + '</span></header><div class="pds n' + (to - from) + '">';
      for (var i = from; i < to; i++) h += plannerDay(D, n0 + i, i + 1);
      return page("planner dec " + (left ? "left" : "right"), h + '</div>')
    }
    return side(a, half, true) + side(half, b, false)
  }

  function page(cls, inner) { return '<section class="page ' + cls + '">' + inner + '</section>' }

  /* ===== Składanie ===== */
  function build() {
    if (!place) { $("out").innerHTML = '<p class="ctl">Wybierz miejsce, żeby policzyć doby od wschodu Słońca.</p>'; return }
    var D = yearData(Y), h = "", k, j;
    $("pageSize").textContent = "@page { size: A5 " + (layout === "wall" ? "landscape" : "portrait") + "; margin: 0 }";
    if (layout === "wall") {
      h += wallCover(D);
      for (k = 0; k < 12; k++) h += wallMonth(D, k);
      h += howTo("wall")
    } else {
      h += plannerCover(D) + howTo("planner") + plannerYear(D);
      for (k = 0; k < 12; k++) for (j = 0; j < 3; j++) h += plannerDecade(D, k, j);
      h += page("planner notes", '<h2>Notatki</h2><div class="lines tall"></div>')
    }
    $("out").innerHTML = h;
    document.title = "Kalendarz światła " + Y + " — " + (layout === "wall" ? "ścienny" : "planer") + " — " + place;
    document.body.setAttribute("data-ready", "1")
  }

  /* ===== Ustawienia ===== */
  var qp = { lat: parseFloat(Q.get("lat")), lon: parseFloat(Q.get("lon")), tz: Q.get("tz") || "", name: Q.get("name") || "" };
  // nieznana strefa z adresu: bez strefy (czas słoneczny miejsca) i ostrzeżenie, zamiast cicho brać strefę urządzenia
  if (qp.tz) try { new Intl.DateTimeFormat("en", { timeZone: qp.tz }) } catch (e) {
    var w = document.createElement("p"); w.className = "hint";
    w.textContent = "Nieznana strefa czasowa „" + qp.tz + "”: daty dób liczone według czasu słonecznego miejsca.";
    $("ctl").appendChild(w); qp.tz = ""
  }
  if (validCoords(qp.lat, qp.lon)) Place.apply(qp); else Place.load();
  layout = Q.get("layout") === "planner" ? "planner" : "wall";
  Y = parseInt(Q.get("y"), 10);
  if (!(Y >= 1000 && Y <= 3000)) Y = place ? OrbitCal.date(OrbitCal.dateOf(sunDay(Date.now()))).year : new Date().getFullYear();
  $("cY").value = Y; $("cL").value = layout; $("cPlace").textContent = place || "nie wybrano";
  if (!place) $("cPlaceForm").hidden = false;
  Place.form($("cPlaceForm"), function (p) { Place.save(p); $("cPlace").textContent = place; $("cPlaceForm").hidden = true; build() });
  $("cPlaceBtn").onclick = function () { $("cPlaceForm").hidden = !$("cPlaceForm").hidden };
  $("cGo").onclick = function () {
    var y = parseInt($("cY").value, 10);
    if (!(y >= 1000 && y <= 3000)) { $("cY").focus(); return }
    Y = y; layout = $("cL").value; build()
  };
  $("cL").onchange = $("cGo").onclick;
  $("cPrint").onclick = function () { window.print() };
  build()
})();
