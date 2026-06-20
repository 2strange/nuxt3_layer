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
├── app.config.ts           # static defaults (company info, mails, jsonLD SEO defaults) — overridable
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
│   ├── useJsonLd.js        # schema.org JSON-LD (@graph) via useHead — generische Builder
│   ├── useLog.js           # log.debug/info/warn/error
│   ├── useResourceIndex.js # Index laden, filtern, Liste pflegen
│   ├── useSeo.js           # Title/Description/canonical + OG/Twitter via useHead/useSeoMeta
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
├── utils/                  # api/decoder/finder/listFilter/txt/timing/style.config/seo
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
      siteUrl: 'https://example.com',   // kanonische Public-URL (für SEO/JSON-LD, s.u.)
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

## A2 — Content-Refresh (`swr`-routeRules + Purge-Endpoint) — **opt-in**

> Gegenpart zum Deploy-Gem `capistrano-recipes4nuxt` (Cargo). Ersetzt den alten
> Nuxt-2-„Seite neu rendern"-Button (`nuxt generate` → rsync) durch **on-demand
> Cache-Purge** — **kein npm-Build mehr**. Voller Kontrakt:
> `capistrano-recipes4nuxt/docs/migration-nuxt2-to-nuxt3-ssr.md` §10 +
> `docs/PURGE_SMOKE_TEST.md`.

**Wie es funktioniert:** Content-Routen werden auf `swr`
(stale-while-revalidate) gestellt — Nitro cached den Render, nach TTL
automatisch frisch. Der mitgelieferte Endpoint `POST /api/_purge` leert den
Cache **sofort** (statt auf die TTL zu warten), sodass der nächste Request
frisch rendert. Der Endpoint sitzt im Layer (`server/api/_purge.post.ts`) und
ist **opt-in**: ohne gesetzten Token = **deaktiviert** (404).

### Was der Consumer tun muss (3 Schritte)

**1. Content-Routen auf `swr` stellen** — im eigenen `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  extends: ['github:2strange/nuxt3_layer#v0.1.4'],
  routeRules: {
    '/':            { swr: 600 },   // Startseite, 10 min TTL
    '/pages/**':    { swr: 600 },   // alle CMS-Content-Seiten
    '/api/admin/**': { swr: false }, // Admin/dynamisch: NICHT cachen
  },
})
```

`swr: <sekunden>` = TTL; `swr: true` = unbegrenzt bis Purge. Generisch — welche
Routen Content sind, entscheidet das Projekt (hier nichts hardcoden).

**2. Purge-Token setzen** (aktiviert den Endpoint). Server-only, **nie** public:

```bash
# .env / shared/config/nuxt3_ssr.env (vom Gem hochgeladen, §4)
NUXT_PURGE_TOKEN=<langes-zufalls-secret>
```

Nuxt mappt `NUXT_PURGE_TOKEN` automatisch auf `runtimeConfig.purgeToken` (der
Layer deklariert den Key mit leerem Default → ohne Env = Endpoint aus).

**3. Backend triggert den Purge** (Bill-Revier) — statt `npm run export`:

```ruby
# BE-Worker: nach Content-Änderung / Admin-„aktualisieren"-Klick
`curl -fsS -X POST -H "x-purge-token: #{ENV['NUXT_PURGE_TOKEN']}" \
   http://127.0.0.1:#{nuxt3_ssr_port}/api/_purge`
