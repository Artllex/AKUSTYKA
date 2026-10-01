# AKUSTYKA — etap 1: model pokoju



Aplikacja znajduje się w `product/source`. Istniejąca struktura Project Control jest zachowana.



## Uruchomienie



W `C:\AKUSTYKA\product\source`:



```powershell

npm.cmd install

npm.cmd run dev

```



Otwórz http://127.0.0.1:4173. Możesz też uruchomić `START.cmd` w tym katalogu. Wymaga Node.js 20.19+ lub 22.12+ i przeglądarki z WebGL. Zależności są lokalne, bez CDN.



`npm.cmd test` sprawdza skalę, granice sześciu powierzchni, walidację i tryby widoczności. `npm.cmd run build` tworzy `dist`.



## Współrzędne i jednostki



Model przechowuje wymiary w metrach: szerokość 2.477, długość 3.715, wysokość 2.605. Panel pokazuje i przyjmuje centymetry. Jedna jednostka Three.js to jeden metr. Prawoskrętny układ: X = szerokość, Y = wysokość (w górę), Z = długość. Początek (0,0,0) leży w narożniku podłogi. Wnętrze zajmuje X od 0 do szerokości, Y od 0 do wysokości, Z od 0 do długości. Przyszłe obiekty powinny przechowywać pozycje w metrach i obroty w radianach.



Sześć płaszczyzn wyznacza dokładne granice wewnętrzne; grubość ścian nie jest modelowana. Siatka podłogi ma odstęp 0.1 m; ostatnie pole przy krawędzi może być krótsze. Powierzchnia podłogi: 9.202055 m². Objętość: 23.971353275 m³.



## Obsługa



Lewy przycisk obraca kamerę, prawy przesuwa, kółko przybliża. Jeden palec obraca; dwa przesuwają i przybliżają. Widok z góry pozostaje perspektywiczny. Otwarty widok wnętrza ukrywa sufit oraz ściany znajdujące się pomiędzy kamerą a wnętrzem. Ich geometria nie zmienia się. Wyłączenie tej opcji pokazuje wszystkie powierzchnie. Przywróć pokój odtwarza zadane wymiary i kamerę. Edycja jest tymczasowa, przeładowanie strony przywraca model bazowy.



## Architektura



- `src/model.js`: dane dokumentu, jednostki, walidacja i metryki; bez renderowania.

- `src/room-view.js`: geometria powierzchni, siatka, osie i widoczność; zwalnia zasoby po zmianie wymiarów.

- `src/main.js`: kamera OrbitControls, renderer, formularz i przebudowa sceny.

- `src/style.css`: wygląd panelu i widoku.



Dokument ma `schemaVersion`, `units`, `room` oraz pustą tablicę `objects`. Można później dodać dane absorberów, pułapek basowych, dyfuzorów, biurka, okna, monitorów i słuchacza. Moduł symulacji powinien przyjmować dane dokumentu, niezależnie od widoczności powierzchni w edytorze. Etap 1 nie oblicza akustyki i nie zapisuje jeszcze scen.



Sterowanie kamerą: https://threejs.org/docs/pages/OrbitControls.html



## Weryfikacja 2026-09-28



Dwa testy przeszły; build produkcyjny zakończył się powodzeniem. W uruchomionej aplikacji potwierdzono renderowanie WebGL, obrót i zoom, zmianę szerokości na 300 cm z aktualizacją metryk, widok z góry, zamknięcie/otwarcie pokoju i powrót do dokładnych wymiarów bazowych. Przesuwanie prawym przyciskiem i dotyk są obsługiwane przez OrbitControls, ale nie zostały osobno przetestowane interaktywnie. Build zgłasza zalecenie podziału dużego pliku JS; nie blokuje działania.



## Wybór powierzchni i rzuty prostopadłe



Kliknij widoczną ścianę, podłogę lub sufit w 3D. Kliknięcie zaznacza i podświetla powierzchnię; przeciąganie obraca kamerę i nie zmienia zaznaczenia. Sufit można wybrać po wyłączeniu otwartego widoku wnętrza i ustawieniu kamery ponad pokojem.



Przyciski `Rzut od wnętrza` i `Rzut od zewnątrz` ustawiają kamerę ortograficzną dokładnie na normalnej wybranej powierzchni. Pozostałe powierzchnie są tymczasowo ukrywane, aby nie zasłaniały rzutu. Rzut zachowuje proporcje, pozwala na przesuwanie i zoom, a obrót jest zablokowany. `Widok 3D` przywraca perspektywę i działanie trybu przekrojowego. Wyboru kolejnej powierzchni dokonuje się w 3D. Zmiana wymiarów usuwa zaznaczenie. Dotychczasowy przycisk `Z góry` zachowuje swój widok perspektywiczny; ortograficzny rzut podłogi uzyskuje się przez jej zaznaczenie.



`src/projection.js` oblicza kamerę i dopasowanie rzutu. Test sprawdza ortograficzność, prostopadłość i objęcie kadrem każdej z sześciu powierzchni z obu stron. Wszystkie trzy testy i build przeszły. W przeglądarce sprawdzono wybór ściany i podłogi, rzuty z obu stron oraz powrót do 3D.



## Etap 0.2 — Windows, Bench i kierunki



Gotowa aplikacja: `C:\AKUSTYKA\product\builds\windows\AKUSTYKA-win32-x64\AKUSTYKA.exe`. Uruchamiana bez przeglądarki, Node.js i serwera lokalnego. Plik EXE pozostaje w swoim folderze razem z bibliotekami; nie przenoś samego EXE. Launcher: `C:\AKUSTYKA\START.cmd`.



Aplikacja jest pakowana w Electron, z lokalnym widokiem Three.js. Okno ma systemową belkę Windows. Renderer ma włączoną izolację i sandbox, bez Node.js. Most preload udostępnia tylko otwieranie, zapis dokumentu i zamknięcie. Dialogi plików są systemowe. `npm.cmd start` przebudowuje i uruchamia wersję deweloperską Windows; `npm.cmd run package:windows` przebudowuje katalog aplikacji. `npm.cmd run dev` nadal zapewnia pomocniczy podgląd w przeglądarce.



Pierwszy Bench ma wysokość 38 px i kategorie File / Edit / View. Drugi, wyższy Bench ma 76 px i pierwszy moduł: Wymiary pomieszczenia. Przycisk Panel wymiarów chowa/pokazuje panel bez resetowania kamery, zaznaczenia i danych pokoju. Układ modułów jest przygotowany do rozbudowy.



- File: nowy pokój, otwieranie JSON, zapis jako JSON, zakończenie aplikacji Windows.

- Edit: cofanie/ponawianie zatwierdzonych zmian wymiarów; Ctrl+Z / Ctrl+Y. Nowa zmiana po cofnięciu usuwa gałąź ponawiania.

- View: panel wymiarów, widok 3D, widok z góry.



`src/bench.js` obsługuje menu, historię wymiarów i walidację dokumentów. `desktop/main.cjs` oraz `desktop/preload.cjs` obsługują okno i dialogi Windows. `scripts/package-windows.mjs` pakuje jedynie wersję produkcyjną i shell, bez zależności deweloperskich. Rozmiary pozostają w metrach; zapis jest w formacie schemaVersion 1 / units m.



