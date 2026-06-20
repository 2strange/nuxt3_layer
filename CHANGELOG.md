# Changelog

Alle nennenswerten Änderungen am Layer. Konsumprojekte pinnen am besten auf den
jeweiligen Release-Tag (`extends: ['github:2strange/nuxt3_layer#v0.1.2']`).

## v0.3.0 — 2026-06-20

**SEO-Upgrade: reaktiv + config-getrieben + volle OG-Defaults** — baut additiv
auf v0.2.0 (Batch C) auf. Lehre aus Austins Live-OG-Unfurl: **vollständige
OG-Karte + starke Defaults + per-Content-Dynamik** schlagen Minimalismus. Weiter
**keine neue Runtime-Dependency** (alles über `useHead`/`useSeoMeta`). Rein
additiv, backward-kompatibel — bestehende `useSeo()`/`useJsonLd()`-Aufrufe laufen
unverändert. ⚠️ **Ein API-Detail:** `useSeo()` gibt jetzt **reaktive Refs** zurück
(`siteUrl`/`title`/… sind `ComputedRef`) — wer den `siteUrl`-Returnwert direkt in
einen String interpolierte, braucht `.value`. (Branch `claude`.)

- **feat (reaktiv):** `useJsonLd(nodesOrGetter, opts)` akzeptiert jetzt auch eine
  **Funktion/`computed`/`ref`** → reaktives `useHead(() => ({script:[...]}))`,
  sodass der `@graph` **nachzieht, wenn Content async lädt** (Artikel-Seite).
  `useSeo`-`opts`-Werte dürfen Getter/`ref` sein (intern als computed gelesen,
  **nicht** einmalig gesnapshottet).
- **feat (config-getrieben):** neuer **`jsonLD`-Defaults-Block** in `app.config.ts`
  — **per-Locale** (`de`/`en`/…), NEUTRALE Placeholder: `defaultTitle`,
  `defaultDesc`, `websiteName`, `websiteDesc`, `organisation`, `inLanguage`,
  `sameAs`, `logo:{path,width,height,caption}`. `useSeo`/`useJsonLd` lesen ihn via
  `useConfig` → **Zero-per-Page = trotzdem voller Graph + volle OG-Karte**.
- **feat (Defaults-Disziplin):** `useSeo` liefert default-`og:image`
  (`company.ogImage` → `jsonLD.logo` → `${siteUrl}/og-default.png`),
  default-Description und `og:site_name` auf JEDER Seite — auch ohne per-Page-Daten.
- **feat (article:*):** bei `datePublished` (oder `ogType:'article'`) →
  `og:type=article` + `article:published_time` + `article:modified_time` +
  `article:publisher` (aus `jsonLD.organisation`).
- **feat (@graph-Convenience):** `useJsonLd.organization()` / `.website()` **ohne
  Args** = vollständig aus dem `jsonLD`-Config-Block (+ `company.fon`/`mail`).
  `imageObject()` um **`thumbnailUrl`** ergänzt.
- **feat (config):** `company.ogImage` in `app.config.ts` (default OG-Image-Pfad).
- **refactor:** geteilte reine Helfer (`seoDefaults`/`resolveSiteUrl`/
  `absoluteUrl`/`ogLocale`) nach `utils/seo.js` (explizit via `~/utils/seo`
  importiert, Layer-Konvention) — kein Auto-Import-Clash zwischen den Composables.
- **docs:** README §SEO (Combined-Pattern + reaktives Artikel-Beispiel +
  config-Defaults), CLAUDE.md, Demo-`pages/index.vue` (kombiniert + reaktiv-Snippet).

## v0.2.0 — 2026-06-20

**SEO + JSON-LD (Batch C)** — zwei neue, generische Composables für Title/OG/
Twitter-Meta und schema.org-Strukturdaten. **Lean, keine neue Runtime-Dependency**
(`nuxt-schema-org`/`@nuxtjs/seo` bewusst NICHT eingezogen) — alles über Nuxts
`useHead`/`useSeoMeta`. Rein additiv, backward-kompatibel: bestehende Konsumenten
ohne SEO-Aufrufe bekommen null Verhaltensänderung. (Branch `claude`.)

- **feat:** `composables/useSeo.js` — generischer SEO-Head: `title`
  (+ `"{title} | {appName}"`-Template, override-/abschaltbar), `description`,
  `canonical`, OG/Twitter (inkl. `og:image` + width/height/alt/type),
  `og:locale`/`<html lang>` (aus aktiver i18n-Locale, mapbar), `noindex`. Alle
  Daten aus `opts` / `useConfig` (`appName`, `company.*`) / `runtimeConfig`
  (`siteUrl`). Gibt die aufgelösten Werte zurück (`{ title, description,
  canonical, lang, siteUrl }`) — handlich für `useJsonLd`/Tests. SSR-safe.
