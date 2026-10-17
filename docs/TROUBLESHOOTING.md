# Troubleshooting

Run the built-in diagnostic first — it interprets the status codes for you:

```bash
SF_TARGET_ORG=my-org \
DATA360_TENANT_URL=https://<tenant>.c360a.salesforce.com \
./scripts/diagnose.sh
```

---

## The one that catches everyone: HTTP 400 on every `/api/v1` path

**Symptom.** Calls to the `data360` family fail with HTTP 400 and an empty
response body, on every path, no matter what headers you send. Meanwhile
`data360-connect` calls on `/services/data/vXX.X/ssot/...` return 200.

```
sf-api: HTTP 400 from GET https://<tenant>.c360a.salesforce.com/api/v1/metadata
```

**Cause.** The Data 360 tenant host requires a **JWT** bearer token minted by an
OAuth 2.0 client-credentials grant. The `sf org login` session token is opaque,
so the mesh gateway cannot parse it and rejects the request before validating it.

**Fix.** Create a Connected App / External Client App with the Data 360 scopes and
use a client-credentials token. Full walkthrough:
[CONNECTED-APP-SETUP.md](./CONNECTED-APP-SETUP.md).

```bash
eval "$(./scripts/sf-tenant-token.sh --export)"
./scripts/sf-api.sh --tenant --path /api/v1/metadata
```

### How to tell the two apart

The gateway distinguishes several cases. To reproduce this on your own tenant:

```bash
T=$(sf org display -o "$SF_TARGET_ORG" --json | python3 -c 'import json,sys; print(json.load(sys.stdin)["result"]["accessToken"])')
H=https://<tenant>.c360a.salesforce.com

curl -s -o /dev/null -w 'no auth       %{http_code}\n' "$H/api/v1/metadata"
curl -s -o /dev/null -w 'session token %{http_code}\n' -H "Authorization: Bearer $T" "$H/api/v1/metadata"
curl -s -o /dev/null -w 'unknown route %{http_code}\n' -H "Authorization: Bearer $T" "$H/api/v1/nonsense-xyz"
```

Expected on an org with no Connected App:

```
no auth       401
session token 400
unknown route 404
```

| Status | Meaning | What to do |
| --- | --- | --- |
| **401** with no `Authorization` header | No credential supplied | Send a token |
| **400** with a session token | Credential is not a JWT — the mesh rejected it at parse time | Use a client-credentials token (this page) |
| **401** with a JWT | JWT parsed, signature or claims rejected | Token expired, or wrong audience/issuer |
| **403** with a JWT | Authenticated but not authorised | Add the missing Data 360 scope, or grant the Run As user access |
| **404** on a real path | Route genuinely absent | Check the tenant URL and API version |
| **404** on a nonsense path | Correct — proves the gateway is routing | Nothing; this is the control probe |

The 400-versus-401 split is the useful signal: **400 means "not a JWT", 401 means
"a JWT, but not a good one".**

### Confirming it is a token-shape problem, not headers

The rejection is independent of everything else in the request. All of these
return 400 with the same session token:

| Variation on `/api/v1/metadata` | Result |
| --- | --- |
| `Accept: application/json` | 400 |
| plus `Content-Type: application/json` | 400 |
| no `Accept` at all | 400 |
| `--http1.1` forced | 400 |

And the response headers show a gateway, not an application:

```
HTTP/2 400
content-length: 0
server: istio-envoy
x-envoy-upstream-service-time: 10
```

`content-length: 0` plus a single-digit upstream time means the request was
refused at the mesh edge before reaching any Data 360 service.

### Proving the token shape is the variable

Send a well-formed but unsigned JWT instead of the session token:

```bash
FAKE='eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0In0.c2ln'
curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $FAKE" "$H/api/v1/metadata"
```

| Credential | Segments | Result |
| --- | --- | --- |
| no auth | — | 401 |
| well-formed JWT | 3 | **401** — parsed, then rejected |
| session token | 1 | **400** — never parsed |
| arbitrary string | 1 | **400** — never parsed |

The status tracks the *number of dot-separated segments*, not the token's
validity. That is the mesh applying a JWT parser at the edge.

---

## HTTP 404 on the tenant host root

```
curl https://<tenant>.c360a.salesforce.com/
```

returns 404. This is expected — the tenant host serves no root page. It is not a
sign the host is wrong. Use the control probe instead: an unknown `/api/v1/*`
path should return 404 while a real one returns 400, which proves the gateway is
recognising routes. If *both* return 404, the hostname is probably wrong.

---

## `data360-connect` works but `data360` does not

This is the expected shape of a correctly configured org with no Connected App:

| Family | Host | Needs a Connected App? |
| --- | --- | --- |
| `mc-next` | org instance | No |
| `data360-connect` | org instance | No |
| `data360` | Data 360 tenant | **Yes** |

So a green `./scripts/sf-api.sh --path /ssot/segments` says nothing about whether
`/api/v1/metadata` will work. They are different hosts with different auth.

The SSOT routes also exist on the *instance* host and not on the *tenant* host —
`/services/data/vXX.X/ssot/segments` returns 200 on the instance and 404 on the
tenant. Route the family by host, not by guessing.

---

## `sf api request rest` ignores absolute URLs

`sf api request rest` always prefixes the org instance, so it cannot reach the
tenant host. That is why `sf-api.sh` switches to `curl` in `--tenant` mode.

---

## `invalid_request: scope parameter not supported`

Do not send a `scope` parameter in the client-credentials request. Salesforce
rejects it. `sf-tenant-token.sh` omits it by default — the app's pre-approved
scopes are what get granted.

---

## `invalid_client_id` right after creating the app

New Connected Apps take a few minutes to propagate. Wait and retry. If it
persists, confirm you copied the **Consumer Key**, not a client ID from somewhere
else.

---

## Still stuck?

Open an issue with the output of `./scripts/diagnose.sh`. It is written to be
safe to share: it prints token prefixes and HTTP statuses, never full tokens or
secrets.