```

Antwort `{ ok: true, purged: <n> }`. Falscher/kein Token → `401`; Token gar
nicht konfiguriert → `404` (Endpoint deaktiviert).

### ⚠️ G15 — Nitro-Version-Pin + Purge-Smoke-Test (Pflicht)

Der Purge nutzt **undokumentierte Nitro-Cache-Internals** (es gibt kein
offizielles Invalidierungs-API für routeRules-Caches, nuxt#20495). Ein
Nuxt/Nitro-Upgrade kann das Cache-Key-Schema ändern und den Purge **lautlos ins
Leere** laufen lassen (HTTP 200, Cache bleibt stale). **Verifiziert** wurde der
Purge gegen:

| Nuxt | Nitropack | unstorage | Node | Purge verifiziert | Datum |
|---|---|---|---|---|---|
| 3.21.6 | 2.13.4 | 1.17.5 | 24.16.0 | ✅ ja (`npm run verify:purge`) | 2026-06-12 |

→ **Consumer pinnt exakt** auf eine verifizierte Kombi und **fährt den
Smoke-Test vor jedem Bump**:

```jsonc
// Consumer-package.json
{
  "dependencies": { "nuxt": "3.21.6" },
  "overrides":    { "nitropack": "2.13.4" }  // yarn/pnpm: "resolutions"
}
```

Der Layer bringt einen **reproduzierbaren Beweis** mit: `npm run verify:purge`
(`test/run-purge-verify.sh`) baut eine swr-Fixture mit dem echten
`_purge`-Endpoint, startet Nitro kurz, holt eine Route (cached), purged, holt
erneut → muss **frisch** sein. Exit 0 = Purge real verifiziert. Den Consumer-
seitigen Smoke-Test liefert das Gem (`docs/purge-smoke-test.sh`) — gegen die
laufende Prod-/Staging-Instanz.

> **Gefundener Fallstrick (in diese Version eingebaut):**
> `useStorage('cache').clear('nitro')` **no-opt** auf den colon-namespaced
> Nitro-Cache-Keys (unstorage 1.17.x) — der Endpoint enumeriert deshalb
> `getKeys()` + `removeItem()` je Key. Details: Header-Kommentar in
> `server/api/_purge.post.ts`.

---

## SEO + JSON-LD (`useSeo` / `useJsonLd`) — seit v0.2.0, ausgebaut in v0.3.0

Zwei generische Composables für Meta-Tags und schema.org-Strukturdaten. **Lean,
keine extra Runtime-Dependency** — alles über Nuxts `useHead`/`useSeoMeta`. Der
Layer hardcoded **nichts** Projektspezifisches; alle Daten kommen aus deinen
`opts`, dem `jsonLD`-Defaults-Block + `company.*` in `app.config.ts` und
`runtimeConfig.public` (`appName` / `siteUrl`).

Leitidee (v0.3): **volle OG-Karte + starke Defaults + per-Content-Dynamik**.
Konkret:
- **Config-getriebene Defaults** — ein per-Locale `jsonLD`-Block in `app.config.ts`
  liefert `defaultTitle`/`defaultDesc`/`og:image`/`organisation`/`logo`/… Damit
  bekommt **jede** Route eine vollständige OG-Karte + einen kompletten `@graph`,
  **auch ohne per-Page-Daten**. Pages überschreiben einzelne Felder.
- **Reaktiv** — `useSeo`-`opts` dürfen Getter/`ref` sein und `useJsonLd` nimmt
  auch eine Funktion/`computed`; Head + `@graph` **ziehen nach, wenn Content
  async lädt** (Artikel-Seite).

> **Voraussetzung:** `runtimeConfig.public.siteUrl` setzen (ohne Trailing-Slash,
> z.B. `https://example.com`) — daraus baut der Layer canonical-Links, OG-URLs
> und schema.org-`@id`s. Env: `NUXT_PUBLIC_SITE_URL`. Ohne `siteUrl` fallen
> canonical/OG auf relative Pfade zurück.

### Setup: der `jsonLD`-Defaults-Block (`app.config.ts`)

Pro Locale gepflegt; der Layer bringt **neutrale leere Placeholder** mit, du
überschreibst sie im Projekt:

```ts
// my-project/app.config.ts
export default defineAppConfig({
  company: { name: 'My Company', legal: 'My Company GmbH', fon: '+49 …', mail: 'info@…',
             ogImage: '/og-default.png' },   // default og:image (Fallback)
  jsonLD: {
    de: {
      defaultTitle: 'My App — Claim',
      defaultDesc:  'Standard-Beschreibung für Seiten ohne eigene.',
      websiteName:  'My App',
      websiteDesc:  'Was die Seite ist.',
      organisation: 'My Company GmbH',
      inLanguage:   'de-DE',
      sameAs: ['https://www.linkedin.com/company/…'],
      logo: { path: '/logo.png', width: 512, height: 512, caption: 'My Company' },
    },
    en: { /* … same shape … */ },
  },
})
```