Wskaźnik w prawym dolnym narożniku obraca się zgodnie z kamerą, także w rzutach ortograficznych. Północ = −Z, wschód = +X, dół = −Y. To umowna orientacja modelu, nie pomiar kierunku geograficznego pokoju. Linia przerywana wskazuje kierunek od obserwatora, pełna — ku obserwatorowi. Przy kierunku wzdłuż osi patrzenia pojawia się ⊗ (od obserwatora) lub ⊙ (ku obserwatorowi). `src/orientation.js` jest oddzielnym modułem wskaźnika.



Weryfikacja: cztery testy modelu, rzutów, historii i walidacji przeszły; paczka Windows powstała. Uruchomiono faktyczne EXE z `--smoke-test`: model, menu File/Edit/View, moduł, preload i kompas obecne, brak zgłoszonych błędów, zapisano obraz okna. Obraz został wizualnie sprawdzony: pokój renderuje się poprawnie. W pomocniczym podglądzie sprawdzono chowanie/pokazywanie panelu, aktualizację szerokości na 300 cm i Ctrl+Z przywracające 247,7 cm. Systemowe dialogi otwierania/zapisu są zaimplementowane, ale nie zostały ręcznie sprawdzone na Windows. Build nadal zgłasza informację o dużym pliku JS.



## Wersja 0.2.1 — wspólny panel orientacji i rzutów



Wskaźnik kierunków i przyciski rzutów są scalone w jeden panel w prawym dolnym narożniku. Usunięto nagłówek trybu, instrukcję kliknięcia i podpis osi pod wskaźnikiem. Przycisk Widok 3D oraz oznaczenia północy, wschodu i dołu pozostały. Gotowa aplikacja znajduje się w `product/builds/windows-0.2.1/AKUSTYKA-win32-x64/AKUSTYKA.exe`; główny START.cmd wskazuje tę wersję. Build i uruchomienie gotowego EXE z kontrolą renderowania przeszły; podgląd sprawdzono wizualnie.



## Wersja 0.3.0 — siedzący manekin i krzesło obrotowe



`src/listener-view.js` tworzy lekki model z prostych brył (poniżej 15 tysięcy trójkątów). Orientacyjne proporcje odpowiadają wzrostowi 168 cm. Siedzisko: 43,5 cm nad podłogą, pochylenie tułowia: około 10°, środek głowy i uszy: 118,5 cm, szczyt głowy: około 130,5 cm. Są to założenia modelu poglądowego, nie indywidualne pomiary antropometryczne. Dłonie ułożone są do pracy przy blacie na wysokości około 73 cm; biurko nie zostało jeszcze dodane.



Manekin siedzi na krześle obrotowym z pięcioramienną podstawą i kółkami. Płaskie podeszwy obu stóp oraz spody kółek leżą na Y = 0. Głowa ma nos i zaznaczone uszy, co pokazuje kierunek odsłuchu. Model patrzy na północ (−Z). Początkowa pozycja: X = połowa szerokości, Z = 45% długości pokoju, Y = 0. Obiekt `seated-listener` jest przechowywany w `objects` dokumentu, wraz z pozycją i obrotem; wczytanie starego pokoju bez manekina dodaje model domyślny. Zmiana wymiarów pokoju zachowuje już istniejącą pozycję manekina. Przeciąganie, zmiana wzrostu i indywidualne dopasowanie pozy nie zostały wprowadzone.



Sześć testów przeszło, w tym kontakt podeszew i kółek z podłogą, wysokość uszu, zmieszczenie modelu w domyślnym pokoju oraz zapis/wczytanie pozycji. Build i kontrolne uruchomienie rzeczywistego EXE przeszły; renderowanie modelu sprawdzono wizualnie.



Aktualna aplikacja: `product/builds/windows-0.3.0/AKUSTYKA-win32-x64/AKUSTYKA.exe`. Główny START.cmd uruchamia tę wersję.



## Wersja 0.4.0 — panel manekina i kinematyka pozy



Przycisk Manekin w Bench otwiera panel, wymiennie z panelem wymiarów pokoju. Przy starcie widoczny jest panel manekina. Ustawienia:



- Wzrost 140–200 cm, skaluje proporcje ciała, bez skalowania krzesła.

- Siedzisko 32–60 cm; górna granica jest dodatkowo zależna od wzrostu i osiągalności nóg. Przy zmniejszeniu wzrostu zbyt wysokie siedzisko jest obniżane do tej granicy.

- Panel 2D: przód do 35°, tył do 10°, bok do 20°. Łączne wychylenie ograniczone elipsą. Mysz daje podgląd na żywo, puszczenie zapisuje jeden krok historii, Esc / pointercancel przywraca początek gestu. Strzałki: 1°, Shift+strzałki: 5°, Home: tułów pionowo.

- Głowa: lewo/prawo ±80°, góra 25° / dół 40°, przechył boczny ±25°. Obrót niezależny od tułowia, wokół nasady szyi.

- Wyprostuj tułów i głowę nie zmienia wzrostu, wysokości krzesła ani pozycji nóg.



Wychylenie tułowia obraca wyłącznie hierarchię nad biodrami: tułów, ramiona, szyję i głowę. Nogi, miednica i krzesło mają identyczne transformacje przed i po wychyleniu. Obrót głowy nie zmienia tułowia ani rąk. Zmiana wzrostu/siedziska rozwiązuje dwusegmentową geometrię nóg z zachowaniem długości uda i goleni oraz podparcia płaskich stóp na podłodze. Model pozostaje poglądowy, nie jest indywidualnym pomiarem antropometrycznym ani symulacją anatomii.



Zmiany pozy aktualizują tylko model manekina; kamera, zaznaczenie powierzchni i rzut pozostają. Panel pokazuje bieżącą średnią wysokość lewego/prawego ucha. Wychylenie i obrót głowy mogą tę wysokość zmieniać.



Dane zapisywane w obiekcie seated-listener: stature i seatHeight w metrach; leanForward, leanSide, headYaw, headPitch, headRoll w stopniach. Pozostałe pozycje są w metrach, yaw całego obiektu nadal w radianach. Stare zapisy otrzymują domyślne parametry pozy. Dane z wartościami spoza zakresów są odrzucane. Cofnij/Ponów w Edit oraz Ctrl+Z/Ctrl+Y obejmują teraz cały dokument: wymiary pokoju i parametry manekina. Zmiana po cofnięciu usuwa gałąź ponawiania.



Moduły: listener-model.js — parametry, zakresy, migracja i rozwiązanie kolana; listener-view.js — hierarchia i geometria; listener-panel.js — interakcja 2D i suwaki; history.js — historia dokumentu. Pakowanie bierze numer wersji z package.json.



Weryfikacja: 9 testów przeszło. Sprawdzono dokładną niezmienność macierzy dolnej części ciała i krzesła przy wychyleniu/obrocie głowy, niezmienność tułowia przy obrocie głowy, kontakt stóp z podłogą i długości segmentów przy skrajnych wzrostach i wysokościach siedziska, zapis/migrację/historię. W uruchomionym pomocniczym podglądzie sprawdzono wzrost, siedzisko, przeciąganie 2D, obrót głowy do 80°, sterowanie strzałkami i cofanie zmian. Gotowe EXE przeszło kontrolę startu i panelu; obraz zweryfikowano wizualnie.



Aktualna aplikacja: product/builds/windows-0.4.0/AKUSTYKA-win32-x64/AKUSTYKA.exe. START.cmd wskazuje tę wersję.



## Wersja 0.4.1 — stabilna orientacja głowy i nieruchome dłonie



