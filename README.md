# Verl kompakt

Nachrichten, Veranstaltungen, Abfallkalender, SC Verl und Stadtgeschichte. Unabhängiges privates Informationsangebot für Verl.

Offizielle Termine und Sportdaten werden stündlich aus den angegebenen Quellen aktualisiert. Eigene redaktionelle Zusammenfassungen stehen in articles.json; digest.json dokumentiert den letzten redaktionellen Abruf.

Familie & Kurse bündelt altersbezogene Angebote ab 7 Jahren von Droste-Haus und TV Verl. Die Altersauswahl und Stadt-Favoriten bleiben ausschließlich im Browser des jeweiligen Geräts. Der Familienkalender enthält offiziell bestätigte NRW-Ferien, Anmeldestarts und Angebote; ein ICS-Export ist eine Momentaufnahme.

Die GitHub-Aktion prüft TV-Verl-Sportangebote, öffentlich eingebundene Yolawo-Kurse, Ferien, Mobilitätsquellen und Polizeimeldungen stündlich. Polizeimeldungen werden anhand der tatsächlichen Ortsdateline auf Verl und bestätigte Ortsteile begrenzt; eine bloße Nennung der Verler Straße reicht nicht. Archivierte Meldungen behalten ihr ursprüngliches Veröffentlichungsdatum.

Busabfahrten für vier bestätigte Verler Haltestellen werden planmäßig alle fünf Minuten aus dem offiziellen moBiel/VRR-Monitor abgerufen. GitHub-Zeitpläne können verzögert sein. Zeitstempel, Echtzeit-/Fahrplanstatus und Fehler werden pro Haltestelle erhalten; die App blendet einen über zehn Minuten alten Stand aus. Fehler dürfen nicht als leere aktuelle Abfahrtstafel erscheinen.

`droste-program.json` ist eine redaktionell aus dem offiziell verlinkten Canva-Programm geprüfte Momentaufnahme. `checkedAt` bezeichnet die tatsächliche Inhaltsprüfung. Die stündliche Website-Prüfung ersetzt keine Inhaltsprüfung des Programmhefts. Die bestehende redaktionelle Pflege soll das aktuelle offiziell verlinkte Programm erneut prüfen. Keine Termine, Serien-Enddaten, freien Plätze oder Altersgrenzen erfinden; Originaltexte und Bilder nicht übernehmen.

Quellcode unter `development/`: Mit den vorhandenen Abhängigkeiten `node development/build.mjs` ausführen. Bestehende Daten und PWA-Adresse bleiben erhalten. `node refresh-data.mjs` und `node refresh-departures.mjs` pflegen die veröffentlichten Daten getrennt.

Deutsch/Russisch: Oben lässt sich die Sprache pro Gerät umschalten. Menüs, Artikel, aktuelle Angebote, Bildunterschriften, Hinweise, Kalender und die wichtigsten russischen Suchbegriffe sind berücksichtigt. Deutsche Originaldaten bleiben unverändert; Originalnamen von Straßen, Haltestellen und Organisationen dienen der Orientierung. Sprache und Daten werden nur lokal im Browser gespeichert. Die gleichen PWA-Adresse und das gleiche Manifest bleiben gültig.

`ui-ru.json` enthält redaktionell geprüfte Übersetzungen; exakte deutsche Texte sind die Schlüssel. Alle aktuellen Nachrichten und die derzeit erfassten Inhaltsbausteine wurden in dieser Fassung sprachlich geprüft. `russian.json` ist das veröffentlichte Übersetzungsverzeichnis. Es wird vor der Veröffentlichung bei neuen Texten inkrementell ergänzt. `translate-russian.py` verwendet lokale CTranslate2-/SentencePiece-Modelle aus Argos (Deutsch–Englisch–Russisch); es überträgt keine Inhalte an Übersetzungsdienste. Modellarchive kommen von https://data.argosopentech.com/argospm/v1/ und werden gegen feste SHA-256-Werte geprüft. Modellgewichte liegen nur im Actions-Cache. Neu generierte Übersetzungen können Fehler enthalten; Zahlen werden bei der automatischen Übersetzung geschützt. Die Originaldateien articles.json und live.json werden dabei nicht sprachlich überschrieben.

Nachrichtenpflege: Neue deutsche Zusammenfassungen zusätzlich sorgfältig auf Russisch übertragen und als exakte Textpaare in ui-ru.json ergänzen. Bestehende Schlüssel erhalten; Angaben, Zahlen und Vorbehalte nicht verändern. Der Veröffentlichungsablauf übernimmt die neuen Paare. Für ein erneutes Build verwendet development/build.mjs die aktuelle ui-ru.json im Repository-Stamm.

Externe Seiten öffnen im russischen Modus eine Auswahl zwischen Original und optionalem Google-Übersetzungslink. Google kann eigene Prüfungen verlangen; der Link ist kein Bestandteil der internen Übersetzungsfunktion. Texte in Bildern, eingescannten Tafeln, Logos und fremden PDF-Dateien werden nicht automatisch umgeschrieben. Behördenformulare und Buchungen vor dem Absenden am Original prüfen.

Stadt & Service enthält zusätzlich die offiziell bestätigte Möglichkeit, über das Abfall-Kontaktformular unter „Sonstiges“ einen Laubbehälter anzufragen. Eine spezielle Online-Bestellung oder eine Zusage zur Verfügbarkeit von Laubbehältern wurde nicht bestätigt.
