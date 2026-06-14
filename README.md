# nuxt3_layer

Wiederverwendbarer **Nuxt 3 Base-Layer** für Austin's Projekte. Bringt Vuetify 3,
Pinia, custom JWT-Auth (Rails), i18n, Form-Helper, JSON:API-Decoder, Toast,
Logger und Standard-Layouts/Middleware mit.

Jedes Projekt **erbt** den Layer via `extends:` und überschreibt nur was abweicht.
Updates am Layer → `npm update` / `git pull` in jedem Projekt → alle profitieren
gleichzeitig.

> **Stand (2026-06-12):** aktiv & canonical reference, aktuell **v0.1.3**.
> Public GitHub-Repo
> [`github.com/2strange/nuxt3_layer`](https://github.com/2strange/nuxt3_layer)
> (Branch `main` = stabil, `claude` = Claude-getriebene Änderungen). Konsumieren
> via **Tag-Pin** `extends: ['github:2strange/nuxt3_layer#v0.1.3']` (empfohlen,
> statt `#main` — s.u.). Erster Consumer: `~/Sites/moja-lms`. Begleit-Docs siehe
> `CLAUDE.md` + `BACKLOG.md`, Release-Historie in `CHANGELOG.md`.

---

## Was der Layer mitbringt

```
nuxt3_layer/
├── nuxt.config.ts          # Vuetify (vuetify-nuxt-module), Pinia, i18n, runtimeConfig-Defaults
├── app.config.ts           # static defaults (company info, mails) — overridable
├── app.vue                 # NuxtLayout-Wrapper (standalone-dev support)
│
├── composables/            # auto-import in jedem konsumierenden Projekt
│   ├── useApi.js           # $fetch wrapper mit Auth-Header + Rails-REST-Pattern
│   ├── useAuth.js          # loginLocal / logout / fetchUser
│   ├── useConfig.js        # CONFIG(key) → liest useAppConfig + runtimeConfig
│   ├── useDate.js          # date / dateTime (dayjs)
│   ├── useFormRules.js     # email/pass/required rules für Vuetify
│   ├── useEventBus.js      # pub/sub (Vue-2 event_bus Ersatz)
│   ├── useInfiniteScroll.js # paginiertes Nachladen via v-intersect
│   ├── useLog.js           # log.debug/info/warn/error
│   ├── useResourceIndex.js # Index laden, filtern, Liste pflegen
│   └── useToast.js         # toast.show/success/error
│
├── stores/                 # Pinia
│   ├── app.js              # UI-State (Drawer, Cookies)
│   └── auth.js             # user, token, loggedIn, isAdmin, isMaster
│
├── middleware/             # defineNuxtRouteMiddleware
│   ├── authenticated.js
│   ├── admin.js
│   └── guest.js
│
├── plugins/
│   └── auth-init.ts        # SSR-safe Cookie-Hydration + User-Fetch
│                           # (Vuetify wird vom vuetify-nuxt-module verdrahtet — kein eigenes Plugin mehr)
│
├── components/             # auto-importiert in Konsumprojekten
│   ├── AdminFooter.vue     # minimaler Admin-Footer (App-Name + ©Jahr)
│   ├── AppSpinner.vue      # zentraler Lade-Spinner
│   ├── AppToast.vue        # globaler Snackbar-Stack
│   ├── EmptyMsg.vue        # Leer-Zustand mit Icon + Action-Slot
│   ├── JsonDebug.vue       # dev-only JSON-Inspektor (vue-json-pretty)
│   ├── LanguageSwitcher.vue # Locale-Menü (i18n setLocale, Route + Cookie)
│   ├── RichTextEditor.vue  # TipTap-Editor (wysiwyg/markdown) mit Toolbar
│   └── ToolBar.vue         # Listen-Kopf mit Zähler/Suche/State-Filter
│
├── layouts/
│   ├── default.vue         # Public mit AppBar
│   ├── application.vue     # eingeloggt mit Drawer
│   └── admin.vue           # Admin-Drawer
│
├── pages/                  # Defaults — Projekte überschreiben einfach gleichnamige Pfade
│   ├── index.vue           # Standalone-Layer-Demo (Projekte ersetzen)
│   ├── 403.vue             # Forbidden + Inline-Login
│   └── crew/login.vue      # Login-Page
│
├── services/log.js
├── utils/                  # api/decoder/finder/listFilter/txt/timing/style.config
├── locales/                # de.json + en.json (Projekte merge'n eigene Keys rein)
├── assets/styles/          # variables.scss + app.scss (Inter-Body-Font-Regel)
└── error.vue
```

---

## In ein **bestehendes Nuxt 3 Projekt** einbauen

### 1. Layer-Referenz hinzufügen

```ts
// my-project/nuxt.config.ts
export default defineNuxtConfig({
  extends: ['github:2strange/nuxt3_layer#v0.1.3'],  // Tag-Pin (empfohlen)
  // oder: extends: ['../nuxt3_layer']  // lokaler Pfad (Monorepo-Sibling, s. Hinweis unter 7.)
  // oder: npm-Paket nach Publish: extends: ['@your-scope/nuxt3-layer']
})
```

> **Empfehlung: auf den Release-Tag pinnen** (`#v0.1.3`), nicht auf `#main`.
> `#main` bewegt sich unter deinen Builds weg — ein Layer-Push kann ein
> Konsumprojekt unangekündigt brechen. Mit Tag-Pin sind Builds reproduzierbar;
> Updates = bewusster Tag-Wechsel (Changelog checken → Pin hochziehen).

> **Consumer-Kontrakt: `assets/styles/app.scss` ist Pflicht.** Der Layer lädt
> `~/assets/styles/app.scss` über seine `css:`-Liste, und `~` resolved dabei im
> **Konsumprojekt** (srcDir), nicht im Layer. Das Konsumprojekt MUSS diese Datei
> also bereitstellen (eine leere Datei reicht) — sonst bricht der Build.

### 2. Projektspezifische runtimeConfig setzen

```ts
// my-project/nuxt.config.ts
export default defineNuxtConfig({
  extends: ['../nuxt3_layer'],

  devServer: { port: 3004 },

  runtimeConfig: {
    public: {
      appName: 'My App',
      apiBase: 'https://api.example.com/api',
      deployMode: process.env.NODE_ENV || 'development',
    },
    // server-side only:
    apiBaseServer: 'http://localhost:3000/api',
  },
})
```

### 3. (Optional) Projektspezifische `app.config.ts`

```ts
// my-project/app.config.ts — wird mit Layer-Defaults gemerged
export default defineAppConfig({
  company: {
    name: 'My Company',
    legal: 'My Company GmbH',
    street: 'Example Street 1',
    zipcode: '12345',
    city: 'Berlin',
    fon: '+49 30 0000000',
    mail: 'info@example.com',
  },
  mails: {
    support: 'support@example.com',
    legal:   'legal@example.com',
  },
})
```

### 4. Eigene Pages drüberschreiben

Projekt-`pages/index.vue` überschreibt Layer-`pages/index.vue` automatisch.
Selbes für jede andere Page/Layout/Component.

### 5. Eigene Theme-Farben

Seit **v0.1.4** verdrahtet der Layer Vuetify über das offizielle
`vuetify-nuxt-module`. Theme/Farben überschreibst du **app-seitig** im
Projekt-`nuxt.config.ts` — das wird auf den Layer-Default gemerged, **kein**
eigenes `plugins/vuetify.ts` mehr nötig:

```ts
// Projekt-nuxt.config.ts
export default defineNuxtConfig({
  extends: ['github:2strange/nuxt3_layer#v0.1.4'],
  vuetify: {
    vuetifyOptions: {
      theme: {
        defaultTheme: 'light',
        themes: { light: { colors: { primary: '#4F5B93' } } },
      },
    },
  },
})
```

> **Upgrade-Hinweis (< v0.1.4):** Der frühere `vite-plugin-vuetify`-Hook mit
> `styles: { configFile }` ließ Vuetifys globales Stylesheet (Reset +
> `pa-*`/`d-flex`/`ga-*`-Utilities) aus dem Build fallen. Wer dafür einen lokalen
> Workaround-Wrapper (`assets/styles/vuetify-global.scss` + `css: [...]`) gesetzt
> hatte, kann ihn nach Pin auf `#v0.1.4` + `npm install` **entfernen**.

### 6. Eigene i18n-Strings

`@nuxtjs/i18n` lädt Locale-Files aus dem Layer **und** aus dem Projekt — beides
wird gemerged. Einfach `locales/de.json` im Projekt anlegen mit zusätzlichen Keys.

### 7. `package.json`

Im Projekt nur dein App-spezifisches Zeug; der Layer bringt seine Dependencies
selbst mit. Bei Layer als lokalem Pfad den Layer als `file:`-Dependency
aufnehmen, damit `npm install` die Layer-Deps in dein Projekt zieht:

```json
{
  "dependencies": { "nuxt3-layer": "file:../nuxt3_layer" }
}
```

**Aber:** der `file:`-Eintrag allein reicht beim lokalen Pfad-extends *nicht* —
es gilt die NODE_PATH-Ausnahme unten: solange der Layer keine eigenen
`node_modules` hat, brauchst du im Konsumprojekt weiterhin den Workaround
`NODE_PATH=./node_modules nuxt prepare` (Details im Hinweis-Block).

Bei npm-Publish reicht ein simples `npm install @your-scope/nuxt3-layer`.

> **Hinweis (v0.1.2+):** `@nuxt/kit`, `vuetify-nuxt-module` und `sass-embedded`
> sind in `dependencies` (nicht `devDependencies`), weil die
> Layer-`nuxt.config.ts` sie zur Config-Eval-Zeit braucht bzw. das Modul Vuetifys
> SCSS zur Consumer-Build-Zeit kompiliert. *(Seit v0.1.4 bringt
> `vuetify-nuxt-module` das frühere direkte `vite-plugin-vuetify` transitiv mit.)* Beim Konsum via `github:`-extends oder
> npm-Paket brauchen Consumer damit **keinen** `postinstall`-Workaround mehr
> (`NODE_PATH=./node_modules nuxt prepare`) — falls du den Hack noch im Projekt
> hast, einfach entfernen.
>
> **Ausnahme — lokales Pfad-extends auf einen Layer OHNE eigene `node_modules`:**
> Hier bleibt der Workaround `NODE_PATH=./node_modules nuxt prepare` (bzw. als
> `postinstall` im Konsumprojekt) **weiterhin nötig**. Das ist per `package.json`
> prinzipiell nicht lösbar: Node resolved Imports aus der Layer-`nuxt.config.ts`
> vom **Layer-Pfad** aus nur die Eltern-Verzeichnisse hoch — die `node_modules`
> des Konsumprojekts liegen aber in einem Geschwister-Zweig und werden so nie
> gefunden. Abhilfe: Layer selbst `npm install`-en (eigene `node_modules`),
> `NODE_PATH` setzen, oder gleich das `github:`-Tag-Pin-extends nutzen.

---

## Ein **bestehendes Nuxt 2 Projekt** migrieren

Reihenfolge die sich bewährt hat:

1. **Neuen Projektordner** anlegen, `nuxt.config.ts` mit `extends: ['../nuxt3_layer']` (siehe oben).
2. **`pages/`** rüberkopieren — *Composition API* umschreiben:
   - `mixins:` raus → `useFormRules()` / `useDate()` / `useLogout()` als composables
   - `this.$auth.user` → `const auth = useAuthStore(); auth.user`
   - `this.$api.index('foo')` → `const api = useApi(); api.index('foo')`
   - `this.$log.x` → `const log = useLog()`
   - `this.$toast.x` → `const toast = useToast()`
   - `middleware: 'authenticated'` → `definePageMeta({ middleware: 'authenticated' })`
3. **`components/`** rüber — Vuetify 2 → Vuetify 3 Props:
   - `outlined` → `variant="outlined"`
   - `text` (Button) → `variant="text"`
   - `flat` (Card) → `variant="flat"`
   - `:value` (Snackbar) → `v-model`
   - `prepend-icon` Slot → `prepend-inner-icon` Prop
   - `dense` → `density="compact"`
   - `multi-line` (Textarea) → bleibt
   - Slots: `#default` etc. — meistens kompatibel
4. **`store/index.js` (Vuex)** zerlegen in Pinia-Stores im Projekt-`stores/`-Ordner.
5. **`assets/styles/`** rüber, ggf. SCSS-Variablen umbenennen.
6. **`static/`** → `public/`.

Tipps:
- Erst `npm run dev` und die ERROR-Seite anschauen — Nuxt 3 listet kaputte Imports klar auf.
- TypeScript ist optional aber empfehlenswert.
- Vuetify-Komponenten die schwerer sind (`v-data-table`, `v-autocomplete`) haben in v3 etwas geänderte Slots — Doku gegenchecken.

Eine ausführlichere Vuetify-2→3-Mapping-Referenz liegt im Nuxt-2-Starter
(`../api_frontend_nuxt/`).

---

## Layer pflegen & weiterentwickeln

```bash
cd /Users/austin/Sites/myTOOLZ/nuxt3_layer
npm install
npm run dev     # standalone: probiert den Layer ohne Projekt aus
```

Beim Anpassen daran denken:
- **Nichts Projekt-Spezifisches hardcoden** (URLs, Firmennamen, Theme-Farben).
  Solches Zeug gehört in `runtimeConfig` oder `app.config.ts`.
- **Composable-Defaults bleiben generisch** — Projekte überschreiben gezielt
  einzelne Composables wenn nötig.
- **Pages/Layouts** im Layer sind *Defaults*. Wenn ein Projekt sie überschreibt,
  gewinnt das Projekt automatisch — nichts zu konfigurieren.
- **Breaking Changes** → semver-mäßig die Major-Version bumpen.

### Layer als npm-Paket veröffentlichen

Wenn du den Layer wirklich teilen willst (z.B. zwischen Maschinen ohne den
Geschwisterordner zu kopieren), siehe die Nuxt-Layers-Doku:
<https://nuxt.com/docs/getting-started/layers#publishing-layers>

Kurzversion:
1. `package.json` → `"name": "@your-scope/nuxt3-layer"`, `"version": "0.x.x"`
2. `npm publish --access=public` (oder als GitHub-Release per `extends: 'github:...'`)
3. In Projekten: `npm install @your-scope/nuxt3-layer` und
   `extends: ['@your-scope/nuxt3-layer']`

---

## Was beim Layer-Setup zu beachten ist

**Auto-Imports:** Composables, Components, Stores werden automatisch aus dem
Layer importiert — ohne `import` in den Projekten. Solange Namen nicht
kollidieren, läuft das transparent.

**Path-Aliases:** Innerhalb des Layers funktioniert `~` und `@` relativ zum
Layer-Root. In Konsumprojekten ebenfalls relativ zum Projekt-Root — ein
Layer-Composable das `~/utils/api` importiert, resolved im Layer-Verzeichnis,
nicht im Projekt. Das ist gewollt.

**Pages-Resolution:** Projekt-`pages/foo.vue` schlägt Layer-`pages/foo.vue`.
Es gibt KEINE Möglichkeit, eine Layer-Page mit dem gleichen Pfad zu *ergänzen* —
nur ganz oder gar nicht.

**`app.config.ts` Merging:** Nuxt deep-merged die `defineAppConfig`-Aufrufe aus
Layer + Projekt. Arrays werden **ersetzt**, Objekte **gemerged**. Wenn du das
nicht willst, projekt-spezifische Daten in `runtimeConfig` schieben.

**Locale-Files:** `@nuxtjs/i18n` v9+ lädt Locale-Dateien aus jeder Layer +
Projekt-`locales/`-Folder und merged sie automatisch — Projekt-Keys gewinnen.
