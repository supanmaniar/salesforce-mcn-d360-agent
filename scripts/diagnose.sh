#!/usr/bin/env bash
#
# diagnose.sh — work out *why* a Data 360 call is failing.
#
# The three API families fail in ways that look alike but have different causes,
# so this script probes each one and interprets the HTTP status for you.
#
# The important distinction is on the Data 360 tenant host:
#
#   401  no credential, or a well-formed JWT that failed validation
#   400  credential is not a JWT at all (the mesh gateway rejects it before
#        validation) — this is what an `sf org login` session token produces,
#        because session tokens are opaque, single-segment strings
#   404  the route does not exist
#
# A 400 on every real /api/v1 path means the tenant needs an OAuth client-
# credentials JWT from a Connected App / External Client App. See
# docs/TROUBLESHOOTING.md.
#
# Usage:
#   ./scripts/diagnose.sh
#   ./scripts/diagnose.sh --tenant-url https://my-tenant.c360a.salesforce.com
#   ./scripts/diagnose.sh --org my-org
#
# Exit codes: 0 everything reachable, 1 at least one family failed, 3 CLI/config error.

set -euo pipefail

ORG="${SF_TARGET_ORG:-}"
TENANT_URL="${DATA360_TENANT_URL:-}"
API_VERSION="${SF_API_VERSION:-66.0}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -o|--org)          ORG="$2"; shift 2 ;;
    -T|--tenant-url)   TENANT_URL="$2"; shift 2 ;;
    -a|--api-version)  API_VERSION="$2"; shift 2 ;;
    -h|--help)         sed -n '3,25p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)                 printf 'diagnose: unknown option %s\n' "$1" >&2; exit 3 ;;
  esac
done

command -v sf >/dev/null 2>&1 || { printf 'diagnose: sf CLI not found on PATH\n' >&2; exit 3; }
command -v curl >/dev/null 2>&1 || { printf 'diagnose: curl not found on PATH\n' >&2; exit 3; }

if [[ -z "$ORG" ]]; then
  ORG="$(sf config get target-org --json 2>/dev/null \
    | python3 -c 'import json,sys; d=json.load(sys.stdin); print((d.get("result") or [{}])[0].get("value") or "")' 2>/dev/null || true)"
fi
[[ -n "$ORG" ]] || { printf 'diagnose: no target org. Pass --org or set SF_TARGET_ORG.\n' >&2; exit 3; }

ORG_JSON="$(sf org display --target-org "$ORG" --json 2>/dev/null)" \
  || { printf 'diagnose: cannot read org %s. Run "sf org login web --alias %s" first.\n' "$ORG" "$ORG" >&2; exit 3; }

read_field() { printf '%s' "$ORG_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['result'].get('$1') or '')"; }

INSTANCE_URL="$(read_field instanceUrl)"
ACCESS_TOKEN="$(read_field accessToken)"
[[ -n "$INSTANCE_URL" ]] || { printf 'diagnose: org %s reported no instanceUrl\n' "$ORG" >&2; exit 3; }

FAILED=0

# probe <url> [extra curl args...] -> prints the HTTP status
probe() {
  local url="$1"; shift
  curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$@" "$url" || printf '000'
}

status_line() {  # <label> <status> <ok-status>
  local label="$1" status="$2" expected="$3"
  if [[ "$status" == "$expected" ]]; then
    printf '  \033[32mPASS\033[0m  %-46s HTTP %s\n' "$label" "$status"
  else
    printf '  \033[31mFAIL\033[0m  %-46s HTTP %s (expected %s)\n' "$label" "$status" "$expected"
    FAILED=1
  fi
}

printf '\nData 360 connectivity diagnosis\n'
printf '  org      : %s\n' "$ORG"
printf '  instance : %s\n' "$INSTANCE_URL"
printf '  tenant   : %s\n\n' "${TENANT_URL:-<not set>}"

# ---------------------------------------------------------------------------
# 1. Session
# ---------------------------------------------------------------------------
printf '1. Salesforce CLI session\n'
if [[ -n "$ACCESS_TOKEN" ]]; then
  printf '  \033[32mPASS\033[0m  %-46s %s\n' 'access token present' "$(printf '%s' "$ACCESS_TOKEN" | cut -c1-12)..."
  SEGMENTS="$(printf '%s' "$ACCESS_TOKEN" | awk -F. '{print NF}')"
  printf '  info  %-46s %s segment(s)\n' 'token format' "$SEGMENTS"
  if [[ "$SEGMENTS" -eq 1 ]]; then
    printf '  info  %-46s %s\n' '  -> opaque session token, not a JWT' 'expected for sf org login'
  fi
