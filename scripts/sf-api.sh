#!/usr/bin/env bash
#
# sf-api.sh — call Salesforce REST APIs using the Salesforce CLI session.
#
# This is the local replacement for the MCP server's HTTP client. It reuses the
# OAuth session that `sf` already holds, so there is no Connected App, no client
# secret, and no MCP server to run.
#
# Two routing modes, because the three API families do not share a host:
#
#   instance (default)  {instanceUrl}/services/data/v{ver}{path}
#                       Used by: mc-next, data360-connect, platform
#                       Executed with: sf api request rest
#
#   tenant              {tenantUrl}{path}
#                       Used by: data360  (paths begin /api/v1, /api/v2)
#                       Executed with: curl + a token read from `sf org display`
#                       because `sf api request rest` always prefixes the org
#                       instance and ignores absolute URLs.
#
# Usage:
#   ./scripts/sf-api.sh --path /ssot/segments
#   ./scripts/sf-api.sh --path /ssot/segments --query 'batchSize=5'
#   ./scripts/sf-api.sh --method POST --path /ssot/segments --body '{"name":"X"}'
#   ./scripts/sf-api.sh --tenant --path /api/v1/metadata
#   ./scripts/sf-api.sh --path /limits --raw
#
# Options:
#   -o, --org <alias>      Target org (default: $SF_TARGET_ORG, else sf default)
#   -X, --method <verb>    GET (default) | POST | PATCH | PUT | DELETE
#   -p, --path <path>      API path, e.g. /ssot/segments
#   -q, --query <qs>       Query string, e.g. 'batchSize=5&offset=0'
#   -b, --body <json>      Request body. Use @file to read from a file, - for stdin.
#   -H, --header <h>       Extra header, repeatable. Format "Key: Value".
#   -t, --tenant           Route to the Data 360 tenant host instead of the instance.
#   -T, --tenant-url <url> Override the tenant host (default: $DATA360_TENANT_URL).
#   -a, --api-version <v>  API version (default: $SF_API_VERSION, else 66.0).
#   -r, --raw              Print the raw response body without JSON pretty-printing.
#   -i, --include          Include HTTP status and headers (instance mode only).
#   -h, --help             Show this help.
#
# Tenant mode needs a JWT: export SF_TENANT_TOKEN (see scripts/sf-tenant-token.sh).
# The CLI session token is opaque and the Data 360 mesh rejects it with HTTP 400.
#
# Exit codes: 0 success, 1 usage/config error, 2 HTTP error, 3 CLI error.

set -euo pipefail

ORG="${SF_TARGET_ORG:-}"
METHOD="GET"
PATH_ARG=""
QUERY=""
BODY=""
TENANT=0
TENANT_URL="${DATA360_TENANT_URL:-}"
API_VERSION="${SF_API_VERSION:-66.0}"
RAW=0
INCLUDE=0
HEADERS=()

die() { printf 'sf-api: %s\n' "$1" >&2; exit "${2:-1}"; }

usage() { sed -n '3,45p' "$0" | sed 's/^# \{0,1\}//'; exit 0; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    -o|--org)          ORG="$2"; shift 2 ;;
    -X|--method)       METHOD="$(printf '%s' "$2" | tr '[:lower:]' '[:upper:]')"; shift 2 ;;
    -p|--path)         PATH_ARG="$2"; shift 2 ;;
    -q|--query)        QUERY="$2"; shift 2 ;;
    -b|--body)         BODY="$2"; shift 2 ;;
    -H|--header)       HEADERS+=("$2"); shift 2 ;;
    -t|--tenant)       TENANT=1; shift ;;
    -T|--tenant-url)   TENANT_URL="$2"; shift 2 ;;
    -a|--api-version)  API_VERSION="$2"; shift 2 ;;
    -r|--raw)          RAW=1; shift ;;
    -i|--include)      INCLUDE=1; shift ;;
    -h|--help)         usage ;;
    *)                 die "unknown option '$1' (try --help)" ;;
  esac
done

[[ -n "$PATH_ARG" ]] || die "missing --path (try --help)"

command -v sf >/dev/null 2>&1 || die "Salesforce CLI ('sf') not found on PATH. Install it, then run 'sf org login web'." 3

# ---------------------------------------------------------------------------
# Resolve the target org. Prefer an explicit --org, then $SF_TARGET_ORG, then
# whatever `sf` has configured as the default.
# ---------------------------------------------------------------------------
if [[ -z "$ORG" ]]; then
  ORG="$(sf config get target-org --json 2>/dev/null \
    | python3 -c 'import json,sys; d=json.load(sys.stdin); print((d.get("result") or [{}])[0].get("value") or "")' 2>/dev/null || true)"
fi
[[ -n "$ORG" ]] || die "no target org. Pass --org <alias>, set SF_TARGET_ORG, or run 'sf config set target-org=<alias>'." 3

# ---------------------------------------------------------------------------
# Read org details once. Used for the instance URL and, in tenant mode, the
# access token.
# ---------------------------------------------------------------------------
ORG_JSON="$(sf org display --target-org "$ORG" --json 2>/dev/null)" \
  || die "could not read org '$ORG'. Run 'sf org login web --alias $ORG' first." 3

read_field() {
  printf '%s' "$ORG_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['result'].get('$1') or '')"
}

INSTANCE_URL="$(read_field instanceUrl)"
[[ -n "$INSTANCE_URL" ]] || die "org '$ORG' reported no instanceUrl." 3

# Normalise the path to a single leading slash.
PATH_ARG="/${PATH_ARG#/}"

