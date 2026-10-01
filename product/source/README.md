# AKUSTYKA — edytor pomieszczenia Windows

`npm.cmd ci` instaluje zależności. `npm.cmd start` uruchamia aplikację Windows z kodu.

`npm.cmd run package:windows` tworzy `../builds/windows-<wersja>/AKUSTYKA-win32-x64/AKUSTYKA.exe`.
Po udanym pakowaniu usuwa katalog pośredni i starsze paczki Windows, zachowując bieżącą oraz jedną poprzednią wersję do powrotu. Nie rusza `../releases` ani innych katalogów projektu.

`npm.cmd run dev` uruchamia podgląd przeglądarkowy. `npm.cmd test` uruchamia testy.

Dokumentacja: [model pokoju](../documentation/milestones/01-room-model.md). Licencja: [MIT](../../LICENSE).
