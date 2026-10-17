/* ===== Obliczenia Słońca i Księżyca =====
   Skopiowane z projektu daylight-clock (js/main.js). Miejsce: lat, lon (stopnie) i tz (strefa IANA, pusta =
   czas słoneczny miejsca). Ustawia je js/place.js; do tego czasu place jest puste i nic nie liczymy. */
var R = Math.PI / 180, lat = 0, lon = 0, tz = "", place = "";

function validCoords(a, b) {   // tylko prawdziwe liczby (tekst "21" z uszkodzonego localStorage psułby obliczenia)
  return typeof a === "number" && typeof b === "number" && isFinite(a) && isFinite(b) && a >= -90 && a <= 90 && b >= -180 && b <= 180
}


/* ===== Strefa czasowa miejsca - tylko do wydarzeń, niczego nie wyświetla =====
   Godzina wydarzenia ("08:00") znaczy godzinę zegara w wybranym mieście, a nie w Twoim
   urządzeniu. tz = nazwa strefy IANA z wyszukiwarki miast; pusta = strefa urządzenia. */
var fmtCache = {};
function tzFmt() {
  if (!fmtCache[tz]) {
    var o = { hour12: false, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" };
    try { if (tz) o.timeZone = tz; fmtCache[tz] = new Intl.DateTimeFormat("en-GB", o) }
    catch (e) { delete o.timeZone; fmtCache[tz] = new Intl.DateTimeFormat("en-GB", o) }   // nieznana strefa -> urządzenie
  }
  return fmtCache[tz]
}
function tzParts(ms) {   // data i godzina w mieście dla chwili ms (UTC)
  var o = {};
  tzFmt().formatToParts(new Date(ms)).forEach(function (p) { o[p.type] = +p.value });
  if (o.hour === 24) o.hour = 0;
  return o
}
function tzOffset(ms) {
  var o = tzParts(ms);
  return Date.UTC(o.year, o.month - 1, o.day, o.hour, o.minute, o.second) - Math.floor(ms / 1000) * 1000
}
function zoned(y, mo, d, h, mi) {   // "dzień, godzina:minuta według zegara miasta" -> chwila (ms UTC)
  var g = Date.UTC(y, mo, d, h, mi), t1 = g - tzOffset(g);
  return g - tzOffset(t1)
}


function normDeg(x) { return ((x + 180) % 360 + 360) % 360 - 180 }   // do zakresu -180..180

// gam: kąt ułamkowy roku (w radianach)
function gam(d) {
  var y = d.getUTCFullYear(), n = Math.floor((d - Date.UTC(y, 0, 0)) / 864e5),
    yl = (Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1)) / 864e5;   // 365 albo 366 dni (NOAA: w roku przestępnym 366)
  return 2 * Math.PI / yl * (n - 1 + (d.getUTCHours() - 12) / 24)
}

// sol: równanie czasu (eq, minuty) i deklinacja Słońca (dc, radiany)
function sol(g) {
  return {
    eq: 229.18 * (.000075 + .001868 * Math.cos(g) - .032077 * Math.sin(g) - .014615 * Math.cos(2 * g) - .040849 * Math.sin(2 * g)),
    dc: .006918 - .399912 * Math.cos(g) + .070257 * Math.sin(g) - .006758 * Math.cos(2 * g) + .000907 * Math.sin(2 * g) - .002697 * Math.cos(3 * g) + .00148 * Math.sin(3 * g)
  }
}

// times: wschód i zachód Słońca (ms UTC) dla danego dnia i położenia
function times(day) {
  var m0 = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()),
    at = function (ms) { return sol(gam(new Date(ms))) },
    haOf = function (S) {
      var c = Math.cos(90.833 * R) / (Math.cos(lat * R) * Math.cos(S.dc)) - Math.tan(lat * R) * Math.tan(S.dc);
      return c > 1 || c < -1 ? null : Math.acos(c) / R
    },
    S0 = at(m0 + 12 * 36e5), ha0 = haOf(S0);
  if (ha0 === null) return null;
  var Sn = at(m0 + (720 - 4 * lon - S0.eq) * 6e4),
    noon = m0 + (720 - 4 * lon - Sn.eq) * 6e4,                     // rzeczywiste górowanie: przejście Słońca przez południk
    Sr = at(noon - ha0 * 4 * 6e4), Ss = at(noon + ha0 * 4 * 6e4),  // deklinacja i równanie czasu w chwili wschodu i zachodu
    hr = haOf(Sr), hs = haOf(Ss);
  if (hr === null || hs === null) return null;
  return { rise: m0 + (720 - 4 * (lon + hr) - Sr.eq) * 6e4, set: m0 + (720 - 4 * (lon - hs) - Ss.eq) * 6e4, noon: noon }
}