Wychylenie tułowia zmienia pozycję głowy, lecz nie zmienia jej ustawionego kąta względem pokoju / kierunku siedzenia manekina. Obrót głowy z panelu nadal działa; kompensacja obrotu tułowia zachowuje wszystkie trzy zadane kąty. Głowa porusza się wraz z szyją, nie pozostaje w jednym punkcie przestrzeni.



Dłonie i nadgarstki mają stałe pozycje oraz orientacje podczas wychylenia tułowia i obracania głowy. Kotwy odpowiadają bazowej pozycji pracy (tułów 10° do przodu). Zmiana wzrostu lub wysokości siedziska nadal dostosowuje bazowe położenie dłoni do rozmiaru ciała i wysokości siedzenia. Nie zmieniono zakresów wychylenia.



Barki podążają za tułowiem. Nowy pose-kinematics.js rozwiązuje pozycje łokci, zachowując długości ramienia i przedramienia oraz nieruchome nadgarstki. Poglądowe długości przy wzroście 168 cm wynoszą 28,5 cm dla ramienia i 27 cm dla przedramienia; są skalowane wraz ze wzrostem. Ramiona pozostają połączone i nie rozciągają się. Nogi, miednica i krzesło pozostają nieruchome przy wychyleniu.



Weryfikacja: 11 testów przeszło, w tym stałe kwaterniony głowy i pełne macierze dłoni/nadgarstków dla różnych wychyleń i kątów głowy; kontakt i stałe długości segmentów ramion dla pełnego obwodu zakresu wychylenia, trzech wzrostów i dwóch wysokości siedziska. W uruchomionym podglądzie sprawdzono wychylenie boczne i obejrzano model od przodu. Paczka Windows 0.4.1 została uruchomiona i przeszła kontrolę startu/renderowania bez zgłoszonych błędów.



Aktualna aplikacja: product/builds/windows-0.4.1/AKUSTYKA-win32-x64/AKUSTYKA.exe. START.cmd wskazuje tę wersję.



## Wersja 0.4.2 — łokcie poza tułowiem



Kierunek zgięcia łokcia podąża za zewnętrzną stroną tułowia dla każdego ramienia. Przy mocnym wychyleniu łokcie odchodzą na zewnątrz zamiast wchodzić w ciało. Zachowano nieruchome dłonie, stały kąt głowy, długości segmentów ramion oraz pozycję nóg.



Weryfikacja: 12 testów przeszło. Nowy test sprawdza odstęp obu łokci od tułowia na pełnym obwodzie zakresu wychylenia (36 kierunków, trzy wzrosty). Podgląd wizualny sprawdzono przy wychyleniu 12° do przodu i 18° w bok. Gotowa paczka Windows 0.4.2 przeszła kontrolę uruchomienia i renderowania bez błędów.



Aktualna aplikacja: product/builds/windows-0.4.2/AKUSTYKA-win32-x64/AKUSTYKA.exe. START.cmd wskazuje tę wersję.





## Wersja 0.5.0 — Barefoot MicroMain27 2nd Gen



Nowy pokój zawiera parę monitorów L/R. Panel Monitory pozwala wybrać monitor, ustawić X/Y/Z w cm i obrót w stopniach oraz przełączyć żółte znaczniki pięciu przetworników. Zmiany obejmuje Cofnij/Ponów oraz zapis/odczyt dokumentu. Stare dokumenty bez monitorów pozostają bez nich; panel udostępnia przycisk dodania pary. Przy edycji monitorów kamera i manekin pozostają w swojej pozycji.