- **feat:** `composables/useJsonLd.js` — injiziert schema.org-Nodes als **eine**
  `<script type="application/ld+json">` (`@graph`-gewrappt) via `useHead`,
  SSR-safe. JSDoc-typisierte Builder `organization`, `website`, `webPage`,
  `breadcrumbList`, `imageObject` (als Named-Exports **und** auf `useJsonLd.*`).
  Das **`@id`-Cross-Linking** (logo↔org, website→publisher, webpage→website/
  breadcrumb/primaryImage) macht das Composable intern — Consumer liefern nur
  ihre Daten, kämpfen nicht mit dem Graph. Leere/undefined-Felder werden
  rausgepruned (lean Output).
- **feat (config):** `runtimeConfig.public.siteUrl: ''` im Layer deklariert
  (kanonische Public-Site-URL, env-driven via `NUXT_PUBLIC_SITE_URL`). Leerer
  Default → relative Fallbacks; Consumer setzt die echte URL. `useSeo` liest
  zusätzlich `websiteUrl` (slots-Kompat).
- **docs:** README §SEO (Consumer-Wiring in 3 Schritten + keyhub-Migration als
  `jsonLDmixin.js`-Ersatz), CLAUDE.md-Hinweis, Demo-`pages/index.vue` zeigt das
  Wiring aus `app.config` `company.*`.
- **Extrahiert aus** (read-only, OHNE Domain-Daten): keyhubs `jsonLDmixin.js`
  (generische `@graph`/`@id`-Assembly) + slots' `useSeo.ts` (Title/Lang/OG-Form).
  Customer-Daten (Service-Area, Firmenname, Service-Typen) **bewusst NICHT**
  übernommen — die kommen pro Projekt rein.

## v0.1.5 — 2026-06-14

**A2 Content-Refresh (opt-in)** — FE-Gegenpart zum Deploy-Gem
`capistrano-recipes4nuxt`. Kein API-Bruch, backward-kompatibel: bestehende
Konsumenten ohne `NUXT_PURGE_TOKEN` bekommen einen deaktivierten Endpoint (404),
sonst null Verhaltensänderung. (Branch `feat/a2-purge-endpoint`.)

