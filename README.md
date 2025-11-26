# Query Labeler

Ein schlankes Frontend, um Suchanfragen aus einer CSV-Datei schnell zu annotieren (z. B. "natürlich-sprachlich" oder "konventionell").

## Nutzung

1. Öffne die `index.html` in einem Browser oder starte einen lokalen Server:
   ```bash
   python -m http.server 8000
   ```
   und öffne anschließend `http://localhost:8000`.
2. Lade eine CSV-Datei über **Datei laden** (UTF-8-Textdateien werden korrekt mit Umlauten wie "ü" gelesen).
3. Wähle die Spalte mit den Queries und gib an, ob die erste Zeile einen Header enthält.
4. Annotiere jede Zeile über Buttons oder Tastaturkürzel (1, 2, 3). Mit Enter/→ geht es weiter, ← geht zurück, Backspace entfernt das Label.
5. Exportiere die Datei über **Annotierte CSV exportieren**. Die Annotation landet in einer neuen Spalte direkt hinter der Query-Spalte; der Export enthält einen expliziten UTF-8-BOM, damit Umlaute wie "natürlich" auch in Excel korrekt angezeigt werden.

## Funktionsumfang

- Tastaturkürzel für maximale Geschwindigkeit.
- Vorschau aller Spalten der aktuellen Zeile inkl. aktueller Annotation.
- Sprung zur nächsten ungelabelten Zeile.
- Optionales Freitext-Label für individuelle Kategorien.
