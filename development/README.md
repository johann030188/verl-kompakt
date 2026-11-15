# Web-App bauen

In diesem Ordner `npm install` und `npm run build` ausführen (Node 22 oder neuer). Der Build liest die aktuellen articles.json, digest.json und live.json aus dem Repository-Hauptverzeichnis und aktualisiert index.html sowie die neuen gebündelten JS-/CSS-Dateien dort. Alte Bundles bleiben für bereits installierte Apps erhalten. Die Inhaltsdateien und das PWA-Manifest werden nicht überschrieben.

Bäder-Daten werden stündlich durch sources.mjs und die bestehende GitHub-Aktion geprüft. Bei Abruffehlern bleiben bestätigte Daten mit ihrem ursprünglichen Prüfzeitpunkt erhalten.