- **feat:** Nitro-Server-Route `server/api/_purge.post.ts` — leert on-demand den
  `swr`-routeRules-Cache (`POST /api/_purge`), sodass der nächste Request frisch
  rendert (ersetzt den Nuxt-2-„Seite neu rendern"-Build). **Opt-in/Zero-Config:**
  auth-gated via `runtimeConfig.purgeToken` (`NUXT_PURGE_TOKEN`, **server-only**);
  ohne Token = Endpoint deaktiviert (`404`). Token-Vergleich constant-time
  (`timingSafeEqual`), Auth-Header `x-purge-token` (= Gem-Kontrakt §10).
- **feat:** `runtimeConfig.purgeToken: ''` im Layer deklariert (leerer Default
  → Endpoint aus). Konsumenten aktivieren A2 allein durch Setzen von
  `NUXT_PURGE_TOKEN`.
- **🔴 G15 — Purge real verifiziert:** reproduzierbarer Beweis
  `npm run verify:purge` (`test/run-purge-verify.sh` + `test/purge-smoke-test.sh`
  + Fixture `test/fixtures/swr-app`): baut eine swr-Route + den echten Endpoint,
  startet Nitro kurz (`node .output/server/index.mjs`, sauber beendet — kein
  `dev`-Daemon), holt cached → purged → holt frisch. **Ergebnis: PASS**
  (Render-Marker wechselt nach Purge; Auth 401 bei kein/falschem Token; 404 bei
  nicht gesetztem Token), 3× reproduziert. **Re-verifiziert auf v0.1.5-Basis
  (vuetify-nuxt-module-Stand, 2026-06-14).**
- **⚠️ G15-Fallstrick gefunden + umgangen:**
  `useStorage('cache').clear(prefix)` **no-opt** auf den colon-namespaced
  Nitro-Cache-Keys (`nitro:routes:_:…json`, unstorage 1.17.5) — `clear()` löscht
  nichts, Purge schlüge **lautlos** fehl (HTTP 200, Cache stale). Endpoint
  enumeriert deshalb `getKeys('nitro')` + `removeItem()` je Key.
- **G15-Pin:** verifizierte Version in `package.json`
  (`a2ContentRefresh.purgeVerifiedAgainst`: nuxt 3.21.6 / nitropack 2.13.4 /
  unstorage 1.17.5 / node 24.16.0). **Layer-Deps bleiben Caret** (kein
  Hard-Pin → backward-kompatibel); der **Consumer** pinnt exakt + re-verifiziert
  vor jedem Nuxt/Nitro-Bump (README §A2). Upgrade = Re-Verify.
- **docs:** README §A2 (swr-routeRules-Muster + Token + BE-`curl` + G15-Tabelle),
  CLAUDE.md-Abschnitt, `npm run verify:purge`-Script.

## v0.1.4 — 2026-06-14

Vuetify-Setup auf das offizielle `vuetify-nuxt-module` umgestellt. Behebt einen
Build-Bug, durch den Vuetifys **globales Stylesheet aus dem Bundle fiel**. Kein
Bruch der Composable-/Component-API; Drop-in für gültige Setups.

- **fix (Build/Styles):** Das frühere Setup (hand-gerollter `vite-plugin-vuetify`-
  Hook + manuelles `createVuetify`-Plugin) lud Vuetify per `css: ['vuetify/styles']`
  **unter** `styles: { configFile }`. In dem Modus ersetzt vite-plugin-vuetify den
  Import durch ein **virtuelles SASS-Modul**, das Nuxts CSS-Pipeline nicht
  extrahiert (`[nuxt] Cannot extract styles for virtual:plugin-vuetify:styles/main.sass`).
  Folge: das globale `main.sass`-Aggregat (`*{box-sizing:border-box}`-Reset **und
  alle** Spacing/Flex/Gap-Utilities `pa-*`/`ma-*`/`d-flex`/`ga-*`) wurde still aus
  dem gebauten Bundle gedroppt → content-box-Overflow + Utilities als No-ops. Nur
  Komponenten-Styles (autoImport) überlebten.
- **change:** Vuetify läuft jetzt über das offizielle **`vuetify-nuxt-module`**
  (wie `nuxt3_site_layer` seit v0.1.x). Es emittiert die globalen Styles korrekt
  out-of-the-box (SSR-inlined **und** SPA/public-`.css`), inkl. Auto-Import/
  Treeshaking. Verifiziert per Build-Diff (vorher 0 Treffer für `.pa-4`/Reset im
  gesamten `.output`, nachher vorhanden in SSR- **und** SPA-Build) + realem
  `valid_frontend`-Build.
- **change:** `plugins/vuetify.ts` und `assets/styles/vuetify.scss` entfernt;
  Theme/Icons wandern nach `vuetify.vuetifyOptions` in `nuxt.config.ts`. Der
  Inter-Body-Font (vormals `$body-font-family`-SASS-Override) lebt jetzt als
  `.v-application { font-family: 'Inter', … }`-Regel in `app.scss` — vermeidet die
  configFile+SSR-Caveat (`experimental.inlineSSRStyles: false`).
- **deps:** `vite-plugin-vuetify` raus (das Modul bringt es transitiv mit),
  `vuetify-nuxt-module` rein.
- **⚠️ Konsumenten-Kontrakt (Theme-Override):** Theme nicht mehr via eigenem
  `plugins/vuetify.ts`, sondern app-seitig über `vuetify.vuetifyOptions.theme`
  im Projekt-`nuxt.config.ts` (merged auf den Layer-Default). Wer einen lokalen
  Workaround-Wrapper (`assets/styles/vuetify-global.scss` + `css:[…]`) gesetzt
  hatte, kann ihn nach Pin auf `#v0.1.4` + `npm install` **entfernen**.

## v0.1.3 — 2026-06-12

Decoder-Härtung + Layer-Hygiene. Kein API-Bruch; Verhalten für gültige Inputs
unverändert (Zero-Config-Drop-in):

- **fix (Build-Blocker):** Konsumenten-Build brach bei `nuxt prepare`/`nuxt generate`
  mit `TSConfckParseError: failed to resolve "extends":"./.nuxt/tsconfig.json" in
  nuxt3_layer/tsconfig.json`. Die Layer-`tsconfig.json` extended auf
  `./.nuxt/tsconfig.json`, das aber erst `nuxt prepare` erzeugt — frisch via
  `extends: ['github:2strange/nuxt3_layer#vX']` konsumiert fehlt es (auf
  GitHub = 404). Fix: minimaler **Fallback-Stub `.nuxt/tsconfig.json`**
  (`{ "compilerOptions": {} }`) eingecheckt, der das extends out-of-the-box
  auflösbar macht; `.gitignore` trackt nur diesen Stub (`!.nuxt/tsconfig.json`),
  der restliche `.nuxt/*` bleibt ignoriert. Lokales `nuxt prepare` (auch via
  `postinstall`) überschreibt den Stub mit dem echten generierten tsconfig →
  IDE/typecheck-Hints für Layer-Devs bleiben erhalten, kein Drift. Zero-Config.
- **fix(decoder):** Null-Guard im Array-Zweig von `assignObjNestedNames` —
  sparse includes werfen keinen TypeError mehr, nicht auflösbare Refs werden
  übersprungen.
- **fix(decoder):** `includeFormTranslations` — unbekanntes Locale löste
  `splice(-1)` aus und entfernte fälschlich den letzten Eintrag der
  Locale-Liste.
- **fix(decoder):** `assignObjNested(null)` returnt konsistent `null` statt
  `undefined`; `undefined`-Einträge werden aus to-many-Arrays gefiltert.
- **perf(decoder):** O(1)-Lookup-Map (`type:id` → record, einmal pro Response
  gebaut) statt linearem `findIncluded`-Scan je Relation — O(n²) → O(n) bei
  nested includes. `findIncluded` bleibt unverändert exportiert.
- **fix(decoder):** Zyklen-Guard (Visited-Set pro Traversal-Pfad) — zirkuläre
  relationships rekurieren nicht mehr endlos; zyklische Refs werden wie
  fehlende includes behandelt.
- **fix(decoder):** `Array.isArray` statt `length`-Sniffing in
  `assignResponse*` + `includeFormTranslations` (Strings rutschten sonst als
  Collection durch).
- **fix(store):** Cookie-Consent-Key nicht mehr hardcodiert — `useAppStore`
  liest `cookiesAcceptedKey` aus `app.config`; Default bleibt der historische
  Wert `slBkngCookiesOK` (bestehende Consent-Cookies bleiben gültig).
- **fix(auth):** `fetchUser` resettet den Auth-State nur noch bei 401/403 —
  Netzwerk-/5xx-Fehler killen die Session nicht mehr.
- **docs:** README-Layer-Baum aktualisiert (8 Components, 10 Composables,
  `listFilter`); §7 `file:`-Absatz an die NODE_PATH-Ausnahme angeglichen;
  Components-Liste in CLAUDE.md ergänzt.

## v0.1.2 — 2026-06-10

Fixes rund um den Konsum via `github:` / lokalem Pfad (Consumer-`nuxt prepare`):

- **fix:** `@nuxt/kit` + `vite-plugin-vuetify` von `devDependencies` →
  `dependencies` (`1c86230`). Die Layer-`nuxt.config.ts` importiert beide zur
  Config-Eval-Zeit — als devDeps waren sie beim Consumer nicht installiert →
  `Cannot find module '@nuxt/kit'` bei `nuxt prepare` im Konsumprojekt.
- **fix:** `sass-embedded` → `dependencies` (`4962a6e`). Die Layer-`vuetify.scss`
  braucht sass zur **Consumer**-Build-Zeit.
- **fix:** postinstall-Guard `if command -v nuxt >/dev/null; then nuxt prepare; fi`
  (`798b5c0`) — der Hook schlägt nicht mehr fehl, wenn der Layer in einer
  Umgebung ohne `nuxt`-Binary installiert wird (z.B. als reine Dependency).

## v0.1.1 — 2026-05-27

- **fix:** Vuetify `configFile` auf absoluten Pfad resolven (`d74ab49`) —
  SSR-Style-Inlining funktioniert damit auch beim Konsum als github-Dependency.
- **fix:** `$body-font-family` als SCSS-Liste schreiben statt als single-quoted
  String (`108b4fd`).

## v0.1.0 — 2026-05-27

- Initial public release (`e108ab6`): Nuxt-3-Base-Layer mit Vuetify 3, Pinia,
  custom JWT-Auth (`useAuth`/`useAuthStore`), `useApi` (Rails-REST-Pattern +
  JSON:API-Decoder), i18n (de/en), Toast, Logger, Form-Helpern sowie
  Standard-Layouts/Middleware/Pages. Standalone-runbar (eigene Demo-Page).
- **docs:** Public GitHub-Remote + `github:`-extends in der README notiert
  (`d2b9345`).
