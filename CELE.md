# Cele dnia – instrukcja dla trenera

Zakładka **Cele** w arkuszu `MINDE_dieta_dziennik` (jeden wiersz na dzień, aplikacja tylko czyta):

| kolumna | znaczenie |
|---|---|
| data | RRRR-MM-DD |
| kcal, bialko, tluszcz, wegle | cel makro |
| typ_dnia, uwaga, ustalono | opis, krótka uwaga, kiedy ustalono |
| **woda_ml** | **cel wody łącznie w ml** – płyny + woda z jedzenia (porównywany z sumą `Dziennik.woda_g`) |

## Jak wyznaczać `woda_ml`

Punkt wyjścia: EFSA – dorosły mężczyzna **ok. 2500 ml wody łącznie** na dobę (ok. 20% z jedzenia, reszta z płynów). Dalej korekty (orientacyjne, do kalibracji na danych):

| czynnik | korekta |
|---|---|
| dzień treningowy (siłownia ~1 h) | +500 ml |
| bieg / trening wytrzymałościowy | +500–750 ml na godzinę wysiłku |
| temperatura odczuwalna > 25°C | +500 ml; > 30°C +750–1000 ml |
| wczoraj woda łącznie < 80% celu (`Dziennik.woda_g`) | +250–500 ml |
| wczoraj alkohol > 20 g (`Dziennik.alkohol_g`) | +250–500 ml |
| sezon grzewczy (suche powietrze) | +0–250 ml |

Dane w Dzienniku na wpis: `plyn_ml` (płyny wypite), `woda_g` (woda łącznie, z jedzeniem), `alkohol_g` (g etanolu).
Pogodę sprawdzić w dniu ustalania celu. Aplikacja pokazuje osobno także same płyny (informacyjnie). Pasek wody łącznie: niebieski < 90%, zielony 90–135%, czerwony > 135%.

# Suplementy i leki – instrukcja dla trenera

Arkusz **MINDE_Zdrowie_baza** (aplikacja dieta czyta go przez skrypt diety):

- **SUPL_PRODUKTY** – katalog kupionych preparatów: `id, nazwa, marka, typ (suplement/lek), skladnik, sklad_porcji (np. „EPA 180 mg + DHA 120 mg / kaps.”), jedn_porcji, w_opakowaniu, status (w użyciu / skończony / zapas / do potwierdzenia), od, do, uwagi`. Gdy preparat się kończy: `status = skończony`, `do = data`, nowy preparat jako nowy wiersz.
- **PLAN_SUPLEMENTACJI** – plan: `id, produkt_id, nazwa, skladnik, dawka, jedn, dawka_skladnika, pora, kiedy, od, do, aktywny, uwagi, ustalono`.
  - `pora`: rano na czczo / śniadanie / przed treningiem / po treningu / obiad / kolacja / wieczór / przed snem / dowolnie
  - `kiedy`: codziennie / trening / nietrening / opcjonalnie (dzień treningowy = `Cele.typ_dnia` zawiera „trening”)
  - `aktywny`: TAK = widoczne w aplikacji; PROJEKT = wersja robocza; NIE = wyłączone. Zmiana preparatu = zmiana `produkt_id` i dawki w tym samym wierszu (historia zostaje w dzienniku).
- **SUPLEMENTY_DZIENNIK** – odhaczenia z aplikacji: `status` = przyjete / pominiete (pominięte wpisuje się automatycznie przy zamknięciu dnia); `plan_id` puste = spoza planu.

## Zdrowie: 4 kluczowe parametry + wskazówka dnia (od 2026-11-09)
Kolumny w zakładce `Cele` (wpisuje trener):
- `nasycone_max` (g) – limit tłuszczów nasyconych (LDL/ApoB; Lp(a) wysokie),
- `sol_max` (g) – limit soli (ciśnienie),
- `blonnik_min` (g) – minimum błonnika (LDL, glukoza),
- `foliany_min` (µg) – minimum folianów (niski kwas foliowy we krwi),
- `wskazowka` (tekst) – jedno–dwa konkretne zalecenia na dzień na podstawie poprzednich dni.

Aplikacja pokazuje panel „Zdrowie” pod celami makro: limity zielone ≤ limit / czerwone powyżej, minima niebieskie poniżej / zielone po osiągnięciu; „≈” gdy część produktów nie ma danych. Gdy `sol_max` jest ustawione, ukrywa się linia błonnik/cukry/sól z podsumowania (bez dublowania). Wskazówka wyświetla się jako ramka „Na dziś”.