// górowanie Słońca (ms UTC) - istnieje zawsze, także w dzień i noc polarną
function solarNoon(day) {
  var m0 = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()),
    S = sol(gam(new Date(m0 + (720 - 4 * lon) * 6e4)));
  return m0 + (720 - 4 * lon - S.eq) * 6e4
}

// Dzień / noc polarna: nie ma wschodu, więc doba na tarczy biegnie od słonecznej północy do następnej
// (północ = połowa drogi między kolejnymi górowaniami). Wschód i zachód "leżą" na początku cyklu.
// Gdy Słońce nie wschodzi lub nie zachodzi: dzień polarny, jeśli Słońce jest po stronie naszej półkuli
// (albo przy biegunie nawet o północy stoi nad horyzontem). Sama wysokość w górowaniu myliła się
// w pierwszym/ostatnim dniu nocy polarnej, gdy Słońce ledwo nie dochodzi do horyzontu.
function sunAlwaysUp(dc) { return lat * dc > 0 || Math.abs(lat + dc) - 90 > -0.833 }

function polarCycle(now) {
  var n = [];   // ±3 dni: wystarcza też, gdy strefa urządzenia i miasta różnią się o ponad dobę
  for (var o = -3; o <= 3; o++) n.push(solarNoon(new Date(now.getFullYear(), now.getMonth(), now.getDate() + o)));
  for (var i = 0; i < 5; i++) {
    var a = (n[i] + n[i + 1]) / 2, b = (n[i + 1] + n[i + 2]) / 2;
    if (now >= a && now < b) {
      // deklinacja na obu końcach cyklu: przy samym biegunie Słońce może w tej dobie przejść przez równik
      var up = sunAlwaysUp(sol(gam(new Date(a))).dc / R) || sunAlwaysUp(sol(gam(new Date(b))).dc / R);
      return { a: a, b: b, noon: n[i + 1], rise: a, set: up ? b : a, polar: up ? "polarDay" : "polarNight" }
    }
  }
  return null
}

// Doba tarczy, w której leży chwila now: od wschodu do następnego wschodu, a w dzień / noc polarną od słonecznej północy.
// Wschody z pięciu kolejnych dni; szukamy cyklu [wschód, następny wschód), w którym leży "now".
// (Działa dla każdego miasta, także gdy data u Ciebie i w mieście się różni.) Zwraca { a, b, set, rise, noon, … } albo null.
function dayCycle(now) {
  var days = [], noons = [], cyc = null, A, B;
  for (var o = -2; o <= 2; o++) {
    var dd0 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + o);
    days.push(times(dd0)); noons.push(solarNoon(dd0))
  }
  for (var i = 0; i < 4 && !cyc; i++) {
    A = days[i]; B = days[i + 1];
    if (A && B && now >= A.rise && now < B.rise) cyc = { a: A.rise, b: B.rise, set: A.set, rise: A.rise, noon: A.noon }
    // Dni przejściowe (sąsiedni dzień bez wschodu, np. ostatni dzień przed nocą polarną): brakujący wschód
    // szacujemy o jedną dobę słoneczną od znanego, żeby tarcza nie przeskakiwała na tryb polarny za wcześnie.
    // Gdy brakuje tylko jednego dnia, oba szacunki stykają się w połowie między znanymi wschodami (bez dziury).
    else if (A && !B) {
      var bEnd = i + 2 < days.length && days[i + 2] ? (A.rise + days[i + 2].rise) / 2 : A.rise + (noons[i + 1] - noons[i]);
      if (now >= A.rise && now < bEnd) cyc = { a: A.rise, b: bEnd, set: A.set, rise: A.rise, noon: A.noon }
    } else if (!A && B) {
      var a0 = i > 0 && days[i - 1] ? (days[i - 1].rise + B.rise) / 2 : B.rise - (noons[i + 1] - noons[i]);
      if (now >= a0 && now < B.rise) {
        var prevUp = sunAlwaysUp(sol(gam(new Date(noons[i]))).dc / R),               // poprzedni dzień był polarnym dniem?
          set0 = prevUp ? Math.max(a0, Math.min(B.rise, noons[i] + (B.set - B.noon))) : a0;   // wtedy wieczorny zachód symetrycznie do górowania
        cyc = { a: a0, b: B.rise, set: set0, rise: a0, noon: noons[i], noDay: !prevUp }   // noDay: koniec nocy polarnej, bez zachodu
      }
    }
  }
  return cyc || polarCycle(now)
}
// numer doby tarczy (od wschodu do wschodu), w której leży chwila ms: dzień kalendarzowy jej górowania w strefie miasta
function sunDay(ms) { var c = dayCycle(new Date(ms)); return dayNum(c ? c.noon : ms) }
// numer daty chwili ms: w strefie miasta, a bez strefy (współrzędne wpisane ręcznie albo z lokalizacji) według
// czasu słonecznego miejsca, a nie strefy urządzenia (inaczej przy zmianie czasu doba mogłaby zniknąć albo się zdublować)
function dayNum(ms) { return tz ? localDay(ms) : Math.floor((ms + lon * 24e4) / 864e5) }
// górowanie w dobie n. Górowanie na dacie UTC n nie zawsze wypada w dacie lokalnej n (np. Samoa, UTC+13), więc poprawiamy o różnicę.
function sunNoon(n) {
  function at(m) { var x = new Date(m * 864e5); return solarNoon(new Date(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate())) }
  var ms = at(n), k = n - dayNum(ms);
  return k ? at(n + k) : ms
}
// chwila wschodu, od której zaczyna się doba n (w dzień / noc polarną: słoneczna północ); zaokrąglona w górę do ms,
// żeby sunDay(sunDayStart(n)) === n (new Date() obcina ułamki ms)
function sunDayStart(n) { var c = dayCycle(new Date(sunNoon(n))); return c ? Math.ceil(c.a) : n * 864e5 }