`useSeo`/`useJsonLd` wählen automatisch den Block der aktiven i18n-Locale (Fallback:
erste definierte Locale).

### `useSeo(opts)` — Title + Meta + OG/Twitter (+ `article:*`)

In der `<script setup>` einer Page (oder einem Layout für Sitewide-Defaults)
aufrufen. Setzt `<title>`, `description`, `<link rel=canonical>`, **volle** OG-/
Twitter-Tags, `<html lang>`/`og:locale` sowie — bei `datePublished`/`ogType:'article'`
— `og:type=article` + `article:published_time`/`…modified_time`/`…publisher`.
Title default `"{title} | {appName}"`. Fehlende Felder kommen aus dem `jsonLD`-Block.

```vue
<script setup>
useSeo({
  title: 'Über uns',
  description: 'Wer wir sind und was wir machen.',
  // optional:
  image: { url: '/og/about.png', width: 1200, height: 630, alt: 'Über uns' },
  // ogType: 'article', canonical: '/ueber-uns', noindex: false,
  // datePublished: '2026-01-01T…', dateModified: '2026-02-01T…',  // → article:*
  // titleTemplate: '%s — My App'  // oder false = nackter Title ohne App-Name
})
</script>
```

> **⚠️ v0.3 — Rückgabewert ist jetzt reaktiv:** `useSeo` gibt
> `{ siteUrl, title, description, canonical, lang }` als **`ComputedRef`** zurück.
> Wer den `siteUrl`-Returnwert in einen String interpoliert, braucht `.value`
> (`` `${siteUrl.value}${route.path}` ``). `opts`-Felder dürfen `ref`/Getter sein.

### `useJsonLd(nodes, opts?)` — schema.org als `@graph` (reaktiv)

Injiziert ein oder mehrere schema.org-Nodes als **eine**
`<script type="application/ld+json">`, automatisch in
`{ "@context": "https://schema.org", "@graph": [...] }` gewrappt. Falsy-Einträge
werden übersprungen. `nodes` darf ein Node/Array **oder eine Funktion/`ref`/
`computed`** sein (→ `@graph` re-rendert bei Änderung). Das `@id`-Cross-Linking
(logo↔org, website→publisher, webpage→website/breadcrumb/image) macht der Layer
intern. **`organization()`/`website()` ohne Args = vollständig aus dem
`jsonLD`-Block:**

| Builder | schema.org-Typ | `@id` |
|---|---|---|
| `organization({ siteUrl?, name?, type?, telephone?, email?, sameAs?, logo?, extra? })` — ohne Args aus `jsonLD`/`company.*` | `Organization` (Typ änderbar, z.B. `LocalBusiness`) | `{siteUrl}#organization` |
| `website({ siteUrl?, name?, description?, inLanguage?, searchAction?, extra? })` — ohne Args aus `jsonLD` | `WebSite` | `{siteUrl}#website` |
| `webPage({ siteUrl?, url, name?, description?, datePublished?, dateModified?, breadcrumb?, primaryImage?, extra? })` | `WebPage` | `{url}#webpage` |
| `breadcrumbList({ pageUrl, items: [{ name, item? }] })` | `BreadcrumbList` | `{pageUrl}#breadcrumb` |
| `imageObject({ id, url, width?, height?, caption?, thumbnailUrl?, inLanguage? })` | `ImageObject` | dein `id` |

Die Builder sind sowohl Named-Exports als auch unter `useJsonLd.*` erreichbar.

### Combined-Pattern (statische Seite)

Ein Block `useSeo()` + `useJsonLd()` mit denselben per-Page-Daten — so wie
keyhubs `buildHead` + `buildJsonLD` zusammen liefen. Org/Website kommen aus dem
Config-Block (keine Args), nur die Page-Felder gibst du an:

