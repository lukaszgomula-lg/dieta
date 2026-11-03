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