// faza Księżyca = o ile jego długość ekliptyczna wyprzedza Słońce (0 nów, 90 pierwsza kwadra, 180 pełnia, 270 ostatnia)
function sunLonDeg(ms) {   // długość ekliptyczna Słońca w stopniach (0° = równonoc wiosenna, na dany rok)
  // peryhelium liczone od równonocy danej daty (precesja ok. 1,7° na stulecie), -0,0057° = aberracja
  var d = ms / 864e5 - 10957.5, Ms = R * (357.5291 + 0.98560028 * d);
  return (((Ms + R * (1.9148 * Math.sin(Ms) + 0.02 * Math.sin(2 * Ms)) + R * (102.9372 + 4.70935e-5 * d - 0.0057) + Math.PI) / R) % 360 + 360) % 360
}
function elong(ms) {
  var d = ms / 864e5 - 10957.5, M = R * (134.963 + 13.064993 * d), l = R * (218.316 + 13.176396 * d) + R * 6.289 * Math.sin(M);
  return ((l / R - sunLonDeg(ms)) % 360 + 360) % 360
}
// moment nowiu: poprawiamy przybliżenie kilkoma krokami (Księżyc oddala się od Słońca o ok. 12,19° na dobę)
function newMoonNear(ms) { for (var i = 0; i < 4; i++) ms -= normDeg(elong(ms)) / 12.19 * 864e5; return ms }
// numer dnia kalendarzowego (od północy do północy) w strefie czasowej wybranego miasta
function localDay(ms) { var o = tzParts(ms); return Math.round(Date.UTC(o.year, o.month - 1, o.day) / 864e5) }
/* Dni cyklu to doby tarczy, OD WSCHODU do wschodu (jak w kalendarzu orbity): dzień 1 = doba, w której wypada nów;
   cykl kończy się dobą przed dobą następnego nowiu, więc ma 29 albo 30 pełnych dni. Wynik zależy od miejsca (wschód).
   d0: numer doby dnia 1 (sunDay); elapsed/length: dokładny czas od chwili nowiu i długość cyklu (doby). */