else
  printf '  \033[31mFAIL\033[0m  %-46s\n' 'no access token in sf org display'
  FAILED=1
fi
printf '\n'

# ---------------------------------------------------------------------------
# 2. Instance families (mc-next, data360-connect)
# ---------------------------------------------------------------------------
printf '2. Instance-host families (mc-next, data360-connect)\n'
CONNECT_PATHS=(
  "/services/data/v${API_VERSION}/ssot/segments"
  "/services/data/v${API_VERSION}/ssot/data-streams"
  "/services/data/v${API_VERSION}/ssot/data-spaces"
)
for p in "${CONNECT_PATHS[@]}"; do
  s="$(probe "$INSTANCE_URL$p" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H 'Accept: application/json' \
        -H 'X-Chatter-Entity-Encoding: string')"
  status_line "data360-connect $p" "$s" 200
done
printf '\n'

# ---------------------------------------------------------------------------
# 3. Tenant host
# ---------------------------------------------------------------------------
printf '3. Tenant host (data360 family)\n'
if [[ -z "$TENANT_URL" ]]; then
  printf '  skip  %-46s\n' 'DATA360_TENANT_URL not set'
  printf '        The data360 family cannot be used without it.\n'
else
  TENANT_URL="${TENANT_URL%/}"

  # Control probes: prove the gateway distinguishes real routes from unknown ones.
  s_root="$(probe "$TENANT_URL/")"
  s_nonsense="$(probe "$TENANT_URL/api/v1/nonsense-xyz" \
        -H "Authorization: Bearer $ACCESS_TOKEN")"
  if [[ "$s_nonsense" == "404" ]]; then
    printf '  \033[32mPASS\033[0m  %-46s HTTP %s\n' 'gateway reachable (unknown route 404s)' "$s_nonsense"
  else
    printf '  \033[31mFAIL\033[0m  %-46s HTTP %s\n' 'gateway unreachable or not routing' "$s_nonsense"
    printf '        Check DATA360_TENANT_URL. Host root returned HTTP %s.\n' "$s_root"
    FAILED=1
  fi

  # Credential probes.
  s_noauth="$(probe "$TENANT_URL/api/v1/metadata")"
  s_session="$(probe "$TENANT_URL/api/v1/metadata" -H "Authorization: Bearer $ACCESS_TOKEN")"

  printf '  info  %-46s HTTP %s\n' 'no credential' "$s_noauth"
  printf '  info  %-46s HTTP %s\n' 'session token' "$s_session"
  printf '\n'

  if [[ "$s_session" == "200" ]]; then
    printf '  \033[32mPASS\033[0m  session token accepted by the tenant gateway.\n'
  elif [[ "$s_session" == "400" && "$s_noauth" == "401" ]]; then
    printf '  \033[31mBLOCKED\033[0m  The tenant gateway rejects the session token.\n\n'
    printf '           Cause: /api/v1 and /api/v2 are served by a service mesh that\n'
    printf '           requires an OAuth 2.0 client-credentials JWT. "sf org login"\n'
    printf '           issues an opaque, single-segment session token, which the mesh\n'
    printf '           cannot parse, so it returns 400 with an empty body.\n\n'
    printf '           Fix: create a Connected App / External Client App with the Data 360\n'
    printf '           scopes, then mint a token with scripts/sf-tenant-token.sh.\n'
    printf '           See docs/TROUBLESHOOTING.md.\n'
    FAILED=1
  elif [[ "$s_session" == "401" ]]; then
    printf '  \033[31mFAIL\033[0m  credential rejected (401). Token may be expired or lack D360 scopes.\n'
    FAILED=1
  elif [[ "$s_session" == "404" ]]; then
    printf '  \033[31mFAIL\033[0m  route not found (404). This tenant host may not serve Data 360.\n'
    FAILED=1
  else
    printf '  \033[31mFAIL\033[0m  unexpected status HTTP %s.\n' "$s_session"
    FAILED=1
  fi
fi
printf '\n'

if [[ "$FAILED" -eq 0 ]]; then
  printf '\033[32mAll reachable.\033[0m\n\n'
  exit 0
fi

printf '\033[31mOne or more checks failed.\033[0m See docs/TROUBLESHOOTING.md.\n\n'
exit 1
