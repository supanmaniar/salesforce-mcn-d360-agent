#!/usr/bin/env bash
#
# sf-tenant-token.sh — mint an OAuth 2.0 client-credentials token for the Data 360
# tenant host (/api/v1 and /api/v2).
#
# Why this exists
# ---------------
# The Data 360 tenant host sits behind a service mesh that only accepts a JWT
# bearer token obtained via the OAuth 2.0 client-credentials grant. The session
# token that `sf org login` writes to ~/.sfdx is opaque and single-segment, and
# the mesh rejects it with HTTP 400 and an empty body.
#
# That means the `data360` family cannot run off the CLI session the way
# `mc-next` and `data360-connect` do. It needs a Connected App (or External
# Client App) with the Data 360 scopes. See docs/CONNECTED-APP-SETUP.md.
#
# Usage:
#   ./scripts/sf-tenant-token.sh                 # print the token
#   ./scripts/sf-tenant-token.sh --export        # print `export SF_TENANT_TOKEN=...`
#   ./scripts/sf-tenant-token.sh --cache 3600    # cache the token for N seconds
#   eval "$(./scripts/sf-tenant-token.sh --export)"
#
# Credentials are read from, in order:
#   SF_CLIENT_ID / SF_CLIENT_SECRET       (environment)
#   .env                                  (git-ignored, see .env.example)
#
# The `scope` parameter is NOT sent by default: Salesforce rejects it with
# "invalid_request: scope parameter not supported". The app's pre-approved
# scopes are what get granted. Use --scope only if your org requires it.
#
# Exit codes: 0 success, 1 missing credentials, 2 token request failed, 3 CLI error.

set -euo pipefail

LOGIN_URL="${SF_LOGIN_URL:-https://login.salesforce.com}"
EXPORT=0
CACHE_SECONDS=0
SCOPE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --export)  EXPORT=1; shift ;;
    --cache)   CACHE_SECONDS="${2:?--cache needs a number of seconds}"; shift 2 ;;
    --scope)   SCOPE="$2"; shift 2 ;;
    --login-url) LOGIN_URL="$2"; shift 2 ;;
    -h|--help) sed -n '3,32p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)         printf 'sf-tenant-token: unknown option %s\n' "$1" >&2; exit 3 ;;
  esac
done

command -v curl >/dev/null 2>&1 || { printf 'sf-tenant-token: curl not found on PATH\n' >&2; exit 3; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"

# Load .env without clobbering variables already set in the environment.
if [[ -f "$ENV_FILE" ]]; then
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    value="${value%\"}"; value="${value#\"}"
    value="${value%\'}"; value="${value#\'}"
    if [[ -z "${!key:-}" ]]; then
      export "$key=$value"
    fi
  done < <(grep -v '^[[:space:]]*#' "$ENV_FILE" | grep -E '^[A-Za-z_][A-Za-z0-9_]*=')
fi

# The market-name client ID is the consumer key; accept either spelling.
CLIENT_ID="${SF_CLIENT_ID:-${SF_CONSUMER_KEY:-}}"
CLIENT_SECRET="${SF_CLIENT_SECRET:-${SF_CONSUMER_SECRET:-}}"

if [[ -z "$CLIENT_ID" || -z "$CLIENT_SECRET" ]]; then
  cat >&2 <<'EOF'
sf-tenant-token: missing credentials.

Set SF_CLIENT_ID and SF_CLIENT_SECRET (or SF_CONSUMER_KEY / SF_CONSUMER_SECRET),
either in the environment or in a .env file next to this script.

These come from a Connected App with the Data 360 scopes enabled and the
client-credentials flow turned on. See docs/CONNECTED-APP-SETUP.md.
EOF
  exit 1
fi

CACHE_FILE="${TMPDIR:-/tmp}/sf-tenant-token.$(printf '%s' "$CLIENT_ID" | tr -c 'A-Za-z0-9' '_')"

if [[ "$CACHE_SECONDS" -gt 0 && -f "$CACHE_FILE" ]]; then
  AGE=$(( $(date +%s) - $(stat -c %Y "$CACHE_FILE" 2>/dev/null || printf '0') ))
  if [[ "$AGE" -lt "$CACHE_SECONDS" ]]; then
    TOKEN="$(cat "$CACHE_FILE")"
    if [[ "$EXPORT" -eq 1 ]]; then printf 'export SF_TENANT_TOKEN=%q\n' "$TOKEN"; else printf '%s\n' "$TOKEN"; fi
    exit 0
  fi
fi

RESPONSE="$(curl -s --max-time 30 -X POST "${LOGIN_URL%/}/services/oauth2/token" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'Accept: application/json' \
  -d 'grant_type=client_credentials' \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  ${SCOPE:+-d "scope=${SCOPE}"})" || { printf 'sf-tenant-token: token request failed (network)\n' >&2; exit 2; }

TOKEN="$(printf '%s' "$RESPONSE" | python3 -c "
import json,sys
try:
    d = json.load(sys.stdin)
except Exception:
    sys.exit('')
print(d.get('access_token',''))
" 2>/dev/null || true)"

if [[ -z "$TOKEN" ]]; then
  printf 'sf-tenant-token: token request was refused.\n' >&2
  printf '%s\n' "$RESPONSE" | python3 -c "
import json,sys
raw = sys.stdin.read()
try:
    d = json.loads(raw)
    print('  %s: %s' % (d.get('error','error'), d.get('error_description','')))
except Exception:
    print('  ' + raw[:400])
" >&2 || printf '  %s\n' "$RESPONSE" >&2
  cat >&2 <<'EOF'

Common causes:
  invalid_client_id       the client ID is wrong, or the app is not yet active
                          (Connected Apps can take a few minutes to propagate)
  invalid_client_credential  wrong client secret
  unsupported_grant_type  the client-credentials flow is not enabled on the app
  invalid_scope           the app is missing one of the Data 360 scopes, or
                          the requested scope was not pre-approved
EOF
  exit 2
fi

if [[ "$CACHE_SECONDS" -gt 0 ]]; then
  printf '%s' "$TOKEN" > "$CACHE_FILE"
  chmod 600 "$CACHE_FILE"
fi

if [[ "$EXPORT" -eq 1 ]]; then
  printf 'export SF_TENANT_TOKEN=%q\n' "$TOKEN"
else
  printf '%s\n' "$TOKEN"
fi
