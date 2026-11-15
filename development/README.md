# Web-App bauen

In diesem Ordner `npm install` und `npm run build` ausführen (Node 22 oder neuer). Der Build liest die aktuellen articles.json, digest.json und live.json aus dem Repository-Hauptverzeichnis und aktualisiert index.html sowie die neuen gebündelten JS-/CSS-Dateien dort. Alte Bundles bleiben für bereits installierte Apps erhalten. Die Inhaltsdateien und das PWA-Manifest werden nicht überschrieben.

Bäder und das offizielle Stadt-Themenverzeichnis werden stündlich durch sources.mjs und die bestehende GitHub-Aktion geprüft. Die Stadt-Suche nutzt zusätzlich die öffentliche, anonym erreichbare Suchschnittstelle des Serviceportals. Nur Dienstleistungsbezeichnungen und offizielle Zieladressen werden übernommen; keine Mitarbeiter-/Kontaktdaten und keine Artikeltexte. Bei Abruffehlern bleiben bestätigte Daten mit ihrem ursprünglichen Prüfzeitpunkt erhalten.
