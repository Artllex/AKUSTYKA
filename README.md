# AKUSTYKA

Edytor pokoju 3D dla Windows, przygotowany do dalszego rozwijania narzędzi akustycznych. Aktualna wersja: 0.77.0.

Pozwala edytować geometrię pokoju, ustawiać manekina i monitory studyjne oraz oglądać geometryczne pierwsze odbicia. Domyślne wymiary wewnętrzne: **247,7 × 371,5 × 260,5 cm**. Obliczenia charakterystyki częstotliwościowej i pełna symulacja akustyczna nie są jeszcze zaimplementowane.

## Uruchomienie

Wymagany Node.js 20.19+ lub 22.12+.

```powershell
cd product/source
npm.cmd ci
npm.cmd start
```

Aplikacja otwiera zmaksymalizowane okno. Pełny ekran można przełączyć w menu View. `START.cmd` w katalogu `product/source` także uruchamia aplikację z kodu.

## Budowanie

```powershell
cd product/source
npm.cmd run package:windows
```

Gotowy plik znajduje się w `product/builds/windows-<wersja>/AKUSTYKA-win32-x64/AKUSTYKA.exe`.

`npm.cmd run dev` uruchamia podgląd przeglądarkowy na http://127.0.0.1:4173. `npm.cmd test` uruchamia testy.

## Jednostki i współrzędne

Jedna jednostka modelu to jeden metr; pola interfejsu pokazują centymetry. X oznacza szerokość i kierunek wschodni, Y wysokość, a Z długość; północ to −Z. Więcej w [dokumentacji modelu pokoju](product/documentation/milestones/01-room-model.md).

## Licencja

[MIT](LICENSE). Nazwy i znaki producentów monitorów należą do ich właścicieli.

## Lokalna organizacja projektu

Zasady pracy zapisano w [AGENTS.md](AGENTS.md): każda zakończona zmiana otrzymuje lokalny commit, `product/builds/` zachowuje maksymalnie dwie najnowsze paczki Windows, a pliki projektu trafiają wyłącznie do miejsc przewidzianych przez strukturę Project Managera. Wysyłanie commitów wymaga osobnego polecenia.

## Cel:

- Projekt zarządzany przez Project Control.

## Reguła manifestu Project Control:

- Manifest wymienia wyłącznie technologie i integracje faktycznie dodane do projektu.
- Nieobecnych technologii nie wpisujemy jako `enabled: false`.
