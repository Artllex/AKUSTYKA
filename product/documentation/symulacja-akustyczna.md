# Wstępna symulacja akustyczna

Panel **Odbicia** pokazuje czas dotarcia dźwięku bezpośredniego, opóźnienie i szacowany poziom pojedynczych pierwszych odbić dla wybranych przetworników, obu uszu i pasma oktawowego. Pokazuje też częstotliwości modów pokoju do 200 Hz.

## Zakres obliczeń

- Położenia źródeł i uszu pochodzą z aktualnego modelu 3D. Pierwsze odbicia wyznacza metoda źródeł pozornych na powierzchniach pokoju i fizycznych powierzchniach obiektów. Uwzględnia ona zasłanianie prostych dróg przez modelowane obiekty.
- Opóźnienie względem dźwięku bezpośredniego wynosi `(droga odbita − droga bezpośrednia) / 343,2 m/s`. Przyjęta prędkość odpowiada w przybliżeniu temperaturze 20°C.
- Szacowany poziom pojedynczej drogi w danym paśmie to `20 log10(droga bezpośrednia / droga odbita) + 10 log10(1 − α)` dB. `α` jest wybranym współczynnikiem pochłaniania. Wynik nie jest sumą wszystkich dróg ani odpowiedzią częstotliwościową w punkcie odsłuchu.
- Mody: `f = c/2 × √((nx/szerokość)² + (ny/wysokość)² + (nz/długość)²)` dla niezerowych trójek liczb całkowitych. To przybliżenie prostokątnego pokoju; wnęka, otwory i rzeczywista konstrukcja przegród mogą zmienić częstotliwości i siłę rezonansów.

Wartości pochłaniania dla malowanej ściany, laminatu, szkła, drewna/MDF, metalu i przykładowego panelu są **założeniami edytowalnymi przez wybór materiału**, a nie pomiarami tego pokoju lub certyfikowanymi danymi konkretnych produktów. Pasma: 125, 250, 500, 1000, 2000 i 4000 Hz.

Ukryty rack z syntezatorami i urządzenia na biurku są początkowo wyłączone z obliczeń zgodnie z bieżącym założeniem projektu. Samo biurko pozostaje powierzchnią akustyczną. Ich uwzględnienie można włączyć w rozwijanej sekcji **Materiały i wyposażenie w symulacji**. Te ustawienia są zapisywane w dokumencie pokoju i obejmuje je cofanie zmian.

To etap oceny geometrii, a nie kalibrowana symulacja pola akustycznego. Nie uwzględnia charakterystyki kierunkowej i fazowej monitorów, wielokrotnych odbić, dyfrakcji, transmisji przez przegrody, tłumienia powietrza ani charakterystyki modów zależnej od pozycji źródła i odbiornika. Do decyzji o ustrojach i ich strojeniu potrzebny będzie pomiar mikrofonem w gotowym pomieszczeniu.

Podstawy metody: [Allen i Berkley, 1979](https://jontalle.web.engr.illinois.edu/Public/AllenBerkley79.pdf). Współczynniki pochłaniania w zastosowaniach projektowych należy oprzeć na danych pomiarowych produktu, np. według [ISO 354](https://www.iso.org/standard/34545.html), lub na pomiarze w pomieszczeniu.
