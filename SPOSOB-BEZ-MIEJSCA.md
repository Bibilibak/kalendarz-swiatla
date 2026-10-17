# Doba bez wybranego miejsca: sposób 2 i inne zamienniki godzin

Teraz kalendarz działa według **sposobu 1**: doba zaczyna się o prawdziwym wschodzie Słońca w wybranym miejscu. Ten plik opisuje **sposób 2**, który odłożyliśmy na później, i kilka podobnych pomysłów. Żaden z nich nie wymaga patrzenia na zegarek.

---

## Skąd w ogóle problem

Ziemia obraca się o 360° względem Słońca w ciągu doby. W kalendarzu liczymy ten obrót **od wschodu Słońca**: 0° to wschód, a 360° to następny wschód. Godzina wschodu zależy jednak od dwóch rzeczy:

1. **Od długości geograficznej** (wschód–zachód). W Warszawie Słońce wschodzi wcześniej niż w Berlinie, bo Warszawa leży dalej na wschód.
2. **Od szerokości geograficznej i pory roku** (północ–południe). W czerwcu w Warszawie Słońce wschodzi przed 4:20, a w grudniu dopiero przed 7:45. Na równiku wschodzi prawie zawsze około 6:00.

Dlatego bez miejsca nie da się powiedzieć, kiedy zaczyna się doba.

---

## Sposób 2: umowny wschód („doba od 6:00 czasu słonecznego”)

**Pomysł:** zamiast prawdziwego wschodu bierzemy **wschód umowny**, taki, jaki byłby w dniu równonocy na równiku. Wtedy Słońce zawsze „wschodzi” 90° przed górowaniem, a „zachodzi” 90° po nim.

| Kąt doby | Co się dzieje |
|---|---|
| **0°** | umowny wschód: Słońce jest 90° przed południkiem |
| **90°** | górowanie: Słońce najwyżej, na południu |
| **180°** | umowny zachód |
| **270°** | słoneczna północ: Słońce najniżej, pod nami |
| **360° = 0°** | następny umowny wschód |

### Co z tego wynika
- ✅ **Każda doba ma dokładnie 360° tej samej długości.** 1° to zawsze dokładnie 4 minuty (przy prawdziwym wschodzie stopień jest raz trochę krótszy, raz trochę dłuższy).
- ✅ **Górowanie zawsze wypada na 90°**, a północ na 270°. Łatwo to zapamiętać.
- ✅ **Szerokość geograficzna nie ma znaczenia.** Wystarczy długość geograficzna, czyli to, jak daleko na wschód leży miejsce. Liczy się więc tak samo w Gdańsku i w Zakopanem (prawie ta sama długość).
- ⚠️ **Prawdziwy wschód nie wypada na 0°.** W czerwcu w Warszawie Słońce wschodzi około 35° przed umownym wschodem (czyli „na 325°” poprzedniej doby), a w grudniu około 32° po nim. Granica doby nie pokrywa się więc z tym, co widać na niebie.
- ⚠️ **Długość dnia widać inaczej.** Zamiast „ile stopni ma dzień” patrzymy, gdzie na tarczy wypada wschód i zachód.

### Wariant 2a: z równaniem czasu albo bez
Słońce nie chodzi idealnie równo: w ciągu roku górowanie przesuwa się o ±16 minut (to tzw. **równanie czasu**, punkt z planu daylight-clock).
- **Prawdziwe Słońce:** 90° to zawsze prawdziwe górowanie, ale doby mają nierówną długość (różnice do ok. 30 sekund).
- **Średnie Słońce:** wszystkie doby są równe, ale górowanie wypada raz na 86°, raz na 94°.

### Wariant 2b: wspólny dla całej Ziemi
Gdyby liczyć obrót od jednego południka (np. Greenwich, 0° długości), to **o tej samej chwili wszyscy na Ziemi mieliby ten sam kąt**, jak przy UTC. Wtedy nie potrzeba żadnego miejsca. Ale w Polsce górowanie wypadałoby wtedy na ok. 69° (90° − 21° długości Warszawy), a w Nowym Jorku na ok. 164°. Tak działał „czas internetowy” Swatcha z 1998 roku: doba podzielona na 1000 „beatów”, wspólnych dla całego świata.

---

## Porównanie

| | Sposób 1 (teraz) | Sposób 2 | Wariant 2b |
|---|---|---|---|
| Doba zaczyna się | o prawdziwym wschodzie | o umownym wschodzie | o umownym wschodzie w Greenwich |
| Co trzeba znać | szerokość i długość | tylko długość | nic |
| Długość 1° | zmienia się trochę z dnia na dzień | zawsze 4 minuty | zawsze 4 minuty |
| Górowanie | w Warszawie od ok. 58° (grudzień) do ok. 126° (czerwiec) | zawsze 90° | stały kąt zależny od miejsca |
| Wschód na tarczy | zawsze 0° | przesuwa się w ciągu roku | przesuwa się |
| Zgodność z niebem | najlepsza | dobra (górowanie, północ) | słaba |

---

## Godziny w przeliczeniu na stopnie

Każdy z tych sposobów **zastępuje godziny kątem obrotu Ziemi**. Nie potrzebujesz zegarka, wystarczy wiedzieć, gdzie jest Słońce:

| Kąt | Czas |
|---|---|
| 1′ (minuta kątowa) | 4 sekundy |
| 1° | 4 minuty |
| 15° | 1 godzina |
| 90° | 6 godzin |
| 360° | doba |

Przykład dla sposobu 2: „spotkanie na 120°” znaczy dwie godziny po górowaniu (120° − 90° = 30° = 2 h).

---

## Co dalej (pomysły)
- Przełącznik w ustawieniach aplikacji: **prawdziwy wschód** (sposób 1) albo **umowny wschód** (sposób 2). Wydarzenia zostają w stopniach, zmienia się tylko, od czego liczymy.
- Na tarczy w sposobie 1 można dodać cienki znacznik 90° od górowania (umowny wschód), żeby porównać oba sposoby na co dzień.
- Zegar mechaniczny z planu (24 h, południe na górze) to w praktyce **sposób 2**: obraca się równo, a dzień pokazują ruchome przesłony.
