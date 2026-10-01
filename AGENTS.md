# Reguły pracy nad AKUSTYKA

1. Każda zakończona zmiana w projekcie ma otrzymać lokalny commit przed przekazaniem wyniku użytkownikowi. Dopuszczalne są logiczne commity cząstkowe. Nie wysyłaj commitów na zdalne repozytorium bez osobnego polecenia użytkownika. Nie włączaj do commita cudzych lub niezwiązanych zmian.
2. W `product/builds/` mogą pozostawać najwyżej dwie wersjonowane paczki robocze Windows: najnowsza i bezpośrednio poprzednia. Po udanym pakowaniu usuń starsze paczki i katalog pośredni. Przed usuwaniem sprawdź dokładne ścieżki i czy starsza paczka nie jest używana przez działający proces. Nie usuwaj pakietów wydań z `product/releases/` w ramach porządkowania buildów.
3. Jedynym katalogiem tego projektu jest `C:\AKUSTYKA`. Stosuj strukturę Project Managera: źródła w `product/source/`, wyniki roboczych kompilacji w `product/builds/`, pakiety wydań w `product/releases/`, pliki uruchomieniowe w `product/runtime/`, dokumentację produktu w `product/documentation/`, a ustalenia organizacyjne w `management/documentation/`. Nie zapisuj plików projektu w `C:\CODE\inbox` tylko dlatego, że jest bieżącym katalogiem rozmowy.

Przed zakończeniem pracy sprawdź wynik odpowiednimi testami, stan `git status` oraz położenie artefaktów względem katalogu projektu. Jeśli czegoś nie da się zatwierdzić lub uporządkować, podaj dokładnie, co pozostało.
