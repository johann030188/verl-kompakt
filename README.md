# Verl kompakt

Nachrichten, Veranstaltungen, Abfallkalender, SC Verl und Stadtgeschichte. Unabhängiges privates Informationsangebot für Verl.

Offizielle Termine und Sportdaten werden stündlich aus den angegebenen Quellen aktualisiert. Eigene redaktionelle Zusammenfassungen stehen in articles.json; digest.json dokumentiert den letzten redaktionellen Abruf.

Familie & Kurse bündelt altersbezogene Angebote ab 7 Jahren von Droste-Haus und TV Verl. Die Altersauswahl und Stadt-Favoriten bleiben ausschließlich im Browser des jeweiligen Geräts. Der Familienkalender enthält offiziell bestätigte NRW-Ferien, Anmeldestarts und Angebote; ein ICS-Export ist eine Momentaufnahme.

Die GitHub-Aktion prüft TV-Verl-Sportangebote, öffentlich eingebundene Yolawo-Kurse, Ferien, Mobilitätsquellen und Polizeimeldungen stündlich. Polizeimeldungen werden anhand der tatsächlichen Ortsdateline auf Verl und bestätigte Ortsteile begrenzt; eine bloße Nennung der Verler Straße reicht nicht. Archivierte Meldungen behalten ihr ursprüngliches Veröffentlichungsdatum.

Busabfahrten für vier bestätigte Verler Haltestellen werden planmäßig alle fünf Minuten aus dem offiziellen moBiel/VRR-Monitor abgerufen. GitHub-Zeitpläne können verzögert sein. Zeitstempel, Echtzeit-/Fahrplanstatus und Fehler werden pro Haltestelle erhalten; die App blendet einen über zehn Minuten alten Stand aus. Fehler dürfen nicht als leere aktuelle Abfahrtstafel erscheinen.

`droste-program.json` ist eine redaktionell aus dem offiziell verlinkten Canva-Programm geprüfte Momentaufnahme. `checkedAt` bezeichnet die tatsächliche Inhaltsprüfung. Die stündliche Website-Prüfung ersetzt keine Inhaltsprüfung des Programmhefts. Die bestehende redaktionelle Pflege soll das aktuelle offiziell verlinkte Programm erneut prüfen. Keine Termine, Serien-Enddaten, freien Plätze oder Altersgrenzen erfinden; Originaltexte und Bilder nicht übernehmen.

Quellcode unter `development/`: Mit den vorhandenen Abhängigkeiten `node development/build.mjs` ausführen. Bestehende Daten und PWA-Adresse bleiben erhalten. `node refresh-data.mjs` und `node refresh-departures.mjs` pflegen die veröffentlichten Daten getrennt.
