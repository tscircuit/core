#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
consumer="$(mktemp -d /tmp/core-packed-consumer.XXXXXX)"
trap 'rm -rf "$consumer"' EXIT
unset NODE_PATH NODE_OPTIONS

cd "$repo_root"
archive="$(npm pack --json --pack-destination "$consumer" | node -pe 'JSON.parse(require("node:fs").readFileSync(0, "utf8"))[0].filename')"

cd "$consumer"
printf '%s\n' '{"private":true,"type":"module"}' > package.json
# Normal npm installation, including dependency lifecycle scripts and peers.
# Never copy the checkout's manifest, lockfile or development dependencies.
npm install --no-audit --no-fund "$consumer/$archive"
# ESM resolves relative to the fixture, not cwd: copy it into the consumer.
cp "$repo_root/scripts/smoke-tests/packed-consumer-fixture.mjs" smoke.mjs
node smoke.mjs
