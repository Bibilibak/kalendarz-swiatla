/* ===== Aplikacja: doba w stopniach od wschodu, miesiące kalendarza orbity, wydarzenia =====
   Doba n (numer dnia, jak w js/orbit.js) trwa od wschodu do następnego wschodu i ma 360°.
   Wydarzenie: { id, n: pierwsza doba, deg: początek (0–360°), len: czas trwania (°), name, note, rep }.
   rep: "" jednorazowe, "d" każdej doby, "10" co 10 dób, "m" ten sam dzień miesiąca orbity, "y" ten sam miesiąc i dzień. */
(function () {
  function $(i) { return document.getElementById(i) }
  var EV_KEY = "ks-events", VIEW_KEY = "ks-view";
  var evs = [], sel = 0, today = 0, mY = 0, mM = 0, edit = null, view = "day";

  /* ===== Zapis wydarzeń ===== */
  function validEv(e) {
    // n: doby z lat 1000–3000, jak w generatorze druku (dalsze daty psują obliczenia stref czasowych)
    return e && typeof e.name === "string" && e.name.trim() && typeof e.n === "number" && e.n % 1 === 0 && e.n >= N_MIN && e.n <= N_MAX &&
      typeof e.deg === "number" && e.deg >= 0 && e.deg < 360 && (!e.len || typeof e.len === "number" && e.len >= 0 && e.len <= 360) &&
      ["", "d", "10", "m", "y"].indexOf(e.rep || "") >= 0
  }
  var N_MIN = Math.round(Date.UTC(1000, 0, 1) / 864e5), N_MAX = Math.round(Date.UTC(3000, 11, 31) / 864e5);
  function clean(e) {
    return { id: typeof e.id === "string" && e.id ? e.id : newId(), n: e.n, deg: e.deg, len: e.len || 0, name: e.name.slice(0, 120),
      note: typeof e.note === "string" ? e.note.slice(0, 2000) : "", rep: e.rep || "" }
  }
  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7) }
  function loadEv() {
    try { var a = JSON.parse(localStorage.getItem(EV_KEY) || "[]"); if (Array.isArray(a)) evs = a.filter(validEv).map(clean) } catch (e) {}
  }
  function saveEv() { try { localStorage.setItem(EV_KEY, JSON.stringify(evs)); $("dMsg").textContent = "" } catch (e) { alertMsg("Nie udało się zapisać (pamięć przeglądarki jest pełna albo zablokowana). Zapisz kopię do pliku w Ustawieniach.", true) } }
  // komunikat w Ustawieniach i pod formularzem doby (błąd zapisu musi być widoczny tam, gdzie jesteś)
  function alertMsg(t, err) { $("sMsg").textContent = t; if (err) $("dMsg").textContent = t }

  // czy wydarzenie e wypada w dobie n
  function occurs(e, n) {
    if (n < e.n) return false;
    if (!e.rep) return n === e.n;
    if (e.rep === "d") return true;
    if (e.rep === "10") return (n - e.n) % 10 === 0;
    var a = OrbitCal.date(OrbitCal.dateOf(e.n)), b = OrbitCal.date(OrbitCal.dateOf(n));
    // dzień 31 albo 32 w krótszym miesiącu: ostatni dzień miesiąca (miesiące orbity mają 29–32 dni)
    return Math.min(a.day, b.len) === b.day && (e.rep === "m" || a.month === b.month)
  }
  function evsOn(n) { return evs.filter(function (e) { return occurs(e, n) }).sort(function (a, b) { return a.deg - b.deg }) }

  /* ===== Nagłówek ===== */
  function orbitTxt(n) { var o = OrbitCal.date(OrbitCal.dateOf(n)); return monName(o.month) + " · dzień " + o.day }
  function header() {
    var d = OrbitCal.dateOf(sel), o = OrbitCal.date(d);
    $("oDate").textContent = monName(o.month) + " · dzień " + o.day;
    $("oSub").textContent = "Rok orbity " + o.year + " · doba " + o.yday + " z " + o.ylen + " · " +
      d.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
    $("placeBtn").textContent = "📍 " + place; $("placeBtn").hidden = false;
    $("sPlace").textContent = place
  }

  /* ===== Tarcza doby ===== */
  var cx = 180, cy = 180, r = 132;
  function pt(t, rr) { return [cx - rr * Math.cos(t * R), cy - rr * Math.sin(t * R)] }
  function arc(a0, a1, rr) {
    var p = pt(a0, rr), q = pt(Math.min(a1, a0 + 359.99), rr);
    return "M" + p[0].toFixed(2) + " " + p[1].toFixed(2) + " A" + rr + " " + rr + " 0 " + (a1 - a0 > 180 ? 1 : 0) + " 1 " + q[0].toFixed(2) + " " + q[1].toFixed(2)
  }
  var info = null, evNow = [];
  function drawDial() {
    info = dayInfo(sel); evNow = evsOn(sel);
    var L = info.light, h = "", i, p, q, noon = degOf(info, sunNoon(sel));
    // pierścień: dzień i noc
    if (info.polar === "polarDay") h += '<circle cx="180" cy="180" r="' + r + '" class="ringDay"/>';
    else if (info.polar === "polarNight" || L === null) h += '<circle cx="180" cy="180" r="' + r + '" class="ringNight"/>';
    else h += '<path d="' + arc(L, 360, r) + '" class="ringNight"/><path d="' + arc(0, L, r) + '" class="ringDay"/>';
    // podziałka co 10°, opisy co 30°
    for (i = 0; i < 360; i += 10) {
      p = pt(i, r - 14); q = pt(i, r - (i % 30 ? 20 : 26));
      h += '<line x1="' + p[0].toFixed(1) + '" y1="' + p[1].toFixed(1) + '" x2="' + q[0].toFixed(1) + '" y2="' + q[1].toFixed(1) + '" class="tick' + (i % 30 ? "" : " big") + '"/>';
      if (!(i % 30)) { q = pt(i, r - 38); h += '<text x="' + q[0].toFixed(1) + '" y="' + (q[1] + 4).toFixed(1) + '" class="tl">' + i + '°</text>' }
    }
    // wydarzenia: łuki czasu trwania i kropki
    evNow.forEach(function (e, k) {
      if (e.len > 0) h += '<path d="' + arc(e.deg, e.deg + e.len, r + 13) + '" class="evArc"/>';
      p = pt(e.deg, r + 13);
      h += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="5" class="evDot"><title>' + esc(degStr(e.deg, true) + " " + e.name) + '</title></circle>'
    });
    // znaczniki: wschód, górowanie, zachód
    if (!info.polar && L !== null) {   // koniec nocy polarnej (noDay): wschód bez zachodu
      h += mark(0, "wschód") + mark(L, "zachód");
    }
    h += mark(noon, "górowanie", true);
    // wskazówka Słońca (tylko dziś) i środek
    h += '<g id="hand"></g><text x="180" y="172" class="cBig" id="cBig"></text><text x="180" y="194" class="cSmall" id="cSmall"></text>' +
      '<text x="180" y="212" class="cSmall" id="cSmall2"></text>';
    $("dial").innerHTML = h;
    tickDial()
  }
  function mark(a, label, dash) {
    var p = pt(a, r + 2), q = pt(a, r - 12);
    return '<line x1="' + p[0].toFixed(1) + '" y1="' + p[1].toFixed(1) + '" x2="' + q[0].toFixed(1) + '" y2="' + q[1].toFixed(1) + '" class="mk' + (dash ? " dash" : "") + '"><title>' + label + " " + degStr(a) + '</title></line>'
  }
  // co sekundę: wskazówka i tekst w środku
  function tickDial() {
    if (!info) return;
    var now = Date.now(), isToday = now >= info.a && now < info.b, hand = $("hand");
    if (isToday) {
      var d = degOf(info, now), p = pt(d, r - 4), next = evNow.filter(function (e) { return e.deg > d })[0],
        cur = evNow.filter(function (e) { return e.deg <= d && e.deg + e.len > d });
      hand.innerHTML = '<line x1="180" y1="180" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '" class="hand"/><circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="7" class="sun"/>';
      $("cBig").textContent = degStr(d, true);
      $("cSmall").textContent = cur.length ? "teraz: " + cut(cur[0].name) : next ? "za " + degStr(next.deg - d) + ": " + cut(next.name) : "";
      $("cSmall2").textContent = info.light !== null && d < info.light ? "do zachodu " + degStr(info.light - d) : info.light !== null ? "do wschodu " + degStr(360 - d) : ""
    } else {
      hand.innerHTML = "";
      $("cBig").textContent = info.light !== null ? Math.round(info.light) + "° światła" : info.polar === "polarDay" ? "dzień polarny" : "noc polarna";
      $("cSmall").textContent = sel > today ? "za " + (sel - today) + " " + doby(sel - today) : (today - sel) + " " + doby(today - sel) + " temu";
      $("cSmall2").textContent = ""
    }
  }
  function doby(k) { return k === 1 ? "dobę" : k % 10 >= 2 && k % 10 <= 4 && (k % 100 < 10 || k % 100 >= 20) ? "doby" : "dób" }
  function cut(s) { return s.length > 22 ? s.slice(0, 21) + "…" : s }

  // pod tarczą: światło, Księżyc, fazy w tej dobie
  function facts() {
    var noonMs = sunNoon(sel), ph = elong(noonMs), il = Math.round((1 - Math.cos(ph * R)) / 2 * 100),
      fz = phasesBetween(sel, sel)[sel] || [], ap = OrbitCal.apsisOn(sel), o = OrbitCal.date(OrbitCal.dateOf(sel)), h = "";
    h += '<div><b>Światło dnia:</b> ' + (info.light !== null ? degStr(info.light, true) : info.polar === "polarDay" ? "dzień polarny" : "noc polarna") + '</div>';
    h += '<div class="moonL"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">' + phaseGlyph(ph, 10, 10, 8) + '</svg> ' +
      ["Nów", "Sierp przybywający", "I kwadra", "Garb przybywający", "Pełnia", "Garb ubywający", "III kwadra", "Sierp ubywający"][phaseIdx(ph)] + ' · ' + il + '%</div>';
    fz.forEach(function (f) { h += '<div><b>' + PHASE_NAMES[f.k] + ':</b> ' + degStr(degOf(info, f.ms)) + ' od wschodu</div>' });
    if (o.day === 1) {
      var k = o.month, cross = OrbitCal.year(o.year).b[k];
      h += '<div><b>' + (k % 3 ? "Początek miesiąca" : k % 6 ? "Przesilenie" : "Równonoc") + ':</b> ' + degStr(degOf(info, cross)) + ' od wschodu</div>'
    }
    if (ap) h += '<div><b>' + (ap.far ? "Ziemia najdalej od Słońca" : "Ziemia najbliżej Słońca") + ':</b> ' + degStr(degOf(info, ap.ms)) + '</div>';
    $("facts").innerHTML = h
  }

  /* ===== Lista i formularz wydarzeń ===== */
  var REP_T = { "": "", d: "każdej doby", "10": "co 10 dób", m: "co miesiąc", y: "co rok" };
  function list() {
    var ul = $("evList");
    ul.innerHTML = evNow.length ? "" : '<li class="empty">Brak wydarzeń. Dodaj pierwsze poniżej.</li>';
    evNow.forEach(function (e) {
      var li = document.createElement("li"), b = document.createElement("button");
      b.type = "button";
      b.innerHTML = '<span class="evDeg">' + degStr(e.deg, true) + (e.len ? '<small> – ' + degStr(e.deg + e.len, true) + '</small>' : '') + '</span>' +
        '<span class="evName">' + esc(e.name) + (e.rep ? ' <small>↻ ' + REP_T[e.rep] + '</small>' : '') +
        (e.note ? '<small class="evNote">' + esc(e.note) + '</small>' : '') + '</span>';
      b.onclick = function () { startEdit(e) };
      if (edit && edit.id === e.id) li.className = "editing";
      li.appendChild(b); ul.appendChild(li)
    })
  }
  function startEdit(e) {
    edit = e;
    $("fTitle").textContent = "Zmień wydarzenie";
    $("fName").value = e.name;
    $("fDeg").value = Math.floor(e.deg); $("fMin").value = Math.floor((e.deg % 1) * 60 + 1e-6) || "";
    $("fLen").value = e.len || ""; $("fRep").value = e.rep; $("fNote").value = e.note;
    $("fSave").textContent = "Zapisz"; $("fCancel").hidden = $("fDel").hidden = false;
    list(); $("fName").focus()
  }
  function resetForm() {
    edit = null; $("evForm").reset();
    $("fTitle").textContent = "Nowe wydarzenie"; $("fSave").textContent = "Dodaj";
    $("fCancel").hidden = $("fDel").hidden = true; $("fConvOut").textContent = "";
    list()
  }
  $("evForm").onsubmit = function (ev) {
    ev.preventDefault();
    var deg = (parseInt($("fDeg").value, 10) || 0) + (parseInt($("fMin").value, 10) || 0) / 60,
      e = { name: $("fName").value.trim(), deg: Math.min(359.99, Math.max(0, deg)), len: Math.max(0, Math.min(360, parseFloat($("fLen").value) || 0)),
        rep: $("fRep").value, note: $("fNote").value.trim() };
    if (!e.name) return;
    if (edit) {
      // przy powtarzanym wydarzeniu zmiana dotyczy całej serii; pierwsza doba zostaje
      Object.assign(edit, e)
    } else { e.id = newId(); e.n = sel; evs.push(e) }
    saveEv(); resetForm(); renderDay()
  };
  $("fCancel").onclick = resetForm;
  $("fDel").onclick = function () {
    if (!edit) return;
    evs = evs.filter(function (e) { return e.id !== edit.id });
    saveEv(); resetForm(); renderDay()
  };
  // kliknięcie w tarczę: kąt do formularza
  $("dial").onclick = function (ev) {
    var b = this.getBoundingClientRect(), x = (ev.clientX - b.left) / b.width * 360 - cx, y = (ev.clientY - b.top) / b.height * 360 - cy;
    if (Math.hypot(x, y) < 40) return;
    var a = (Math.atan2(-y, -x) / R + 360) % 360, d = Math.round(a);
    $("fDeg").value = d % 360; $("fMin").value = "";
    $("fName").focus()
  };
  // godzina zegara -> kąt w wybranej dobie (godzina w strefie miejsca; bez strefy: strefa urządzenia)
  $("fConv").onclick = function () {
    var v = $("fClock").value; if (!v || !info) return;
    var hh = +v.slice(0, 2), mm = +v.slice(3, 5), d = OrbitCal.dateOf(sel), ms;
    // doba może zacząć się poprzedniego dnia kalendarzowego (noc polarna, strefa daleko od czasu słonecznego)
    for (var k = -1; k < 2; k++) {
      ms = tz ? zoned(d.getFullYear(), d.getMonth(), d.getDate() + k, hh, mm) : new Date(d.getFullYear(), d.getMonth(), d.getDate() + k, hh, mm).getTime();
      if (ms >= info.a && ms < info.b) break
    }
    if (ms < info.a || ms >= info.b) { $("fConvOut").textContent = "Ta godzina nie wypada w tej dobie."; return }
    var g = degOf(info, ms);
    $("fDeg").value = Math.floor(g); $("fMin").value = Math.floor((g % 1) * 60);
    $("fConvOut").textContent = v + " = " + degStr(g, true) + " od wschodu" + (k > 0 ? " (następnego dnia rano)" : k < 0 ? " (dzień wcześniej)" : "")
  };

  function renderDay() { header(); drawDial(); facts(); list() }

  /* ===== Miesiąc ===== */
  function renderMonth() {
    var s = OrbitCal.starts(mY), n0 = s[mM], len = s[mM + 1] - n0, ph = phasesBetween(n0, n0 + len - 1),
      ap = OrbitCal.apsisDays(mY), g = $("mGrid"), h = "", upcoming = [];
    $("mName").textContent = monName(mM) + " " + mY;
    $("mName").style.color = seasColor(mM / 3 | 0);
    $("mSub").textContent = (mM * 30) + "–" + (mM + 1) * 30 + "° orbity · " + len + " dób · " +
      gregShort(OrbitCal.dateOf(n0)) + " – " + gregShort(OrbitCal.dateOf(n0 + len - 1));
    for (var i = 0; i < len; i++) {
      var n = n0 + i, d = OrbitCal.dateOf(n), es = evsOn(n), f = ph[n] || [], cls = "md" + (n === today ? " today" : "") + (n === sel ? " sel" : "") + (n < today ? " past" : "");
      h += '<button type="button" class="' + cls + '" data-n="' + n + '"><b>' + (i + 1) + '</b><small>' + gregShort(d) + '</small>' +
        (f.length ? '<svg viewBox="0 0 20 20" class="mMoon" aria-label="' + PHASE_NAMES[f[0].k] + '">' + phaseGlyph(f[0].k * 90, 10, 10, 8) + '</svg>' : '') +
        (n === ap.aph || n === ap.peri ? '<i class="ap" title="' + (n === ap.aph ? "najdalej od Słońca" : "najbliżej Słońca") + '">◆</i>' : '') +
        (es.length ? '<span class="dots">' + es.slice(0, 4).map(function () { return "•" }).join("") + '</span>' : '') + '</button>';
      es.forEach(function (e) { if (n >= today && upcoming.length < 40) upcoming.push({ n: n, e: e, day: i + 1 }) })
    }
    g.innerHTML = h;
    [].forEach.call(g.querySelectorAll(".md"), function (b) { b.onclick = function () { sel = +b.getAttribute("data-n"); resetForm(); show("day") } });
    $("mList").innerHTML = upcoming.length ? upcoming.map(function (u) {
      return '<li><b>Dzień ' + u.day + '</b> ' + degStr(u.e.deg) + ' · ' + esc(u.e.name) + '</li>'
    }).join("") : '<li class="empty">' + (n0 + len <= today ? "" : "Brak nadchodzących wydarzeń w tym miesiącu.") + '</li>'
  }
  function monthOf(n) { var o = OrbitCal.date(OrbitCal.dateOf(n)); mY = o.year; mM = o.month }
  $("mPrev").onclick = function () { if (--mM < 0) { mM = 11; mY-- } renderMonth() };
  $("mNext").onclick = function () { if (++mM > 11) { mM = 0; mY++ } renderMonth() };

  /* ===== Widoki ===== */
  function show(v) {
    if (!place) { askPlace(); return }   // bez miejsca nie ma dób
    view = v;
    [].forEach.call(document.querySelectorAll(".tabs [role=tab]"), function (b) { b.setAttribute("aria-selected", b.getAttribute("data-v") === v) });
    $("vDay").hidden = v !== "day"; $("vMonth").hidden = v !== "month"; $("vSet").hidden = v !== "set";
    if (v === "day") renderDay();
    else header();
    if (v === "month") { monthOf(sel); renderMonth() }
    try { localStorage.setItem(VIEW_KEY, v) } catch (e) {}
  }
  [].forEach.call(document.querySelectorAll(".tabs [role=tab]"), function (b) { b.onclick = function () { show(b.getAttribute("data-v")) } });
  $("dPrev").onclick = function () { sel--; resetForm(); renderDay() };
  $("dNext").onclick = function () { sel++; resetForm(); renderDay() };
  $("dToday").onclick = function () { sel = today; resetForm(); renderDay() };

  /* ===== Kopia zapasowa ===== */
  $("sExport").onclick = function () {
    var data = { app: "kalendarz-swiatla", v: 1, saved: new Date().toISOString(), place: Place.current(), events: evs },
      a = document.createElement("a"), d = OrbitCal.date(OrbitCal.dateOf(today));
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: "application/json" }));
    a.download = "kalendarz-swiatla-" + d.year + "-" + (d.month + 1) + "-" + d.day + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href) }, 1000);
    alertMsg("Zapisano " + evs.length + " wydarzeń.")
  };
  $("sImport").onchange = function () {
    var f = this.files[0], inp = this; if (!f) return;
    f.text().then(function (txt) {
      var d = JSON.parse(txt), list = Array.isArray(d) ? d : d && d.events;
      if (!Array.isArray(list)) throw new Error("brak listy wydarzeń");
      // Map, nie zwykły obiekt: id "__proto__" czy "toString" z pliku nie może trafić w prototyp
      var ok = list.filter(validEv).map(clean), ids = new Map(), added = 0;
      evs.forEach(function (e) { ids.set(e.id, e) });
      ok.forEach(function (e) {   // to samo id: nadpisz, nowe: dodaj (także powtórzone id w jednym pliku trafia tylko raz)
        if (ids.has(e.id)) Object.assign(ids.get(e.id), e); else { evs.push(e); ids.set(e.id, e); added++ }
      });
      saveEv();
      alertMsg("Wczytano " + ok.length + " wydarzeń (nowych: " + added + ")" + (ok.length < list.length ? ", pominięto błędnych: " + (list.length - ok.length) : "") + ".");
      if (view === "day") renderDay()
    }).catch(function (e) { alertMsg("Nie udało się wczytać pliku: " + e.message) })
      .then(function () { inp.value = "" })
  };

  /* ===== Miejsce ===== */
  function setPlace(p) {
    Place.save(p);
    if ($("placeDlg").open) $("placeDlg").close();
    var wasToday = sel === today;
    today = sunDay(Date.now()); if (wasToday || !sel) sel = today;
    show(view)
  }
  Place.form($("sPlaceForm"), setPlace);
  Place.form($("dlgForm"), setPlace);
  $("placeBtn").onclick = function () { $("dlgClose").hidden = false; $("placeDlg").showModal() };
  $("dlgClose").onclick = function () { $("placeDlg").close() };
  // Bez miejsca okno wraca: przeglądarki pozwalają zamknąć je Esc albo gestem „wstecz”, mimo preventDefault
  function askPlace() { $("dlgClose").hidden = true; if (!$("placeDlg").open) $("placeDlg").showModal() }
  $("placeDlg").addEventListener("cancel", function (e) { if (!place) e.preventDefault() });
  $("placeDlg").addEventListener("close", function () { if (!place) setTimeout(askPlace, 0) });

  /* ===== Start ===== */
  loadEv();
  try { var v0 = localStorage.getItem(VIEW_KEY); if (v0 === "month" || v0 === "set") view = v0 } catch (e) {}
  if (Place.load()) { today = sel = sunDay(Date.now()); show(view) }
  else askPlace();

  // co sekundę wskazówka; o wschodzie Słońca zaczyna się nowa doba
  setInterval(function () {
    if (!place) return;
    var t = sunDay(Date.now());
    if (t !== today) {
      // wybrana doba idzie za „dziś”, chyba że właśnie wpisujesz albo zmieniasz wydarzenie
      if (sel === today && !edit && !$("fName").value) sel = t;
      today = t;
      if (view === "month") { renderMonth(); header() }   // zostaje miesiąc, który oglądasz
      else show(view)
    }
    else if (view === "day") tickDial()
  }, 1000);

  if ("serviceWorker" in navigator && /^https?:/.test(location.protocol)) navigator.serviceWorker.register("sw.js").catch(function () {})
})();
