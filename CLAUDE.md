# Nuxt 3 Layer - Frontend coding rules

This file applies when working **inside `nuxt3_layer/`** itself (the layer
source). For consuming projects, follow their own `CLAUDE.md` — the layer's
job is to provide a stable, well-typed base; the consuming project decides
its own app structure.

## Environment

- Node.js v20+
- **Vue 3** (Composition API) / **Nuxt 3** / **Vuetify 3** / **Pinia**
- This **IS** the shared base layer at `~/Sites/myTOOLZ/nuxt3_layer`. Consuming
  projects pull it in via `extends: ['../nuxt3_layer']` (lokal) oder
  `file:../nuxt3_layer` in package.json.

**IMPORTANT:** Composition API + `<script setup>` only. Do NOT introduce Vue 2
patterns (Options API, mixins, `this.$auth`, `nuxtServerInit`, Vuex).

## Commands

```bash
npm install
npm run dev        # standalone: testet den Layer ohne Konsumprojekt — Austin runs this
npm run build
npm run generate
```

Der Layer ist **standalone-runbar** (eigenes `app.vue` + `pages/index.vue`
mit Demo). Das ist absichtlich so, damit Layer-Änderungen ohne Konsumprojekt
verifizierbar sind.

## Repo

Eigenes git-Repo. **Branches:**
- `main` — stabiler Stand, was Konsumprojekte erwarten
- `claude` — Claude-getriebene Änderungen, wird via PR/Merge nach `main` gefahren

Bei Breaking Changes → in der README + BACKLOG notieren, Major-Version bumpen.

## Was im Layer drin ist (Conventions)

- **Auth:** Custom `useAuth()` Composable + Pinia `useAuthStore`. JWT-Token im
  Cookie (`auth.token`, `sameSite: lax`, `secure` nur in production, **nicht
  httpOnly** weil Bearer-Header gebraucht wird). SSR-safe Hydration via
  `plugins/auth-init.ts` (universal, *kein* `.client.ts`).
- **API-Client:** `useApi()` baut ein `$fetch.create()` mit Bearer-Header,
  Rails-REST-Pattern (`index/show/create/update/save/delete`) + Namespaces
  `.backend` und `.admin` (zu den Rails-Routes `/api/backend/...` und
  `/api/admin/...`). 401/402/403 → automatischer State-Reset + Redirect /403.
- **Boundary:** Request-Bodies wrappen die Daten in `{ objekt: {...} }`
  (geerbt vom Rails-`api_params`-Pattern); Responses kommen JSON:API-formatiert
  zurück und werden durch `utils/decoder.js` (`assignResponseNested`) entpackt.
- **State:** Pinia (`useAppStore`, `useAuthStore`). **Kein** Vuex.
  `nuxt.config.ts` hat `pinia.storesDirs` mit dem absoluten Layer-Pfad
  konfiguriert, damit Konsumprojekte den Layer-Store nicht selbst registrieren
  müssen.
- **i18n:** `@nuxtjs/i18n` v9 mit `restructureDir: false` (klassisches
  `locales/`-Layout). de+en als Default; Projekte ergänzen eigene Keys.
- **Toast:** eigenes `useToast()`-Composable + `<AppToast>` Component (nutzt
  `v-snackbar`). Ersatz für das alte `@nuxtjs/toast` aus Nuxt 2.
- **Config:** `useConfig()` liest aus Nuxts `useAppConfig()` (merged Layer +
  Projekt) und `useRuntimeConfig().public`. Projekte überschreiben in ihren
  eigenen `nuxt.config.ts` (runtimeConfig) und `app.config.ts` (defineAppConfig).
  **Kein Import** von `~/app-conf` mehr — der Layer ist davon entkoppelt.
- **Vuetify:** v3 via Plugin in `plugins/vuetify.ts` mit Default-Theme.
  Theme-Anpassung per Projekt → eigenes `plugins/vuetify.ts` schreiben
  oder Theme nachträglich patchen.

## Layer-spezifische Regeln

- **Nichts Projekt-Spezifisches hardcoden.** URLs, Firmennamen, Theme-Farben,
  App-Name → das alles kommt aus dem Konsumprojekt (runtimeConfig oder
  app.config.ts).
- **Composables generic halten.** Wenn ein Composable nur einem Projekt nützt,
  gehört es nicht in den Layer.
- **Pages/Layouts im Layer sind Defaults.** Projekte überschreiben gleichnamige
  Pfade automatisch.
- **Path-Aliases:** `~` resolved im Layer-Verzeichnis (nicht im Projekt).
  Das ist gewollt — Layer-Imports brauchen Layer-Pfade.
- **TypeScript ist optional**, aber alle neuen Composables sollten zumindest
  JSDoc-typisiert sein, damit IDE-Hints in Konsumprojekten funktionieren.

## Using the Backend API

- `useApi()` wraps `$fetch` mit dem JWT-Header und dem Rails-REST-Pattern
  (`index/show/create/update/save/delete`).
- Selbe Boundary wie überall: Bodies in `{ objekt: {...} }`, camelCase ↔
  snake_case Konvertierung im Backend, JSON:API-Decoding via `utils/decoder.js`.
- Auth-Fehler (401/402/403) → automatischer Reset + Redirect zu `/403?back=...`.

## Don't

- Server *nicht* neustarten — Austin macht das selbst.
- `plugins/auth-init.ts` nicht in `.client.ts` umbenennen — der Plugin muss
  universal laufen, sonst bouncen Konsumprojekte beim Reload auf /403.
- Keine projektspezifischen i18n-Keys in Layer-`locales/` einbauen.
- Den Layer **nicht** automatisch nach npm publishen — bewusste Aktion.