# Buffer stdin first: `python3 -m json.tool` consumes it, so a `|| cat` fallback
# would otherwise read nothing when the payload is not valid JSON.
pretty() {
  local data
  data="$(cat)"
  if [[ "$RAW" -eq 1 ]]; then
    printf '%s\n' "$data"
    return
  fi
  if printf '%s' "$data" | python3 -m json.tool 2>/dev/null; then
    return
  fi
  printf '%s\n' "$data"
}

# ---------------------------------------------------------------------------
# Tenant mode — Data 360 core APIs (/api/v1, /api/v2) live on the c360a host.
# ---------------------------------------------------------------------------
if [[ "$TENANT" -eq 1 ]]; then
  if [[ -z "$TENANT_URL" ]]; then
    die "tenant mode needs a host. Set DATA360_TENANT_URL (e.g. https://my-tenant.c360a.salesforce.com) or pass --tenant-url." 1
  fi
  TENANT_URL="${TENANT_URL%/}"
  # Prefer an OAuth client-credentials JWT (SF_TENANT_TOKEN) when present: the
  # Data 360 mesh rejects the opaque CLI session token with HTTP 400. Fall back
  # to the session token so the failure is still visible with a clear message.
  if [[ -n "${SF_TENANT_TOKEN:-}" ]]; then
    TOKEN="$SF_TENANT_TOKEN"
  else
    TOKEN="$(read_field accessToken)"
    [[ -n "$TOKEN" ]] || die "org '$ORG' reported no accessToken." 3
    if [[ -z "${SF_TENANT_TOKEN_WARNED:-}" ]]; then
      printf 'sf-api: warning: no SF_TENANT_TOKEN set; using the CLI session token.\n' >&2
      printf 'sf-api:          the Data 360 mesh rejects session tokens (HTTP 400).\n' >&2
      printf 'sf-api:          Run scripts/sf-tenant-token.sh for a client-credentials JWT.\n' >&2
    fi
  fi

  URL="${TENANT_URL}${PATH_ARG}"
  [[ -n "$QUERY" ]] && URL="${URL}?${QUERY}"

  CURL_ARGS=(-s -w '\n%{http_code}' -X "$METHOD" -H "Authorization: Bearer $TOKEN" -H 'Accept: application/json')
  for h in "${HEADERS[@]:-}"; do [[ -n "$h" ]] && CURL_ARGS+=(-H "$h"); done
  if [[ -n "$BODY" ]]; then
    CURL_ARGS+=(-H 'Content-Type: application/json')
    if [[ "$BODY" == @* ]]; then CURL_ARGS+=(--data-binary "@${BODY#@}")
    elif [[ "$BODY" == "-" ]]; then CURL_ARGS+=(--data-binary @-)
    else CURL_ARGS+=(--data-binary "$BODY"); fi
  fi

  RESPONSE="$(curl "${CURL_ARGS[@]}" "$URL")" || die "curl failed for $URL" 2
  STATUS="${RESPONSE##*$'\n'}"
  PAYLOAD="${RESPONSE%$'\n'*}"

  printf '%s' "$PAYLOAD" | pretty
  if [[ "$STATUS" -ge 400 ]]; then
    printf '\nsf-api: HTTP %s from %s %s\n' "$STATUS" "$METHOD" "$URL" >&2
    exit 2
  fi
  exit 0
fi

# ---------------------------------------------------------------------------
# Instance mode — the common case. `sf api request rest` handles auth, retries,
# and the instance prefix for us.
# ---------------------------------------------------------------------------
# `sf api request rest` has no --query flag, so fold query params into the URL.
URL_PATH="services/data/v${API_VERSION}${PATH_ARG}"
[[ -n "$QUERY" ]] && URL_PATH="${URL_PATH}?${QUERY}"

SF_ARGS=(api request rest "$URL_PATH" --method "$METHOD" --target-org "$ORG")
[[ "$INCLUDE" -eq 1 ]] && SF_ARGS+=(--include)
for h in "${HEADERS[@]:-}"; do [[ -n "$h" ]] && SF_ARGS+=(--header "$h"); done

# `sf api request rest` requires a body entry for every method, including GET
# and DELETE. Passing `--body -` with empty stdin satisfies it without sending
# a payload.
EMPTY_BODY=0
if [[ -z "$BODY" ]]; then
  SF_ARGS+=(--body -)
  EMPTY_BODY=1
elif [[ "$BODY" == @* ]]; then
  SF_ARGS+=(--body "@${BODY#@}")
elif [[ "$BODY" == "-" ]]; then
  SF_ARGS+=(--body -)
else
  SF_ARGS+=(--body "$BODY")
fi

set +e
if [[ "$EMPTY_BODY" -eq 1 ]]; then
  OUTPUT="$(printf '' | sf "${SF_ARGS[@]}" 2>&1)"
else
  OUTPUT="$(sf "${SF_ARGS[@]}" 2>&1)"
fi
STATUS=$?
set -e

# `sf` prints update-available and beta warnings; drop them so JSON stays clean.
OUTPUT="$(printf '%s' "$OUTPUT" \
  | grep -v 'update available from' \
  | grep -v '^ ›   Warning:' \
  | grep -v 'This command is currently in beta' \
  | grep -v '^Warning: This command is currently in beta' || true)"

if [[ "$STATUS" -ne 0 ]]; then
  printf '%s\n' "$OUTPUT" >&2
  exit 2
fi

printf '%s' "$OUTPUT" | pretty