Źródło: [oficjalna instrukcja MicroMain27 Gen2](https://barefootsound.com/manuals/MicroMain27_Owners_Manual.pdf), specyfikacja strona PDF 14, rysunek strona PDF 15. Obudowa W/H/D = 241/521/394 mm; gabaryt W/H/D = 267/521/442 mm według specyfikacji. Rysunek zawiera nieco inne wymiary głębokości, więc do gabarytu użyto tabeli specyfikacji. Geometria membran, ramki i tylnego radiatora jest uproszczona; model nie jest CAD producenta.



1 jednostka = 1 m. Początek lokalny monitora to środek spodu obudowy, +Y w górę, front +Z. position określa ten punkt w pokoju, yaw obraca wokół Y i jest zapisany w radianach. Wymiary fabryczne pozostają stałe. Bazowo wysokość spodu 0,9245 m daje tweeter na 1,185 m; para jest rozstawiona symetrycznie i skierowana w stronę manekina.



Pięć środków geometrycznych powierzchni głośników (x,y,z w m): górny midbass (0; 0,3812; 0,197), tweeter (0; 0,2605; 0,197), dolny midbass (0; 0,1398; 0,197), boczne subwoofery (±0,1335; 0,2605; −0,010). Niewymiarowane odsunięcia środków oszacowano z rzutu producenta i zaokrąglono; nie są to zmierzone, zależne od częstotliwości centra akustyczne. Znaczniki są minimalnie odsunięte od powierzchni dla czytelności. getDriverCenters() zwraca pozycje powierzchni w układzie pokoju i normalne po obrocie. Nominalne średnice: 1″, 2 × 5,25″, 2 × 10″.



Moduły monitor-model.js / monitor-view.js / monitor-panel.js oddzielają dane, geometrię i obsługę panelu. Nie dodano symulacji akustycznej.



Weryfikacja wersji 0.5.0: 15 testów przeszło. Sprawdzono skalę obudowy i gabarytu (tolerancja 0,5 mm dla detali), pięć żółtych środków na każdym monitorze, transformacje środków przy obrocie, zapis/odczyt, historię oraz poprzednie zachowania manekina i pokoju. W podglądzie wykonano zmianę pozycji X, cofanie i przełączanie znaczników dla prawego monitora. Gotowe Windows EXE przeszło kontrolę startu, dwóch monitorów, panelu i zmiany X 64,4 → 74,4 → cofnięcie 64,4 cm, bez błędów renderowania. START.cmd wskazuje wersję 0.5.0.





## Wersja 0.5.1 — spięcie pary monitorów



Panel Monitory ma trzy niezależne przełączniki: Kąt, Wysokość, Odległość. Nowe pary domyślnie mają wszystkie spięcia włączone. Kąt jest lustrzany (yaw drugiego = −yaw wybranego), wysokość podstawy Y wspólna, odległość oznacza lustrzane X wokół osi środka szerokości pokoju (X drugiego = szerokość pokoju − X wybranego) i wspólne Z. Przy manekinie na osi pokoju daje to symetryczną odległość do słuchacza. Parametry nie są automatycznym celowaniem w przemieszczoną głowę.



Rozpięcie zachowuje pozycje. Ponowne spięcie natychmiast wyrównuje tylko dany parametr drugiego monitora do wybranego. Edycja działa od strony L i R. Nie zmienia się drugiego monitora przy zmianie wyłącznie znaczników. Nieedytowane pola nie są zaokrąglane przy zastosowaniu formularza. Dane monitorLinks (angle/height/distance jako boolean) są przechowywane w dokumencie; Cofnij/Ponów obejmuje zarówno flagi, jak i obie pozycje w jednej operacji. Starsze pliki bez flag otrzymują spięcia tylko tam, gdzie dotychczasowe ustawienia były symetryczne, zachowując ich geometrię. monitor-links.js zawiera atomowe obliczenie zmian, niezależne od interfejsu.



Weryfikacja: 19 testów przeszło, obejmując sterowanie z obu stron, każde spięcie osobno, ponowne wyrównanie, cofanie/ponawianie, zapis i migrację starszych ustawień. W podglądzie sprawdzono zmianę X 70 cm → drugi X 177,7 cm, wspólną wysokość 110 cm i kąty ±25°, rozpięcie wysokości (R 100 cm / L 110 cm) i ponowne wyrównanie do L 110 cm.

Gotowa paczka Windows 0.5.1 przeszła kontrolę uruchomienia, domyślnych spięć, wspólnej wysokości, niezależnej edycji po rozpięciu i wyrównania po ponownym spięciu. Brak błędów renderowania. START.cmd wskazuje wersję 0.5.1.





## Wersja 0.5.2 — lasery tweeterów i trafienia w głowę



Dwa czerwone promienie startują w środkach powierzchni tweeterów i biegną zgodnie z normalną frontu po obrocie monitora. Kierunek nie jest korygowany do słuchacza. Promień kończy się na pierwszym przecięciu z elipsoidą głowy, oznaczonym czerwonym punktem; przy chybieniu biegnie do granicy pokoju. Wychylenie i obrót głowy zmieniają przecięcie, a ustawienie monitora zmienia pozycję/kierunek promienia. Żółte znaczniki przetworników pozostają. Lasery tweeterów można wyłączyć w panelu Monitory; flaga showTweeterRays zapisuje się z dokumentem i obejmuje ją historia.



aim-ray.js oblicza przecięcie promienia z analityczną elipsoidą w lokalnym układzie głowy oraz z gabarytem pokoju. tweeter-rays.js tworzy widok promieni i punktów. To pomoc w ustawianiu osi monitorów, bez symulacji propagacji dźwięku, odbić i charakterystyki kierunkowej. Linie i punkty mają umowną grubość dla czytelności.



Weryfikacja: 22 testy przeszły. Sprawdzono rzeczywiste początki i normalne obu tweeterów, dwa trafienia w głowę w pozycji bazowej, chybienie i granicę pokoju po obrocie monitora, chybienie przy wychyleniu tułowia 35° oraz zapis widoczności. W podglądzie 3D sprawdzono przejście z 2 trafień przy 10° do 0 trafień przy 35° i obejrzano promienie przy głowie z boku.

Gotowa aplikacja Windows 0.5.2 przeszła kontrolę startu: dwa promienie, dwa trafienia w głowę przy ustawieniu bazowym, poprawny panel i spięcia, bez błędów. W podglądzie sprawdzono także przełącznik widoczności laserów. START.cmd wskazuje tę wersję.





## Wersja 0.5.3 — czerwone zaznaczenie kolizji monitorów



Przenikanie monitora przez granice pokoju podświetla odpowiednią ścianę, podłogę lub sufit. Kolidująca powierzchnia pozostaje widoczna w otwartym widoku wnętrza i jest częściowo przezroczysta, żeby nie zasłonić kolizji. Gdy monitor wchodzi w obiekt sceny, cały obiekt staje się czerwony (manekin razem z obecnym zintegrowanym krzesłem). Przy kolizji dwóch monitorów oba są czerwone. Po odsunięciu oryginalne kolory wracają. Kolor kolizji ma pierwszeństwo przed kolorem zaznaczenia ściany.



monitor-collisions.js używa obróconego gabarytu monitora W/H/D 267/521/442 mm jako bryły kolizji; jest to konserwatywna obwiednia obejmująca tylny radiator i boki. Pozostałe obiekty sprawdza po ich poszczególnych siatkach: OBB odrzuca odległe części, a test trójkątów i zawierania wykrywa przecięcie powierzchni albo całkowite zawarcie monitora w dużym zamkniętym obiekcie. Nie jest używana jedna duża obwiednia całego człowieka. Sam styk bez wnikania (tolerancja 1 µm) nie oznacza kolizji.



Wszystkie fizyczne grupy sceny poza pokojem i pomocniczymi laserami uczestniczą w sprawdzaniu; obsługa nie zależy od typu wyposażenia, więc obejmuje późniejsze modele mebli/paneli. Siatki z userData.collision=false oraz znaczniki środków, logo i lampka monitora są pomijane. Aktualizacja następuje po zmianie pozy monitora/manekina, wymiarów, odczycie dokumentu i cofnięciu zmian. Czerwone kolory nie są zapisywane w dokumencie i nie zmieniają bazowych materiałów.



Weryfikacja: 27 testów przeszło. Sprawdzono sześć granic pokoju, gabaryt po obrocie, styk bez wnikania, człowieka, drugi monitor, zwykły obiekt i całkowite zawarcie w dużym obiekcie, powrót oryginalnych kolorów oraz widoczność kolidującej ściany w cutaway. W podglądzie przesunięcie X do 5 cm podświetliło lewą ścianę, a przesunięcie X/Z do 123,9/155 cm podświetliło manekina i przywróciło kolor ściany.

Gotowy Windows 0.5.3 przeszedł kontrolę uruchomienia, kolizji z lewą ścianą i manekinem oraz powrotu do stanu bez kolizji po odsunięciu. Nie zgłoszono błędów renderowania. START.cmd wskazuje tę wersję.





## Wersja 0.6.0 — pierwsze odbicia i kolory par przetworników



Panel Odbicia zawiera listę pięciu rodzajów przetworników MM27 z osobnymi zaznaczeniami L/R, wyborem ucha (oba/lewe/prawe), włączeniem punktów oraz opcjonalnym rysowaniem dróg źródło → powierzchnia → ucho. Skróty Tweetery / Wszystkie / Żadne wybierają odpowiedni zestaw. Domyślnie oba tweetery i oba uszy dają 24 punkty (2 źródła × 2 uszy × 6 powierzchni), wszystkie 10 przetworników dają 120. Punkt jest rysowany na każdej z czterech ścian, podłodze i suficie. W rzucie prostopadłym są widoczne tylko punkty/drogi odpowiedniej powierzchni; w cutaway punkty pozostają w prawidłowych miejscach nawet gdy dana powierzchnia jest ukryta.



Stałe kolory odpowiadających przetworników w obu monitorach: górny midbass niebieski (#47c8ff), tweeter żółty (#ffdc32), dolny midbass fioletowy (#bba0ff), lewy boczny subwoofer zielony (#6be68b), prawy boczny subwoofer różowy (#f57ddd). Środki głośników, lista, punkty i drogi odbić używają tego samego koloru. Czerwony kolor kolizji nadal ma pierwszeństwo na obiekcie kolidującym.



reflection-model.js oblicza punkty pierwszego odbicia metodą źródła pozornego: odbija pozycję odbiornika (ucha) względem płaszczyzny, przecina prostą do źródła z płaszczyzną i sprawdza granice powierzchni. Punkt spełnia prawo równych kątów i odwrotność drogi; długość łamanej równa się odległości do odbiornika pozornego. Środki przetworników i uszu pochodzą z aktualnych macierzy świata modeli. Źródła/odbiorniki poza pokojem i przypadki zdegenerowane nie generują punktów. Konstrukcja źródeł pozornych jest opisana w [materiałach TU Berlin / pyfar](https://pyfar-oer.readthedocs.io/en/latest/oer/courses/Virtual_Acoustic_Reality_TUB/room_simulation_ism/image_source_model.html).



To punkty geometryczne dla płaskich powierzchni i źródeł punktowych; nie uwzględniają tłumienia, częstotliwości, kierunkowości przetworników, przesłaniania wyposażeniem/głową, dyfrakcji ani dalszych odbić. Laser osiowy monitora pozostaje osobną pomocą celowania. Punkty odbić nie są wyznaczane przez odbijanie samego lasera.



reflection-view.js i reflection-panel.js oddzielają prezentację i ustawienia. Grupa odbić jest pomocnicza i wyłączona z kolizji. Ustawienia reflections zapisują się w dokumencie, migrują starsze pliki do domyślnych tweeterów i obejmuje je Cofnij/Ponów. Aktualizacje pozy manekina, monitorów, wymiarów i odczytu pliku przeliczają punkty bez resetowania kamery przy zmianie odbić.



Weryfikacja: 31 testów przeszło. Sprawdzono sześć płaszczyzn, znany punkt analityczny, prawo odbicia, długość drogi do obrazu, wzajemność źródło/ucho, aktualizacje pozy i obrotu, 24/120/6/0 punktów według wyboru, pięć spójnych kolorów, zapis, migrację i historię. Podgląd sprawdzono dla wszystkich przetworników (120), jednego ucha (60) i dróg odbić.



Weryfikacja gotowej aplikacji Windows 0.6.0: uruchomienie zakończone kodem 0, brak błędów; liczby punktów 24 / 120 / 60 / 6, cofanie do 12, wyłączenie do 0 i przywrócenie do 24. Sprawdzono również widok prostopadły do podłogi: widoczne wyłącznie odbicia i drogi dla wybranej powierzchni.



0.6.2: wskaźnik orientacji zaokrągla błędy numeryczne poniżej 1e-6, aby podpisy i linie nie zmieniały stanu przy pionowym rzucie podłogi lub sufitu. Test regresji sprawdza oba kierunki rzutu i dodatnie/ujemne zaburzenia obrotu. 33 testy zaliczone; kontrola gotowego EXE zaliczona.



0.6.3: Ctrl w panelu wychylenia blokuje dominującą oś od bieżącej pozycji; druga składowa pozostaje stała także na granicy zakresu. Zwolnienie Ctrl przywraca swobodny ruch, Esc anuluje, zatwierdzenie trafia do historii. 35 testów oraz kontrola EXE zaliczone.



0.7.0: tylne drzwi z framugą, przednia wnęka okna z górnym i dolnym skrzydłem oraz kaloryfer po prawej stronie (od wnętrza). Wymiary przybliżone: drzwi 85 x 205 cm; okno 105 x 135 cm, od podłogi 85 cm, wnęka 20 cm; kaloryfer 45 x 65 cm, od podłogi 12 cm. Panel edycji wszystkich wymiarów w cm, środek X w układzie pokoju. roomFeatures w dokumencie SI; starsze pliki otrzymują wartości początkowe. Otwory są wycięte w geometrii ścian. Elementy obsługują kolizje monitorów. Geometryczne odbicia nadal korzystają z sześciu płaszczyzn obrysu pomieszczenia, bez uwzględniania wnęk ani materiałów okna/drzwi. 38 testów zaliczonych; EXE zweryfikowany, w tym zmiana szerokości okna i cofnięcie.



0.8.0: skrzydła, ramy i szyby okna ukryte, wnęka i parapet widoczne. Kliknięcie drzwi, wnęki, kaloryfera, monitora lub manekina wybiera obiekt i otwiera panel przesunięcia X/Y/Z (cm) i obrotów X/Y/Z (stopnie). Transformacje są przesunięciami względem bazowego modelu, zapisanymi w doc.transforms; starsze pliki domyślnie mają pusty zestaw. Obroty w kolejności Euler XYZ. Spiście monitorów respektuje odbicie X i yaw, wspólne Y i Z. Zmiana transformacji aktualizuje kolizje, promienie i odbicia; otwory ścienne pozostają w położeniu określonym przez roomFeatures (edycja panelu Drzwi i okno). 41 testów zaliczonych, EXE zweryfikowany. W przeglądarce sprawdzono wybór monitora R kliknięciem, przesunięcie Y o 10 cm i obrót X o 15 stopni.



0.9.0: wybór obiektu lub powierzchni, następnie Alt + klik drugiego elementu pokazuje najkrótszą odległość pomiędzy ich fizycznymi trójkątami. Dotyczy rzeczywistej geometrii, uwzględnia obroty i otwory ścian, pomija ukryte okno, markery i pomoce. Drugi element jest wyróżniony żółtą ramką, linia łączy najbliższe punkty, etykieta podaje cm. Pomiar aktualizuje się po zmianach i cofnięciu, zwykłe kliknięcie rozpoczyna nowy wybór; Esc lub × zamyka. 44 testy zaliczone; EXE zweryfikowany. W przeglądarce rzeczywisty Alt+klik sprawdzono dla monitora R i manekina (55,1 cm) oraz lewej ściany i manekina (89,4 cm).



0.9.1: panel pomiaru stale w prawym górnym rogu widoku. Wybór przesuwanego obiektu spośród dwóch mierzonych (ściany są nieruchome), przyciski Bliżej/Dalej i krok 0,1–100 cm, domyślnie 1 cm. Ruch w kierunku linii pomiaru, zmniejszanie zatrzymuje się na kontakcie; spięcia monitorów i historia zmian zachowane. 46 testów zaliczonych; kontrola EXE zaliczona. Interaktywnie sprawdzono monitor R względem manekina: 55,1 → 56,1 → 55,1 cm, przywrócenie transformacji i stałe położenie panelu.



0.9.2: uproszczony panel pomiaru - pole docelowej odległości (cm) i Zastosuj/Enter; usunięto krok, wybór obiektu i Bliżej/Dalej. Przesuwany jest pierwszy wybrany obiekt; gdy pierwszy element to ściana, przesuwany jest drugi obiekt. Iteracyjne dopasowanie do faktycznej geometrii i spięć, jedna zmiana historii. Nieosiągalny układ nie zmienia dokumentu. 46 testów zaliczone; EXE zweryfikowany. Rzeczywisty widok sprawdzony: 55,1 → 50,0 cm (przycisk), następnie 70,0 cm (Enter).



0.9.4: pomiar Shift + klik zamiast Alt. Wycięcia ścian uwzględniają teraz ten sam transform co wnęka okna i drzwi: przesunięcie X/Y, rzut obróconego obrysu na płaszczyznę ściany. Obrys wycięcia przycięty do granic ściany; poprzedni otwór jest wypełniany przy przebudowie. Ruch Z wnęki nie zmienia płaszczyzny ściany. Podgląd obliczeń docelowej odległości także przebudowuje otwór dla próbnego położenia. 48 testów zaliczone, w tym raycast w nowym otworze, wypełnienie starego miejsca oraz zachowanie granic ściany. Gotowy EXE zweryfikowany.



0.9.5: przytrzymanie bocznej strzałki zmienia pole o 1 cm natychmiast, po 350 ms powtarza co 90 ms. Zatrzymanie po puszczeniu, anulowaniu, utracie fokusu lub ukryciu strony/pomiaru. Pojedynczy klik bez podwójnego kroku, aktywacja klawiaturą zachowana. Wysokość pola i Zastosuj 44 px, wspólna czcionka 16 px. 50 testów zaliczone oraz kontrola EXE.



0.9.9: panel odległości bez Zastosuj. Każda poprawna wartość input od razu aktualizuje obiekt i pomiar, podobnie kliknięcie/przytrzymanie bocznej strzałki. Edycja nie przepisuje aktywnego pola podczas wpisywania, puste/przejściowe niepoprawne wartości nie zmieniają sceny. Wpisywanie tworzy jeden wpis historii po zakończeniu edycji, strzałki zachowują kroki historii. 50 testów oraz kontrola EXE zaliczone. Interaktywnie zweryfikowano 55,1 → 50,0 po wpisaniu oraz 51,0 po strzałce, bez zatwierdzania.



0.10.0: zastąpiono model okna pełną wnęką od poziomu podłogi. Brak szyb, ram i parapetu. Wnęka ma własne boki i tył; domyślnie sięga sufitu. Podłoga, sufit i obrys pokoju zawierają prostokątne poszerzenie o 8,6 cm przy szerokości 103,8 cm i odstępach 55,3/88,6 cm. Obrys podłogi widoczny również w rzucie prostopadłym. 52 testy zaliczone; EXE zweryfikowany. Rzut podłogi sprawdzony w działającym widoku, screenshot floor-niche-outline.png. Dotychczasowy prostokątny model odbić i obwiedni kolizji pokoju pozostaje przybliżeniem bazowego pokoju.





## Edytor obrysu powierzchni — 0.11.0



Kliknięcie podłogi, sufitu lub ściany otwiera moduł **Powierzchnia**. Plan X/Z przedstawia wspólny poziomy obrys pomieszczenia. Przeciąganie wierzchołków lub krawędzi zmienia kształt podłogi i sufitu, a każda krawędź tworzy pionową ścianę na pełną wysokość pokoju. Skos oznacza ścięcie narożnika w planie; ten etap nie zmienia nachylenia sufitu ani profilu ściany w pionie.



- **Wierzchołki / Krawędzie**: wybór sposobu zaznaczania. Ctrl dodaje lub odznacza element, przeciągnięcie pustego miejsca zaznacza ramką. W trybie krawędzi ramka obejmuje ich środki.

- Przeciągnięcie zaznaczonego elementu przesuwa cały wybór, Shift ogranicza ruch do osi X albo Z.

- **Dodaj wierzchołek** dzieli zaznaczoną krawędź na połowy.

- **Dodaj wnękę** wstawia prostokątne rozszerzenie pośrodku wybranej krawędzi. Szerokość i głębokość wpisuje się w cm; ujemna głębokość tworzy występ do wnętrza pokoju.

- **Ścinaj narożnik** zastępuje jeden wierzchołek dwoma punktami, odsuniętymi o wpisaną odległość wzdłuż obu boków.

- Delete/Backspace w aktywnym planie usuwa zaznaczone punkty; usunięcie krawędzi rozpuszcza jej końcowy wierzchołek i łączy sąsiadów. Obrys pozostaje zamknięty. Ctrl+Z / Ctrl+Y cofa i ponawia.



Dokument przechowuje `roomShape: [{x,z}, ...]` w metrach, w kolejności przeciwnej do ruchu wskazówek zegara w X/Z. `null` zachowuje dotychczasową parametryczną geometrię. Własny obrys jest sprawdzany przy imporcie i każdej zmianie: 3–128 punktów, krawędzie co najmniej 2 mm, bez przecięć lub nakładających się boków. Przeciąganie zapisuje jeden krok historii po puszczeniu myszy. Nieprawidłowy ruch nie zmienia ostatniego poprawnego modelu.



Po pierwszej edycji wnęka okna staje się częścią obrysu i zmienia się ją w tym module. Przedmioty zachowują pozycje w świecie. Drzwi i kaloryfer nie są automatycznie przenoszone wraz z przebudowaną ścianą. Zmiana podstawowych wymiarów skaluje własny obrys w X/Z; wysokość nadal jest wspólna. Pole powierzchni i objętość uwzględniają wielokąt.



Kolizje monitorów sprawdzają rzeczywiste powierzchnie własnego obrysu. Odbicia korzystają z płaszczyzn skośnych i granic wielokątów oraz odrzucają drogi zasłonięte przez ściany; promienie tweeterów kończą się na aktualnych ścianach. Nadal są to konstrukcje geometryczne bez symulacji materiałów ani odpowiedzi częstotliwościowej.





## Bezpośrednia edycja 3D — 0.12.0



Moduł Powierzchnia pokazuje punkty i krawędzie w głównym widoku. Pływający pasek przełącza Punkty / Krawędzie / Ściany. Kliknięcie ściany poza trybem edycji również otwiera narzędzia i okno transformacji. Zaznaczanie wielu punktów i krawędzi: Ctrl lub ramka. Przeciąganie odbywa się w płaszczyźnie ekranu, Shift wybiera dominującą oś świata. W rzucie powierzchni widoczne są jej punkty.



Okno przy zaznaczeniu zawiera pozycję środka w cm i obrót XYZ w stopniach. Obrót działa wokół środka zaznaczenia, kolejność Euler XYZ. Pola pozycji są bezwzględne, pola obrotu liczone względem stanu przy zaznaczeniu; zmiany są natychmiastowe. Pojedynczy punkt nie ma własnej orientacji, dlatego pola obrotu są nieaktywne; dwie lub więcej pozycji oraz ściany można obracać.



`roomMesh` przechowuje wspólne wierzchołki XYZ i powierzchnie jako listy indeksów. Przesunięcie lub obrót punktów zmienia każdą przylegającą powierzchnię. Powierzchnie niepłaskie są triangulowane. Walidacja zachowuje zamkniętą topologię, odrzuca zdegenerowane ściany i zbyt krótkie krawędzie; nie sprawdza wszystkich przecięć powierzchni w przestrzeni, więc duże deformacje wymagają kontroli wizualnej.



Dodaj punkt dzieli krawędź w obu przyległych powierzchniach. Delete rozpuszcza punkty (dla krawędzi jej końcowy punkt), łącząc sąsiadów; operacje tworzące otwarty pokój są odrzucane. Całej ściany nie usuwa się jako otworu. Wnęki i skosy są dostępne w tym samym oknie dla pionowych ścian oraz poziomej podłogi i sufitu. Po swobodnym odkształceniu XYZ mogą wymagać przywrócenia geometrii pionowej. Cofanie, zapis i import uwzględniają siatkę 3D. Wyposażenie zachowuje pozycję świata.



## Zaznaczanie bez trybów — 0.13.0

Punkty i krawędzie są dostępne od uruchomienia w głównym widoku. Kliknięcie rogu wybiera wierzchołek, kliknięcie krawędzi wybiera krawędź, kliknięcie powierzchni wybiera powierzchnię. Punkty mają pierwszeństwo przed krawędziami, a krawędzie przed powierzchniami. Nie ma przycisku Powierzchnia ani przełączników sposobu wybierania. Ctrl dodaje elementy tego samego rodzaju; Ctrl i przeciągnięcie pustego miejsca zaznacza ramką. Zwykłe przeciąganie widoku nadal obraca kamerę.

Włączony Caps Lock blokuje wybieranie ścian i wyposażenia; uchwyty krawędzi i punktów nadal działają. Esc wyczyści zaznaczenie geometrii i przedmiotów, obrys zaznaczenia, pomiar odległości oraz okno transformacji — także gdy fokus znajduje się w polu. Aktywne przeciąganie geometrii jest anulowane.


## Uchwyt przesunięcia w osiach — 0.14.0

Zaznaczenie punktu, krawędzi lub powierzchni pokazuje w lewym dolnym rogu układ XYZ, orientowany zgodnie z kamerą. Przeciągnięcie linii przesuwa wspólne wierzchołki tylko w wybranej osi świata. Skala uchwytu: 1 piksel ruchu wzdłuż kierunku osi = 1 cm. Dla osi skierowanej wzdłuż patrzenia pionowe przeciąganie steruje odległością. W modelu nadal Y oznacza wysokość, X szerokość, Z długość.

Po puszczeniu pole przesunięcia jest zaznaczone i gotowe do pisania. Wartość jest w cm, względem położenia przy chwyceniu osi; zastępuje wynik przeciągnięcia, nie dodaje się do niego. Wartości ujemne przesuwają w przeciwnym kierunku. Obsługiwane są przecinek i kropka dziesiętna. Zmiany widać natychmiast, Enter zatwierdza. Obrót pozostaje w istniejącym oknie XYZ. Zmiana zaznaczenia resetuje wybór osi. Esc czyści zaznaczenie i anuluje aktywne przeciąganie.


## Widoczność uchwytów — 0.15.0

Bez Caps Lock rysowane są tylko zaznaczone punkty i krawędzie. Niewidoczne obszary trafienia pozostają aktywne, dlatego kliknięcie narożnika lub krawędzi nadal je wybiera. Caps Lock pokazuje wszystkie uchwyty widocznego rzutu. Stan jest odczytywany ze zdarzeń klawiatury i myszy. Kliknięcie pustego tła czyści zaznaczenie geometrii, obiektów, pomiar oraz okna edycji i przesunięcia, tak jak Esc. Przeciąganie kamery nie jest traktowane jako kliknięcie pustego miejsca.


## Historia pól — 0.16.0

Ctrl+Z oraz Ctrl+Y/Ctrl+Shift+Z przywracają model i wartości pól, także aktywnego pola. Historia obejmuje również niezastosowane wartości formularzy wymiarów, cech i obiektów. Aktualna edycja jest dołączana do historii przed cofnięciem. Stan edytora osi obejmuje punkt początkowy przesunięcia, wybraną oś i wartość, więc cofnięcie nie pozostawia starej liczby ani nie zmienia interpretacji następnego wpisu.

Migawki pól i stanu edytora są tymczasowe i nie trafiają do plików pokoju. Pola monitorów i obiektów przywraca się tylko w zgodnym kontekście wybranego obiektu. Otwarcie i utworzenie dokumentu resetuje historię pól.

## Dodawanie punktu na krawędzi — 0.41.0

Kliknij wierzchołek, a następnie przesuń kursor po jednej z przylegających krawędzi. Żółty punkt pokazuje pozycję nowego wierzchołka. W polu można wpisać odległość od wybranego wierzchołka w centymetrach (np. 25 cm) lub procent długości krawędzi (np. 50%). Enter, kliknięcie punktu albo przycisku Dodaj wstawia wierzchołek. Punkt zostaje automatycznie zaznaczony, więc można go przesuwać w 3D. Sąsiadujące powierzchnie korzystają z tego samego punktu i pozostają połączone. Punkt musi leżeć wewnątrz krawędzi, minimum 0,2 cm od jej końców. Esc lub kliknięcie pustego miejsca anuluje podgląd i zaznaczenie. Ctrl+Z cofa wstawienie; Ctrl+Y ponawia.

Przy wskazanej krawędzi można od razu zacząć wpisywać liczbę bez klikania pola. Pierwszy znak przenosi fokus do pola i zastępuje wartość podglądu. Dodanie punktu w rzucie prostopadłym oraz Ctrl+Z pozostawiają ten rzut aktywny.

## Korekta wnęki i schodek — 0.43.0

Wnęka przy przedniej ścianie zaczyna się 55,3 cm od lewej ściany i kończy 88,6 cm przed prawą. Jej szerokość wynosi 103,8 cm. Całkowita głębokość, mierzona od płaszczyzny przedniej ściany do tylnej ścianki, wynosi 15,1 cm. Schodek o wysokości 10 cm zajmuje tylne 6,5 cm tej głębokości: jego przednia krawędź leży 8,6 cm za płaszczyzną ściany. Nie ma szyby ani ramy okna. Parametry schodka są dostępne w panelu „Drzwi i okno”. Nowe pokoje i starsze dokumenty bez edytowanego obrysu używają skorygowanych wymiarów; starsze pliki z własną siatką zachowują zapisany obrys.

## Wysokość wnęki — 0.44.0

Schodek w tylnej części wnęki ma 8 cm wysokości. Wnęka kończy się na wysokości 222,0 cm od podłogi: 38,5 cm poniżej sufitu o wysokości 260,5 cm. Jej górna pozioma powierzchnia i pas pełnej ściany nad otworem należą do geometrii pokoju. Domyślna siatka zachowuje je przy dzieleniu krawędzi, przesuwaniu wierzchołków oraz dodawaniu wnęk i skosów na innych krawędziach.

## Grzejnik — 0.45.0

Grzejnik na przedniej ścianie ma szerokość 60,3 cm, wysokość 60 cm i grubość 10 cm. Jego dolna krawędź jest 14,7 cm nad podłogą, prawa krawędź 14,4 cm od prawej ściany. Tylna płaszczyzna jest odsunięta o 3 cm od ściany, więc przednia wystaje 13 cm w głąb pokoju. Cztery uchwyty, rozmieszczone parami u góry i na dole, łączą grzejnik ze ścianą. Wymiary i odstęp od ściany można zmieniać w panelu „Drzwi i okno”.

## Drzwi i włącznik — 0.46.0

Na tylnej ścianie lewa zewnętrzna krawędź framugi leży 2,8 cm od lewej ściany, a prawa 150,6 cm od prawej ściany. Prawa krawędź skrzydła drzwi jest 156,7 cm od prawej ściany. Lewa część framugi ma 2,8 cm, prawa 6,1 cm; wynikają one z podanych odległości. Framuga wystaje 1,5 cm w stronę pokoju. Jej górna krawędź jest 50,5 cm od sufitu, a górna krawędź skrzydła 56,3 cm od sufitu, więc górna część framugi ma 5,8 cm.

Kwadratowy włącznik światła zajmuje zakres 130,8–142,0 cm od lewej ściany. Jego środek znajduje się 150 cm nad podłogą. Włącznik jest osobnym obiektem, który można zaznaczyć i przesuwać niezależnie od drzwi.

## Listwa podłogowa — 0.47.0

Wzdłuż wewnętrznego obwodu podłogi biegnie listwa o wysokości 4 cm i grubości 1,5 cm. Obejmuje również wnękę okna i dopasowuje się do zmian obrysu podłogi, w tym skośnych krawędzi. Na tylnej ścianie jest przerwana na całej szerokości zewnętrznego obrysu drzwi i framugi. Listwa jest elementem wykończenia powiązanym z geometrią pokoju, a nie osobnym obiektem do przesuwania.

## Korekta prawej framugi — 0.48.0

Oba widoczne boki framugi mają po 2,8 cm szerokości. Pomiędzy prawą krawędzią skrzydła a prawym bokiem framugi znajduje się osobny fragment ściany o szerokości 3,3 cm. Dzięki temu zewnętrzna krawędź framugi pozostaje 150,6 cm od prawej ściany, a prawa krawędź skrzydła 156,7 cm od niej. Starsze dokumenty z domyślnym prawym bokiem framugi o szerokości 6,1 cm są korygowane przy otwarciu.

## Prawidłowa grubość obu boków framugi — 0.49.0

Grubość każdego bocznego elementu framugi wynosi 6,1 cm (156,7 cm − 150,6 cm). Odległość 2,8 cm oznacza wyłącznie odstęp od lewej ściany do zewnętrznej krawędzi framugi. Lewy bok zajmuje zakres 2,8–8,9 cm, prawy 91,0–97,1 cm od lewej ściany. Skrzydło zajmuje zakres 8,9–91,0 cm. Nie ma dodatkowego fragmentu ściany między skrzydłem a prawą framugą. Poprzedni opis i model z 0.48.0 były błędne; dokumenty z tym modelem są korygowane przy otwarciu.

## Łączenia listew — 0.50.0

Listwy zachowują przekrój 4 × 1,5 cm i tworzą wspólne, docięte narożniki. Sąsiednie odcinki używają tych samych punktów styku na zewnętrznej i wewnętrznej krawędzi. Nie powstają szczeliny na rogach wypukłych wnęki ani na skośnych krawędziach po edycji obrysu.

## Skrzydło Voster Vinci 10 — 0.51.0

Skrzydło drzwi odpowiada wariantowi Voster Vinci 10, prawe, w kolorze kaszmir. Ma katalogowe wymiary 84,4 × 203 × 3,8 cm, sześć poziomych pasów mlecznego szkła o szerokości 58 cm i wysokości 3,5 cm, trzy srebrne zawiasy po prawej oraz czarną klamkę i szyld zamka po lewej stronie patrząc od wnętrza pokoju. Skrzydło przylgowe zachodzi na zmierzone światło ościeżnicy po 1,15 cm z obu stron; jej położenie i obie szerokości 6,1 cm pozostają zgodne z pomiarami użytkownika. Nad podłogą pozostaje szczelina 1,2 cm, dzięki czemu górna krawędź skrzydła zachowuje zmierzoną wysokość.

## Pierwsze odbicia i geometria wnęki — 0.52.0

Wnęka okna, jej boczne ścianki, sufit i schodek są powierzchniami pokoju. Obliczanie pierwszych odbić korzysta z rzeczywistej, ograniczonej geometrii tych powierzchni, także po przejściu do edytowalnej siatki pokoju. Dawna płaszczyzna przedniej ściany nie generuje odbić w obszarze otworu. Osobna wizualizacja wnęki jest ukryta, gdy te powierzchnie są częścią pokoju.

## Lampa sufitowa Govee H60A6 — 0.53.0

Na środku sufitu znajduje się okrągły plafon Govee Ceiling Light Pro H60A6 (H60A6301). Model ma średnicę 38 cm i wysokość 6 cm, jasny dyfuzor oraz subtelny pierścień. Pozostaje osobnym obiektem sceny, który można zaznaczyć.

## Kierunek otwierania drzwi i wysokość włącznika — 0.54.0

Od strony pokoju klamka znajduje się po lewej, a trzy zawiasy po prawej. Skrzydło jest osadzone po stronie wnętrza pokoju.

## Korekta wysokości włącznika — 0.55.0

Klamka pozostaje w oryginalnym położeniu modelu, 111,9 cm nad podłogą. Środek włącznika obniżono do 121,9 cm, czyli 10 cm nad klamką. Dolna krawędź kwadratowej płytki jest na wysokości 116,3 cm. Starszy dokument z niezmienionym domyślnym włącznikiem na 150 cm jest przenoszony na nową wysokość; ręcznie zmienione położenie zostaje zachowane.

## Pozycja odsłuchowa i trójkąt monitorów — 0.56.0

W domyślnej pozie z lekkim pochyleniem oboje uszu manekina znajduje się na 34% długości pokoju, licząc od przedniej ściany. Środki tweeterów są dwoma przednimi wierzchołkami trójkąta równobocznego o boku 108 cm. Trzeci wierzchołek wypada 14,4 cm za linią uszu; obie boczne krawędzie przechodzą przez odpowiednie uszy. Monitory są zwrócone wzdłuż tych krawędzi. Układ jest przeliczany dla nowego pokoju i przy zmianie jego wymiarów, jeżeli pozycje odsłuchowe nie zostały ręcznie zmienione. Starsze dokumenty z nietkniętym pierwotnym ustawieniem są przenoszone na nowy układ.

## Odległość monitorów wzdłuż boków trójkąta — 0.57.0

Panel monitorów pozwala podać poziomą odległość między środkiem tweetera a odpowiednim uchem w centymetrach. Zmiana przesuwa monitor po linii łączącej te punkty, zachowując jego wysokość i obrót. Przy spiętej odległości oba monitory otrzymują tę samą wartość; po rozpięciu można ustawiać je osobno.

## Stojak rack w tylnym rogu — 0.58.0

Nowy pokój zawiera otwarty, dwusłupkowy stojak RIVECO 19″ 15U w tylnym prawym rogu, poza światłem drzwi. Szerokość modelu wynosi około 50 cm, głębokość około 30 cm, a wysokość około 71 cm; rozstaw jednostek montażowych odpowiada 15 × 44,45 mm. Wymiary zewnętrzne, których nie potwierdza dostępny opis wariantu, są przybliżeniem na podstawie zdjęcia. Stojak można zaznaczać i przemieszczać narzędziami obiektów. W starszym dokumencie można go dodać z panelu Obiekt; istniejące obiekty pozostają bez zmian. Domyślnie ustawiony stojak podąża za tylnym prawym rogiem po zmianie wymiarów pokoju.

## Korekta stojaka RIVECO JAZZ 15U — 0.59.0

Zgodnie z dostarczonym zdjęciem wymiarowym stojak ma 73 cm wysokości, 50 cm szerokości i 30 cm głębokości. Pionowe szyny są pochylone o 5° ku tyłowi. Mają wąskie, zagięte profile zamiast masywnych słupków; dolna belka jest wyższa od górnej. Podstawa składa się z dwóch cienkich stóp biegnących w głąb stojaka, ze skośnymi bocznymi ściankami i czterema gumowymi podkładkami. Wymiary zewnętrzne są potwierdzone przez użytkownika; szerokości profili i grubość blachy pozostają przybliżeniem wizualnym.

## Kierunek zwężenia stopek i logo — 0.61.0

Obie boczne stopki mają być najwyższe przy szynach i zwężać się ku wolnym końcom. Na przedniej dolnej belce znajduje się białe oznaczenie RIVECO z symbolem, zwrócone ku wnętrzu pokoju.

## Korekta orientacji stopek — 0.62.0

Pionowe szyny znajdują się z tyłu stojaka, a stopki biegną od nich ku przodowi. Ich wolne końce są niższe od części przy szynach. Poprzedni model miał zamienione przód i tył stojaka, dlatego mimo zmiany współrzędnych skos nadal wyglądał odwrotnie w widoku pokoju.

## Oznaczenie i śruby dolnej belki — 0.63.0

Na środku dolnej belki jest duży biały symbol RIVECO z małym napisem pod spodem, zgodnie ze zdjęciem użytkownika. Po obu końcach belki są po dwie widoczne od przodu śruby z metalowymi obwódkami i ciemnymi środkami.

## Stała prędkość nawigacji — 0.64.0

Przybliżanie gestem touchpada i przesuwanie kamery za pomocą Shift + przeciągnięcie myszy używają stałej skali ruchu względem pozycji początkowej widoku. Blisko obiektu kolejne gesty nie stają się coraz wolniejsze. Zasada obowiązuje także w rzucie prostopadłym.
