# Changelog

Alle nennenswerten Änderungen am Layer. Konsumprojekte pinnen am besten auf den
jeweiligen Release-Tag (`extends: ['github:2strange/nuxt3_layer#v0.1.2']`).

## v0.1.4 — 2026-06-12

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
  nicht gesetztem Token), 3× reproduziert.
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
