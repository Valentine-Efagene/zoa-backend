#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
API_PORT="${API_PORT:-4000}"
WEB_PORT="${WEB_PORT:-3000}"

export AWS_ENDPOINT_URL="${AWS_ENDPOINT_URL:-http://localhost:4566}"
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}"
export AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-000000000000}"

"$ROOT/scripts/uat/bootstrap-floci.sh"

if [[ -f "$ROOT/api/.env.uat" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/api/.env.uat"
  set +a
else
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/api/.env.uat.example"
  set +a
fi

if [[ -f "$ROOT/web/zoa/.env.uat" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/web/zoa/.env.uat"
  set +a
else
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/web/zoa/.env.uat.example"
  set +a
fi

export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:${API_PORT}}"

cleanup() {
  [[ -n "${API_PID:-}" ]] && kill "$API_PID" 2>/dev/null || true
  [[ -n "${WEB_PID:-}" ]] && kill "$WEB_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

cd "$ROOT/api"
if [[ ! -d node_modules ]]; then
  npm ci
fi
npx serverless offline --httpPort "$API_PORT" &
API_PID=$!

cd "$ROOT/web/zoa"
if [[ ! -d node_modules ]]; then
  npm ci
fi
cp .env.uat .env.local
if [[ "${CI:-}" == "true" ]]; then
  npm run build
  PORT="$WEB_PORT" npm run start &
else
  PORT="$WEB_PORT" npm run dev -- --port "$WEB_PORT" &
fi
WEB_PID=$!

echo "Waiting for API on :${API_PORT}..."
for _ in $(seq 1 90); do
  if curl -sf "http://127.0.0.1:${API_PORT}/health" >/dev/null; then
    break
  fi
  sleep 1
done

echo "Waiting for web on :${WEB_PORT}..."
for _ in $(seq 1 90); do
  if curl -sf "http://127.0.0.1:${WEB_PORT}/" >/dev/null; then
    break
  fi
  sleep 1
done

echo "UAT stack ready (API :${API_PORT}, web :${WEB_PORT})."
wait