```vue
<script setup>
const { siteUrl } = useSeo({ title: page.title, description: page.excerpt,
                             image: page.ogImage })   // sonst default-og:image aus jsonLD/company

useJsonLd([
  useJsonLd.organization(),    // aus jsonLD-Block (name/logo/sameAs/telephone/email)
  useJsonLd.website(),         // aus jsonLD-Block (name/description/inLanguage)
  useJsonLd.webPage({
    url: `${siteUrl.value}${useRoute().path}`,
    name: page.title, description: page.excerpt,
    breadcrumb: true,
  }),
  useJsonLd.breadcrumbList({
    pageUrl: `${siteUrl.value}${useRoute().path}`,
    items: [{ name: 'Start', item: `${siteUrl.value}/` }, { name: page.title }],
  }),
])
</script>
```

> **Tipp:** `organization()`/`website()` einmal **zentral in einem Layout**
> setzen; Content-Pages liefern dann nur noch `useSeo(...)` + `webPage(...)` mit
> ihren eigenen Feldern.

### Dynamic-Pattern (Artikel-Seite, reaktiv)

Bei async geladenem Content **Getter/Funktionen** übergeben — Head + `@graph`
ziehen nach, sobald die Daten da sind:

```vue
<script setup>
const route = useRoute()
const { data: article } = await useFetch(`/api/articles/${route.params.slug}`)

const { siteUrl } = useSeo({
  title:         () => article.value?.title,
  description:   () => article.value?.excerpt,
  image:         () => article.value?.ogImage,
  datePublished: () => article.value?.publishedAt,   // → og:type=article + article:published_time
  dateModified:  () => article.value?.updatedAt,
})

useJsonLd(() => {
  const a = article.value
  if (!a) return []                                  // noch nicht geladen → nichts emittieren
  const url = `${siteUrl.value}${route.path}`
  return [
    useJsonLd.webPage({ url, name: a.title, description: a.excerpt,
                        datePublished: a.publishedAt, dateModified: a.updatedAt,
                        breadcrumb: true, primaryImage: true }),
    useJsonLd.imageObject({ id: `${url}#primaryimage`, url: a.ogImage,
                            width: a.ogImageWidth, height: a.ogImageHeight }),
    useJsonLd.breadcrumbList({ pageUrl: url,
      items: [{ name: 'Start', item: `${siteUrl.value}/` },
              { name: 'Blog', item: `${siteUrl.value}/blog` }, { name: a.title }] }),
  ]
})
</script>
```

### keyhub-Migration (`mixins/jsonLDmixin.js` → Layer)

Der Nuxt-2-Mixin (`buildHead`/`buildJsonLD`/`siteHeadMeta`) wird **komplett
ersetzt**:

- Die Defaults aus dem Mixin (`defaultTitle`/`defaultDesc`/`jsonldWebsite`/
  `jsonldOrg`/`defaultPublished`/…) wandern 1:1 in den **`jsonLD`-Block** von
  keyhubs `app.config.ts` (+ `company.*` für Firma/Logo). Danach liefern
  `organization()`/`website()` **ohne Args** denselben Graph.
- `buildHead(...)` + `siteHeadMeta` → ein `useSeo({ title, description, image,
  datePublished, dateModified })`-Aufruf je Page. `og:image:width/height` →
  `image.{width,height}`; `article:*` ergibt sich aus `datePublished`.
- `buildJsonLD(...)` → `useJsonLd([...])` mit den Buildern. Die hartcodierten
  `jsonldServices`-Blöcke + `SERVICE_AREA` ziehst du als **echte Daten** ins
  keyhub-Projekt (CMS/Konstanten) und reichst sie via `extra` an
  `organization(...)` durch (`extra: { areaServed: [...], makesOffer: [...] }`) —
  der Layer trägt **keine** Schlüsseldienst-Daten.
- `this.$route.path` + `appDomain` → `useRoute().path` + `runtimeConfig.public.siteUrl`.
- `inLanguage`/`og:locale` ergeben sich aus der i18n-Locale bzw. `jsonLD.inLanguage`
  (oder explizit via `useSeo({ lang: 'de-DE' })`).

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
