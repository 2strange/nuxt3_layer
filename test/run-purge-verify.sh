#!/usr/bin/env bash
#
# run-purge-verify.sh — one-shot G15 driver for the A2 purge endpoint.
#
# Builds the test/fixtures/swr-app fixture (which `extends` this layer, so the
# REAL server/api/_purge endpoint is included), boots the built Nitro server on
# a loopback port with a purge token, runs test/purge-smoke-test.sh against it,
# then shuts the server down cleanly. NO `nuxt dev` daemon — a built
# `.output/server/index.mjs` started and killed within this script.
#
# Usage:
#   test/run-purge-verify.sh            # build + verify
#   SKIP_BUILD=1 test/run-purge-verify.sh   # reuse an existing fixture build
#
# Exit code mirrors the smoke-test (0 ok · 1 purge failed · 2 misconfig).

set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
FIXTURE="$HERE/fixtures/swr-app"
PORT="${PORT:-3531}"
HOST="127.0.0.1"
TOKEN="${NUXT_PURGE_TOKEN:-g15-verify-token}"
BASE="http://${HOST}:${PORT}"

cleanup() {
  [ -n "${SRV_PID:-}" ] && kill "$SRV_PID" 2>/dev/null
  [ -n "${SRV_PID:-}" ] && wait "$SRV_PID" 2>/dev/null
}
trap cleanup EXIT INT TERM

echo "════════════════════════════════════════════════════════════"
echo " A2 purge G15 verification"
echo "   fixture : $FIXTURE"
echo "   nuxt    : $(node -e "console.log(require('$HERE/../node_modules/nuxt/package.json').version)")"
echo "   nitro   : $(node -e "console.log(require('$HERE/../node_modules/nitropack/package.json').version)")"
echo "   node    : $(node --version)"
echo "════════════════════════════════════════════════════════════"

# Symlink the REAL layer endpoint into the fixture so we test the actual source
# byte-for-byte (not a copy that could drift).
mkdir -p "$FIXTURE/server/api"
ln -sf "$HERE/../server/api/_purge.post.ts" "$FIXTURE/server/api/_purge.post.ts"

if [ -z "${SKIP_BUILD:-}" ]; then
  echo "→ linked real endpoint: $(readlink "$FIXTURE/server/api/_purge.post.ts")"
  echo "→ building fixture (nuxt build)…"
  ( cd "$FIXTURE" && npx nuxt build ) || { echo "❌ fixture build failed"; exit 2; }
fi

OUT="$FIXTURE/.output/server/index.mjs"
[ -f "$OUT" ] || { echo "❌ no build output at $OUT"; exit 2; }

echo "→ starting Nitro server on ${BASE}…"
NITRO_PORT="$PORT" NITRO_HOST="$HOST" NUXT_PURGE_TOKEN="$TOKEN" \
  node "$OUT" >"$HERE/.server.log" 2>&1 &
SRV_PID=$!

# wait for readiness (max ~20s)
for i in $(seq 1 40); do
  curl -fsS -o /dev/null --max-time 2 "${BASE}/swr-content" 2>/dev/null && break
  sleep 0.5
  if ! kill -0 "$SRV_PID" 2>/dev/null; then
    echo "❌ server exited early — log:"; cat "$HERE/.server.log"; exit 2
  fi
done

echo "→ running smoke-test (marker detection)…"
echo
PURGE_BASE_URL="$BASE" \
PURGE_ROUTE="/swr-content" \
PURGE_ENDPOINT="/api/_purge" \
PURGE_TOKEN="$TOKEN" \
PURGE_DETECT="marker" \
  bash "$HERE/purge-smoke-test.sh"
RC=$?

echo
echo "→ negative checks (auth gating)…"
NOAUTH=$(curl -fsS -o /dev/null -w '%{http_code}' -X POST "${BASE}/api/_purge" 2>/dev/null || true)
WRONG=$(curl -fsS -o /dev/null -w '%{http_code}' -X POST -H "x-purge-token: nope" "${BASE}/api/_purge" 2>/dev/null || true)
echo "   POST /api/_purge (no token header)   → HTTP $NOAUTH (expect 401)"
echo "   POST /api/_purge (wrong token)       → HTTP $WRONG (expect 401)"

exit $RC
