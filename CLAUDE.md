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
- **Components (auto-importiert, 8 Stück):** `AdminFooter`, `AppSpinner`,
  `AppToast`, `EmptyMsg`, `JsonDebug`, `LanguageSwitcher`, `RichTextEditor`,
  `ToolBar`. Alle generisch — projektspezifische Components gehören ins
  Konsumprojekt.
- **Config:** `useConfig()` liest aus Nuxts `useAppConfig()` (merged Layer +
  Projekt) und `useRuntimeConfig().public`. Projekte überschreiben in ihren
  eigenen `nuxt.config.ts` (runtimeConfig) und `app.config.ts` (defineAppConfig).
  **Kein Import** von `~/app-conf` mehr — der Layer ist davon entkoppelt.
- **Vuetify:** v3 via offizielles **`vuetify-nuxt-module`** (seit v0.1.4) —
  Theme/Icons in `nuxt.config.ts` unter `vuetify.vuetifyOptions`, Default-Theme
  `dark`. Theme-Anpassung per Projekt → app-seitig `vuetify.vuetifyOptions.theme`
  im Konsum-`nuxt.config.ts` (merged auf den Layer-Default), **kein** eigenes
  `plugins/vuetify.ts`. **Wichtig:** NICHT zum hand-gerollten `vite-plugin-vuetify`-
  Hook + `styles: { configFile }` zurück — der droppte Vuetifys globales
  `main.sass` (Reset + `pa-*`/`d-flex`/`ga-*`-Utilities) still aus dem Build
  (virtuelles SASS-Modul, von Nuxt nicht extrahiert). Body-Font = `.v-application`-
  Regel in `assets/styles/app.scss` (nicht mehr `$body-font-family`-Override).
- **SEO/JSON-LD (seit v0.2.0):** `useSeo()` (Title/Description/canonical +
  OG/Twitter via `useHead`/`useSeoMeta`) und `useJsonLd()` (schema.org-`@graph`
  via `useHead`) — **lean, keine extra Runtime-Dep**. Alle Daten aus `opts` /
  `useConfig` (`appName`, `company.*`) / `runtimeConfig.public.siteUrl` —
  **nichts hardcoden**. `useJsonLd`-Builder (`organization`/`website`/`webPage`/
  `breadcrumbList`/`imageObject`) verdrahten `@id`-Cross-Links intern. Neuer
  Config-Key `runtimeConfig.public.siteUrl` (kanonische Public-URL,
  `NUXT_PUBLIC_SITE_URL`). Consumer-Setup: README §SEO.
- **A2 Content-Refresh (opt-in):** Nitro-Server-Route
  `server/api/_purge.post.ts` leert on-demand den `swr`-routeRules-Cache.
  Auth-gated via `runtimeConfig.purgeToken` (`NUXT_PURGE_TOKEN`, **server-only,
  nie public**); ohne Token = Endpoint deaktiviert (404). Der Purge hängt an
  **undokumentierten Nitro-Internals** (G15) — daher Version-Pin in
  `package.json` (`a2ContentRefresh.purgeVerifiedAgainst`) + reproduzierbarer
  Smoke-Test `npm run verify:purge` (`test/`). **Vor jedem Nuxt/Nitro-Bump
  re-verifizieren.** ⚠️ `useStorage('cache').clear(prefix)` no-opt auf den
  colon-Keys → Endpoint nutzt `getKeys()` + `removeItem()`. Consumer-Setup:
  README §A2. BE-`curl`-Trigger = Bill-Revier (nicht im Layer).

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
