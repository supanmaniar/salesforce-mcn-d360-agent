# Connected App setup for the Data 360 API family

The `data360` family (`/api/v1`, `/api/v2`) is the **only** family in this agent that
cannot run purely off the Salesforce CLI session. It needs an OAuth 2.0
client-credentials token from a Connected App (or External Client App).

The `mc-next` and `data360-connect` families need none of this — they work with a
plain `sf org login`.

---

## Why it is needed

The Data 360 tenant host sits behind a service mesh (`server: istio-envoy`) that
only accepts a **JWT** bearer token. The session token written by `sf org login`
is opaque and single-segment:

```
00DHp00000KNcvk!AQwAQBE1lIqbMl...      # 1 segment  -> opaque  -> HTTP 400
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9…  # 3 segments -> JWT    -> HTTP 401
```

The mesh cannot parse the opaque token, so it rejects the request with **HTTP 400
and a zero-length body** before any validation happens. A JWT gets past the parser
and is rejected on its merits (401).

Run `./scripts/diagnose.sh` to see this for your own org.

---

## What you need

| Item | Where it comes from |
| --- | --- |
| Consumer Key | Connected App → Manage Consumer Details (this is `SF_CLIENT_ID`) |
| Consumer Secret | same screen (this is `SF_CLIENT_SECRET`) |
| Client Credentials Flow | enabled in the app's OAuth settings |
| Run As user | set in the app's OAuth policy |
| Data 360 scopes | selected in the app's OAuth settings |

### Scopes

Select the Data 360 scopes that match the endpoints you intend to call. In the
scope picker they are grouped under **Data 360** (older orgs label them
*Data Cloud*).

| API name | Use it for |
| --- | --- |
| `cdp_query_api` | `/api/v1/query`, `/api/v2/query`, `/api/v1/dataGraph`, `/api/v1/metadata` |
| `cdp_profile_api` | `/api/v1/profile/*`, `/api/v1/universalIdLookup/*` |
| `cdp_ingest_api` | `/api/v1/ingest/*` |
| `sfdc_cms_api` | the `mc-next` family (Content/CMS) — only if you also want that family scoped |

If you call a Data 360 endpoint without its scope you get a `403`, not a `400`.
A `400` means the token was never a JWT at all.

---

## Create the app

### Option A — External Client App (recommended for new orgs)

1. **Setup → External Client Apps → New External Client App**.
2. Fill in name and contact email.
3. Under **API (Enable OAuth Settings)**, tick **Enable OAuth**.
4. Set a callback URL. Client credentials never redirects, but the field is
   required — use `https://login.salesforce.com/services/oauth2/success`.
5. Add the Data 360 scopes from the table above.
6. Under **Flow Enablement**, tick **Enable Client Credentials Flow**.
7. Set the **Run As** user. This is the identity every token will act as, so give
   it a least-privilege integration user rather than a human admin.
8. Create, then **Consumer Key and Secret** → copy both.

### Option B — Connected App

1. **Setup → App Manager → New Connected App**.
2. Tick **Enable OAuth Settings**.
3. Callback URL as above; add the same Data 360 scopes.
4. Tick **Enable Client Credentials Flow** and set the Run As user.
5. Save, **wait a few minutes** for the app to propagate — a brand-new app
   frequently returns `invalid_client_id` until it has.
6. **Manage Consumer Details** → copy the Consumer Key and Secret.

### Permissions for the Run As user

The Run As user needs Data 360 access of its own. A client-credentials token
carries the scopes of the app **and** the permissions of that user; if the user
cannot see the tenant data, the API returns `403` even with correct scopes.
Assign an appropriate Data 360 permission set licence and permission set.

---

## Configure the agent

```bash
cp .env.example .env
```

Then set:

```dotenv
SF_CLIENT_ID=<consumer key>
SF_CLIENT_SECRET=<consumer secret>
```

Never commit `.env` — it is git-ignored. For CI, use repository secrets.

---

## Use it

```bash
# Mint a token and put it in the environment
eval "$(./scripts/sf-tenant-token.sh --export)"

# Call a Data 360 endpoint
./scripts/sf-api.sh --tenant --path /api/v1/metadata
```

`sf-api.sh` automatically prefers `SF_TENANT_TOKEN` when it is set, and falls back
to the CLI session token with a warning if it is not.

Tokens are bearer credentials: they expire (typically after 2 hours) and should
not be logged, committed, or shared. `--cache 3600` reuses a token for an hour
instead of minting a new one on every call.

---

## Verify

```bash
./scripts/diagnose.sh --tenant-url https://<tenant>.c360a.salesforce.com
```

Before the app exists you will see:

```
3. Tenant host (data360 family)
  PASS  gateway reachable (unknown route 404s)         HTTP 404
  info  no credential                                  HTTP 401
  info  session token                                  HTTP 400

  BLOCKED  The tenant gateway rejects the session token.
```

After setting `SF_TENANT_TOKEN` from a correctly scoped app, the same endpoints
should return `200`.

---

## Troubleshooting the app itself

| Error from `sf-tenant-token.sh` | Cause |
| --- | --- |
| `invalid_client_id` | Wrong consumer key, or the app has not finished propagating |
| `invalid_client_credential` | Wrong consumer secret |
| `unsupported_grant_type` | Client Credentials Flow is not enabled on the app |
| `invalid_request: scope parameter not supported` | Do not send `scope` — dropped by default; only use `--scope` if your org requires it |

The script reproduces exactly what the MCP server sends: `grant_type`,
`client_id`, `client_secret`, and nothing else.
