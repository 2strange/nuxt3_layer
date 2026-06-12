#!/usr/bin/env bash
#
# purge-smoke-test.sh — A2 Content-Refresh purge verification (Contract G15)
# ==========================================================================
#
#   Layer-side counterpart to capistrano-recipes4nuxt's docs/purge-smoke-test.sh.
#   It runs the SAME check (cached → purge → fresh) against a RUNNING Nitro
#   instance + the layer's server/api/_purge endpoint. The deploy gem ships the
#   harness as a template; the endpoint is layer/FE code (Luke revier), so the
#   layer ships its own runnable copy + a fixture (see run-purge-verify.sh).
#
# WHAT IT VERIFIES (the A2 risk — nuxt#20495):
#   The routeRules `swr` cache is purged via an INTERNAL/UNDOCUMENTED Nitro
#   storage prefix. A Nitro upgrade can change that schema and make the purge a
#   silent no-op. This test proves, against the PINNED Nitro version, that the
#   purge REALLY invalidates the cache.
#
# REQUIRED ENV:
#   PURGE_BASE_URL    e.g. http://127.0.0.1:3500
#   PURGE_ROUTE       a swr-cached content route          (default /swr-content)
#   PURGE_ENDPOINT    the purge route                     (default /api/_purge)
#   PURGE_TOKEN       the auth token (== NUXT_PURGE_TOKEN)
#   PURGE_DETECT      header | marker                     (default marker)
#   PURGE_HEADER      cache-status header name            (default X-Nitro-Cache)
#   PURGE_MARKER_RE   regex extracting the per-render marker from the body
#                     (default: NONCE=<8 alnum> — the fixture's per-render nonce)
#
# EXIT: 0 = purge verified · 1 = purge did NOT invalidate (G15 risk realized!) ·
#       2 = misconfig / endpoint unreachable.

set -u

BASE="${PURGE_BASE_URL:-}"
ROUTE="${PURGE_ROUTE:-/swr-content}"
ENDPOINT="${PURGE_ENDPOINT:-/api/_purge}"
TOKEN="${PURGE_TOKEN:-}"
DETECT="${PURGE_DETECT:-marker}"
HEADER="${PURGE_HEADER:-X-Nitro-Cache}"
MARKER_RE="${PURGE_MARKER_RE:-NONCE=[a-z0-9]{8}}"

die()  { echo "❌ $*" >&2; exit 2; }
fail() { echo "❌ $*" >&2; exit 1; }
ok()   { echo "✅ $*"; }

[ -n "$BASE" ]  || die "PURGE_BASE_URL is required (e.g. http://127.0.0.1:3500)."
command -v curl >/dev/null || die "curl not found."

ROUTE_URL="${BASE%/}${ROUTE}"
PURGE_URL="${BASE%/}${ENDPOINT}"

echo "── A2 purge smoke-test (G15) ───────────────────────────────"
echo "   route   : $ROUTE_URL"
echo "   purge   : $PURGE_URL"
echo "   detect  : $DETECT"
echo

fetch_header() {
  curl -fsS -D - -o /dev/null --max-time 10 "$ROUTE_URL" 2>/dev/null \
    | tr -d '\r' | awk -v h="$(echo "$1" | tr '[:upper:]' '[:lower:]')" \
        'BEGIN{IGNORECASE=1} tolower($1)==h":"{ $1=""; sub(/^ /,""); print }'
}
fetch_marker() {
  curl -fsS --max-time 10 "$ROUTE_URL" 2>/dev/null | grep -Eo "$MARKER_RE" | head -n1
}
do_purge() {
  local code
  code=$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 10 \
           -X POST -H "x-purge-token: ${TOKEN}" "$PURGE_URL" 2>/dev/null) || true
  echo "$code"
}

# --- 0. reachability -------------------------------------------------------
curl -fsS -o /dev/null --max-time 10 "$ROUTE_URL" \
  || die "Route $ROUTE_URL unreachable — is Nitro up?"

# --- 1. warm the cache (2 hits) → 2nd should be a cache HIT -----------------
curl -fsS -o /dev/null --max-time 10 "$ROUTE_URL" || die "warm-up request failed"

if [ "$DETECT" = "header" ]; then
  HSTATE="$(fetch_header "$HEADER")"
  [ -n "$HSTATE" ] || die "No '$HEADER' header on $ROUTE_URL — use PURGE_DETECT=marker."
  echo "   cache header after warm-up: $HEADER: $HSTATE"
  BEFORE="$HSTATE"
else
  BEFORE="$(fetch_marker)"
  [ -n "$BEFORE" ] || die "No marker matched /$MARKER_RE/ in body."
  echo "   cached render marker: $BEFORE"
  AGAIN="$(fetch_marker)"
  [ "$AGAIN" = "$BEFORE" ] || fail "marker changed without a purge ($BEFORE → $AGAIN) — route is NOT cached (swr); cannot verify purge."
  echo "   2nd hit served from cache (same marker) ✓"
fi

# --- 2. purge --------------------------------------------------------------
echo
echo "→ purging $PURGE_URL …"
CODE="$(do_purge)"
case "$CODE" in
  2??) ok "purge endpoint responded $CODE" ;;
  401|403) fail "purge endpoint rejected the token ($CODE) — check PURGE_TOKEN == NUXT_PURGE_TOKEN." ;;
  404) fail "purge endpoint returned 404 — token not configured (endpoint disabled) OR wrong path." ;;
  000|"") die "purge endpoint $PURGE_URL unreachable." ;;
  *) fail "purge endpoint returned unexpected $CODE" ;;
esac

sleep 1

# --- 3. verify invalidation ------------------------------------------------
echo
if [ "$DETECT" = "header" ]; then
  AFTER="$(fetch_header "$HEADER")"
  echo "   cache header after purge: $HEADER: $AFTER"
  echo "$AFTER" | grep -qi 'MISS' \
    && { ok "PURGE VERIFIED — first post-purge request is a cache MISS."; exit 0; }
  fail "PURGE DID NOT INVALIDATE — header still '$AFTER' (expected MISS)."
else
  AFTER="$(fetch_marker)"
  echo "   render marker after purge: $AFTER"
  if [ -n "$AFTER" ] && [ "$AFTER" != "$BEFORE" ]; then
    ok "PURGE VERIFIED — render marker changed ($BEFORE → $AFTER): the cache was really cleared."
    exit 0
  fi
  fail "PURGE DID NOT INVALIDATE — marker unchanged ('$BEFORE'). G15 risk realized: the routeRules purge no-op'd."
fi
