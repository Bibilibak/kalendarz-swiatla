# Kalendarz światła

Kalendarz na co dzień, wzorowany na [Zegarze światła (daylight-clock)](../daylight-clock/README.md). Zamiast miesięcy gregoriańskich ma **kalendarz orbity**, a zamiast godzin **stopnie doby od wschodu Słońca**.

- **Rok orbity** zaczyna się w dniu równonocy marcowej. Każda pora roku to 90° drogi Ziemi wokół Słońca, podzielone na 3 miesiące po 30°: wczesna, pełna i późna (np. „Pełna jesień”). Miesiące mają od 29 do 32 dni.
- **Doba** trwa od wschodu do następnego wschodu Słońca i ma 360°. 0° to wschód, 1° to około 4 minuty, 15° to około godzina.
- Granica doby zależy od miejsca, dlatego przy pierwszym uruchomieniu aplikacja pyta, gdzie jesteś. Sposób bez miejsca opisuje [SPOSOB-BEZ-MIEJSCA.md](SPOSOB-BEZ-MIEJSCA.md).

## Aplikacja (`index.html`)
- **Doba:** tarcza 0–360° z dniem i nocą, wskazówką Słońca i Twoimi wydarzeniami. W środku tarczy widać obecny kąt, najbliższe wydarzenie i liczbę stopni do zachodu. Pod tarczą są światło dnia, faza Księżyca i zdarzenia doby w stopniach od wschodu.
- **Wydarzenia:** nazwa, początek w stopniach (z minutami kątowymi ′), czas trwania w stopniach, notatka i powtarzanie: każdej doby, co 10 dób, co miesiąc albo co rok. Kąt wybierzesz kliknięciem tarczy. Godzinę zegara (np. umówioną wizytę) możesz przeliczyć na kąt.
- **Miesiąc:** siatka po 10 dni z datą gregoriańską, fazami Księżyca i kropkami wydarzeń, a pod nią lista nadchodzących wydarzeń.
- **Ustawienia:** zmiana miejsca, zapis wydarzeń do pliku JSON i wczytanie z pliku (kopia zapasowa, przenoszenie między urządzeniami).
- Dane zostają tylko w przeglądarce (`localStorage`). Wyszukiwarka miast wysyła do Open-Meteo tylko wpisaną nazwę.
- **PWA:** po wystawieniu w internecie (np. GitHub Pages) aplikację można „zainstalować” na telefonie i działa offline. Otwarta z dysku (`file://`) działa normalnie, tylko bez trybu offline.

## Kalendarz do druku (`druk.html`)
Generator dla wybranego roku orbity i miejsca, format A5:
- **Ścienny** (A5 poziomo, 14 stron): okładka z kołem roku, 12 miesięcy po jednym na stronę (rzędy po 10 dni) i strona „Jak czytać”.
- **Planer** (A5 pionowo, 76 stron): okładka, „Jak czytać”, rok w skrócie, a potem każda dekada (dni 1–10, 11–20, 21–koniec) na rozkładówce. Każda doba ma oś 0–360° z dniem i nocą oraz linie do pisania.
- Przy każdym dniu: mała data gregoriańska i fazy Księżyca (z kątem doby), równonoce, przesilenia, a także dni, w których Ziemia jest najdalej i najbliżej Słońca.
- Przycisk „Drukuj / zapisz PDF” otwiera okno drukowania: wybierz „Zapisz jako PDF”, A5 i marginesy „Brak”. Na A4 wydrukujesz 2 strony na arkusz.

Przykłady dla Warszawy, rok orbity 2026 (20 marca 2026 – 19 marca 2027), są w folderze `przyklad/`.

Generator przyjmuje też parametry w adresie: `druk.html?y=2027&layout=planner&lat=52.23&lon=21.01&tz=Europe/Warsaw&name=Warszawa`.

## Pliki
```
index.html            – aplikacja
druk.html             – generator kalendarza do druku
css/app.css           – wygląd aplikacji
css/print.css         – strony A5 do druku
js/astro.js           – Słońce, Księżyc, doby od wschodu (z daylight-clock) + wspólne funkcje
js/orbit.js           – kalendarz orbity (kopia z daylight-clock)
js/place.js           – wybór miejsca (miasto, lokalizacja, współrzędne)
js/app.js             – aplikacja: doba, miesiąc, wydarzenia, kopia zapasowa
js/print.js           – generator stron do druku
sw.js, manifest.webmanifest, icon*.* – PWA
SPOSOB-BEZ-MIEJSCA.md – doba od umownego wschodu i inne zamienniki godzin
```

Obliczenia w `js/astro.js` i `js/orbit.js` pochodzą z daylight-clock. Jeśli je tam poprawisz, skopiuj zmiany także tutaj. Po zmianie plików CSS lub JS podnieś numer `?v=` w HTML oraz `CACHE` w `sw.js`.
