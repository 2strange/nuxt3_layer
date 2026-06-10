# Changelog

Alle nennenswerten Änderungen am Layer. Konsumprojekte pinnen am besten auf den
jeweiligen Release-Tag (`extends: ['github:2strange/nuxt3_layer#v0.1.2']`).

## v0.1.3 — 2026-06-10

Decoder-Härtung + Layer-Hygiene. Kein API-Bruch; Verhalten für gültige Inputs
unverändert (Zero-Config-Drop-in):

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
