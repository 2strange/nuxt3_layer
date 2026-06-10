# Changelog

Alle nennenswerten Änderungen am Layer. Konsumprojekte pinnen am besten auf den
jeweiligen Release-Tag (`extends: ['github:2strange/nuxt3_layer#v0.1.2']`).

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