function lunarCycle(now) {
  var t = now.getTime(), last = newMoonNear(t - elong(t) / 12.19 * 864e5);
  if (last > t) last = newMoonNear(last - 29.53 * 864e5);
  var next = newMoonNear(last + 29.53 * 864e5);
  if (next <= t) { last = next; next = newMoonNear(last + 29.53 * 864e5) }
  var n = sunDay(t);
  if (sunDay(next) <= n) { last = next; next = newMoonNear(last + 29.53 * 864e5) }   // dziś jest doba nowiu: od wschodu nowy cykl
  var d0 = sunDay(last);
  return { day: n - d0 + 1, days: sunDay(next) - d0, d0: d0,
    elapsed: (t - last) / 864e5, length: (next - last) / 864e5, last: last, next: next }
}
// moment fazy k (1 = I kwadra, 2 = pełnia, 3 = III kwadra) w cyklu zaczętym nowiem "last"
function quarterAt(last, len, k) {
  var ms = last + len * k / 4 * 864e5;
  for (var i = 0; i < 4; i++) ms -= normDeg(elong(ms) - 90 * k) / 12.19 * 864e5;
  return ms
}
function phaseIdx(p) {   // 0 nów, 1 sierp przyb., 2 I kwadra, 3 garb przyb., 4 pełnia, 5 garb ubyw., 6 III kwadra, 7 sierp ubyw.
  return p < 12 || p >= 348 ? 0 : p < 78 ? 1 : p < 102 ? 2 : p < 168 ? 3 : p < 192 ? 4 : p < 258 ? 5 : p < 282 ? 6 : 7
}
function moonTilt() {   // obrót ikony Księżyca: północ 0° (jasna strona przybywającego po prawej), równik 90° ("łódka"), południe 180° (odwrotnie)
  return Math.round(Math.max(0, Math.min(1, (23.5 - lat) / 47)) * 180)
}
// ikona fazy: ciemna tarcza + jasna część (limb + terminator), obrócona wg półkuli obserwatora.
// col: { dark, lit, line } – do druku jaśniejsze kolory niż na ekranie
function phaseGlyph(p, cx, cy, rr, col) {
  col = col || { dark: "#4a5068", lit: "#e6ebf5", line: "#8ea3c2" };
  var c = Math.cos(p * R), wax = p < 180, top = cy - rr, bot = cy + rr, tilt = moonTilt(),
    lit = "M" + cx + " " + top + "A" + rr + " " + rr + " 0 0 " + (wax ? 1 : 0) + " " + cx + " " + bot +
      "A" + Math.abs(rr * c).toFixed(2) + " " + rr + " 0 0 " + (wax ? (c > 0 ? 0 : 1) : (c > 0 ? 1 : 0)) + " " + cx + " " + top + "Z";
  return '<circle cx="' + cx + '" cy="' + cy + '" r="' + rr + '" fill="' + col.dark + '" stroke="' + col.line + '" stroke-width="' + (rr / 8).toFixed(2) + '"/>' +
    '<path d="' + lit + '" fill="' + col.lit + '"' + (tilt ? ' transform="rotate(' + tilt + ' ' + cx + ' ' + cy + ')"' : '') + '/>'
}

/* ===== Wspólne dla aplikacji i druku ===== */
var PHASE_NAMES = ["Nów", "I kwadra", "Pełnia", "III kwadra"];

// doba n: { a: wschód (początek), b: następny wschód, set: zachód, light: stopnie światła albo null (dzień / noc polarna) }
function dayInfo(n) {
  var a = sunDayStart(n), b = sunDayStart(n + 1), c = dayCycle(new Date(sunNoon(n)));
  return { a: a, b: b, set: c ? c.set : a, polar: c ? c.polar || "" : "",
    light: c && !c.polar && !c.noDay ? 360 * (c.set - c.a) / (c.b - c.a) : null }
}
// kąt doby (0–360° od wschodu) chwili ms w dobie d (z dayInfo)
function degOf(d, ms) { return 360 * (ms - d.a) / (d.b - d.a) }
function msOf(d, deg) { return d.a + deg / 360 * (d.b - d.a) }

// główne fazy Księżyca w dobach od n0 do n1 (włącznie): { n: [{ k: 0 nów … 3 III kwadra, ms }] }
function phasesBetween(n0, n1) {
  var out = {}, a = sunDayStart(n0), b = sunDayStart(n1 + 1),
    ms = newMoonNear(a - 30 * 864e5);
  while (ms < b) {
    var len = (newMoonNear(ms + 29.53 * 864e5) - ms) / 864e5;
    [ms, quarterAt(ms, len, 1), quarterAt(ms, len, 2), quarterAt(ms, len, 3)].forEach(function (t, k) {
      if (t >= a && t < b) { var n = sunDay(t); (out[n] = out[n] || []).push({ k: k, ms: t }) }
    });
    ms = newMoonNear(ms + 29.53 * 864e5)
  }
  return out
}

// "137°" albo "137° 24′"
function degStr(x, withMin) {
  x = (x % 360 + 360) % 360;
  if (!withMin) return Math.min(359, Math.floor(x)) + "°";
  var m = Math.floor(x * 60 + 1e-6);
  return Math.floor(m / 60) + "° " + String(m % 60).padStart(2, "0") + "′"
}
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") }

// nazwy miesięcy orbity (półkula południowa: pory roku odwrócone)
var MON_N = "Wczesna wiosna|Pełna wiosna|Późna wiosna|Wczesne lato|Pełne lato|Późne lato|Wczesna jesień|Pełna jesień|Późna jesień|Wczesna zima|Pełna zima|Późna zima".split("|"),
  SEAS_N = ["Wiosna", "Lato", "Jesień", "Zima"], SEAS_C = ["#4c9a3f", "#e0a000", "#c8623a", "#4f7fc4"];
function sIdx(q) { return lat < 0 ? (q + 2) % 4 : q }
function monName(k) { return MON_N[sIdx(k / 3 | 0) * 3 + k % 3] }
function seasName(q) { return SEAS_N[sIdx(q)] }
function seasColor(q) { return SEAS_C[sIdx(q)] }
var GREG_M = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
function gregShort(d) { return d.getDate() + " " + GREG_M[d.getMonth()] }
