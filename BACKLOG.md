# nuxt3_layer Backlog

> Gemeinsame Aufgabenliste für den Layer (Austin & Claude).
> Format: kurz halten. Details gehören in Commits/PRs.

---

## 🎯 Wichtig

- [ ] **Test coverage** — aktuell **null** automatisierte Tests im Layer.
  Mindestens Vitest für die Composables (`useApi`, `useAuth`, `useConfig`,
  `useDate`) + Pinia-Stores. Optional Playwright für den Login-Flow gegen
  ein Test-Backend (`~/Sites/myTOOLZ/nuxt3_api` als Sandbox).
- [ ] **moja-lms Smoke-Test** — als erster Consumer regelmäßig prüfen ob
  Layer-Updates dort nicht brechen. Idealerweise CI-Hook.
- [ ] **CHANGELOG.md** einführen — bei jeder Layer-Änderung kurz dokumentieren,
  damit Konsumprojekte vor `npm update` reinschauen können.

## 🧩 Port-Lücken (aus dem Nuxt-2-Starter)

Was im `~/Sites/myTOOLZ/api_frontend_nuxt` existiert aber im Layer **noch
fehlt**. On-Demand-Port wenn ein Konsumprojekt es braucht:

### Komponenten

- [ ] **Navigation:** `adminBar`, `adminDrawer`, `adminFooter`, `adminAside`,
  `asideToggle`, `masterBar`, `masterDrawer`, `devBanner`, `listItem`
  → Vuetify 2 → 3 Props neu schreiben (`outlined`→`variant="outlined"` etc.)
- [ ] **Forms:** `colorPicker`, `colorSelect`, `DropBox`, `fileField`,
  `labelText`, `pdfField`, `privacyCheck`, `stateSwitch`, `switchLine`
- [ ] **Global:** `appChart` (chartist), `formCaptcha`, `jsonDebug`,
  `mediumEditor` (medium-editor lib)
- [ ] **API-Components:** `activityMsg`, `appSpinner`, `centerImage`,
  `emptyMSG`, `renderState`, `targetActivity`

### Pages

- [ ] `crew/passwort` (Forgot/Reset Flow)
- [ ] `crew/confirm` (Email Confirmation Flow)
- [ ] `admin/users` (User-Liste + Edit)

### Plugins / Utils

- [ ] `plugins/chartist` — Chartist Setup für Nuxt 3 (oder Chart.js als Alternative)
- [ ] `plugins/winwheel` — Winwheel.js (optionales Dependency, nur für Glücksrad-Apps)
- [ ] `utils/chartist.js` — Helper für Chartist-Configs
- [ ] `utils/styleGenerator.js` — `gridSize()` ist schon portiert; Rest checken

> **Strategie:** nicht alles vorab portieren. Erst wenn ein Konsumprojekt
> einen Component braucht, sauber auf Vuetify 3 portieren + im Layer landen.
> So bleibt der Layer schlank und drift-frei.

## 🔒 Sicherheit / Hardening

- [ ] **CSP-Header** als optionales Setup dokumentieren (gegen XSS-Token-Klau,
  siehe `README.md` → Sicherheit-Sektion). Ggf. `nuxt-security` Modul prüfen.
- [ ] **Refresh-Token-Flow** evaluieren — aktuell rauschen User mit 401 raus
  wenn der JWT abläuft. Sinnvoll? Hängt von Token-Lifetime im Rails ab.
- [ ] **Optional: httpOnly-Auth via Server-Routes** — Bearer-Token aus
  httpOnly-Cookie auf Nuxt-Server-Seite lesen + an Rails weiterreichen. Macht
  XSS-Token-Klau unmöglich, aber großer Umbau.

## 📦 Distribution / Publishing

- [ ] **npm-Publish-Pipeline** — wenn mehr als 2 Konsumprojekte → Layer als
  scoped npm-Paket (`@your-scope/nuxt3-layer`). Aktuell lokale Pfade.
- [ ] **`peerDependencies` statt `dependencies`** für Nuxt/Vue/Vuetify im Layer
  package.json, damit Konsumprojekte ihre Versionen kontrollieren.
- [ ] **Semantic versioning ernst nehmen** sobald andere Projekte konsumieren.

## 📋 Geplant

- [ ] **TypeScript-Typen** für Layer-Composables verbessern — aktuell viel `any`.
  Ziel: IDE-Autocomplete in Konsumprojekten.
- [ ] **i18n-Defaults erweitern** — alle Strings die im Layer-UI vorkommen
  (403-Page, Login, AppBar) in `locales/de.json` + `en.json` haben, statt
  hardcoded.
- [ ] **Storybook (oder Histoire) für Components** — sobald die Component-
  Port-Liste oben angegangen wird.

## 💡 Ideen / Später

- [ ] **Dark-Mode-Toggle** im Layer als optionaler Component.
- [ ] **PWA-Setup** (`@vite-pwa/nuxt`) als optionales Layer-Feature.
- [ ] **OAuth-Provider** im `useAuth` ergänzen (GitHub/Google login flow für
  Rails Devise-Omniauth).

---

## 📝 Notizen für die Zusammenarbeit

- Server **nicht neustarten** — Austin macht das selbst.
- `npm run dev` im Layer ist erlaubt fürs Schnelltest, aber Austin starten lassen.
- Bei Breaking Changes → README + dieser BACKLOG bumpen, dann erst Konsumprojekte
  ziehen lassen.
- Bei Unsicherheit: fragen statt raten.
