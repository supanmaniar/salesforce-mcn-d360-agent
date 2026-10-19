# Salesforce MCN + D360 Agent

[![CI](https://img.shields.io/github/actions/workflow/status/supanmaniar/salesforce-mcn-d360-agent/ci.yml?branch=main&label=CI)](https://github.com/supanmaniar/salesforce-mcn-d360-agent/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/supanmaniar/salesforce-mcn-d360-agent)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![Salesforce CLI](https://img.shields.io/badge/Salesforce%20CLI-v2-00A1E0)](https://developer.salesforce.com/tools/salesforcecli)
[![Endpoints](https://img.shields.io/badge/endpoints-445-blue)](catalog/endpoints.json)
[![Skills](https://img.shields.io/badge/skills-7-purple)](.github/skills)
[![No MCP](https://img.shields.io/badge/MCP-not%20required-success)](#why-no-mcp)

A **GitHub Copilot agent** for Salesforce **Marketing Cloud Next** and **Data 360**
administration. It runs on the **Salesforce CLI** — no MCP server, and no credentials
for two of the three API families.

Ask Copilot to list your Data 360 segments, add a custom field, query records, or debug a
data stream, and it does the work through the `sf` session you already have.

**At a glance**

- **445 API endpoints** across 3 families and 44 resource groups, from a generated catalog
- **7 skills** covering all 30 tools of the equivalent MCP server
- **1 custom agent** — pick it from the agent selector, or just ask a Salesforce question
- **Zero credentials** for `mc-next` and `data360-connect` — reuses your `sf` CLI session
- **One exception** — the `data360` core APIs (`/api/v1`, `/api/v2`) need a Connected App

> **Note on the third family.** The Data 360 tenant host accepts only an OAuth
> client-credentials **JWT**; the CLI session token is opaque and is rejected with
> HTTP 400. `data360` therefore needs a Connected App — see
> [Connected App setup](docs/CONNECTED-APP-SETUP.md). Everything else runs on
> `sf org login` alone.

**Setup**

| Family | Setup needed |
| --- | --- |
| `mc-next`, `data360-connect` | `sf org login web` |
| `data360` | the above, plus `DATA360_TENANT_URL` and a Connected App |

---

## Why no MCP?

The sibling project [`mc-next-mcp-server`](https://github.com/supanmaniar/salesforce-mc-next-mcp)
exposes the same APIs as an MCP server. That works, but it means running a Node process,
configuring a client, and managing OAuth credentials.

This repo takes the other path: the agent calls the Salesforce CLI directly. For the
content and segment APIs — most day-to-day work — that means nothing to install
and nothing to configure.

| | MCP server | This agent |
| --- | --- | --- |
| Setup | Install, configure client, create Connected App | `sf org login web` (plus a Connected App for `data360`) |
| Credentials | Client id + secret | None for `mc-next` / `data360-connect`; a Connected App for `data360` |
| Runs as | A background process | Nothing extra |
| Identity | An integration user | **You** (or the app's Run As user for `data360`) |
| Works in CI | Yes | Yes (with `sf org login jwt`) |

The honest version of the comparison: the two families that serve content and
segments need nothing beyond `sf org login`, and that is most day-to-day work.
The `data360` core query APIs are the exception, and they need a Connected App in
the MCP server too — so that family is not a regression, just not a saving.

---

## Quick start

```bash
# 1. Install the Salesforce CLI and authenticate
sf org login web --alias my-org
sf org list

# 2. Point the agent at the org
export SF_TARGET_ORG=my-org

# 3. Try it
node scripts/catalog-search.mjs list --family data360-connect --group Segments
./scripts/sf-api.sh --path /ssot/segments --query 'batchSize=5'
```

Then open Copilot Chat, pick **Salesforce MCN + D360** from the agent selector, and ask
something like *"which Data 360 segments are active?"* or *"add a Priority picklist to
Account"*.

For the Data 360 core APIs (`/api/v1`, `/api/v2`) only, also set the tenant host:

```bash
export DATA360_TENANT_URL=https://my-tenant.c360a.salesforce.com
```

The `mc-next` and `data360-connect` families do not need this.

---

## What's here

| Path | Purpose |
| --- | --- |
| [.github/agents/salesforce-mcn-d360.agent.md](.github/agents/salesforce-mcn-d360.agent.md) | Custom agent — pick it in the agent selector |
| [.github/skills/](.github/skills) | 7 on-demand skills covering all 30 MCP tools |
| [.github/copilot-instructions.md](.github/copilot-instructions.md) | Always-on workspace instructions |
| [catalog/endpoints.json](catalog/endpoints.json) | 445 endpoints across 3 API families |
| [catalog/ENDPOINT-INDEX.md](catalog/ENDPOINT-INDEX.md) | Condensed markdown index |
| [scripts/catalog-search.mjs](scripts/catalog-search.mjs) | Discover and describe endpoints |
| [scripts/check-query-params.mjs](scripts/check-query-params.mjs) | Warn when a query parameter is not declared (silent-default guard) |
| [scripts/record-describe.mjs](scripts/record-describe.mjs) | Refresh the describe fixtures used to check writability claims |
| [scripts/sf-api.sh](scripts/sf-api.sh) | Authenticated REST calls via the CLI |
| [scripts/sf-tenant-token.sh](scripts/sf-tenant-token.sh) | Mint a Connected App token for the Data 360 family |
| [scripts/diagnose.sh](scripts/diagnose.sh) | Work out why a Data 360 call is failing |
| [scripts/validate.mjs](scripts/validate.mjs) | Repo integrity checks (runs in CI) |
| [docs/CONNECTED-APP-SETUP.md](docs/CONNECTED-APP-SETUP.md) | Create the app the `data360` family needs |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Diagnosing 400s, 401s, and 404s |

---

## Skills

Each skill loads on demand based on its description, so you do not pay the context cost
until it is relevant.

| Skill | Covers | Endpoints |
| --- | --- | --- |
| [mc-next-api](.github/skills/mc-next-api/SKILL.md) | Content, CMS spaces, variants, publish/unpublish, clone | 27 |
| [data360-api](.github/skills/data360-api/SKILL.md) | Query v1/v2, Profile, Ingestion, Metadata, Data Graph, Insights | 35 |
| [data360-connect-api](.github/skills/data360-connect-api/SKILL.md) | Data streams, segments, activations, identity resolution, governance | 383 |
| [platform-soql](.github/skills/platform-soql/SKILL.md) | SOQL, pagination, describe, REST explorer, org limits | — |
| [records-crud](.github/skills/records-crud/SKILL.md) | Record CRUD, Bulk API 2.0, composite requests | — |
| [metadata-crud](.github/skills/metadata-crud/SKILL.md) | Custom objects and fields via the Tooling API | — |
| [async-jobs-and-cache](.github/skills/async-jobs-and-cache/SKILL.md) | Job polling, caching, timeouts | — |

---

## API routing

The three families do **not** share a host. This is the most common source of errors:

| Family | Endpoints | Path prefix | Host | Auth | Invocation |
| --- | --- | --- | --- | --- | --- |
| `mc-next` | 27 | `/connect/cms/...` | org instance | CLI session | `./scripts/sf-api.sh --path ...` |
| `data360-connect` | 383 | `/ssot/...` | org instance | CLI session | `./scripts/sf-api.sh --path ...` |
| `data360` | 35 | `/api/v1`, `/api/v2` | Data 360 tenant | **Connected App JWT** | `./scripts/sf-api.sh --tenant --path ...` |

`sf api request rest` always prefixes the org instance and **ignores absolute URLs**, so
the `data360` family goes through tenant mode.

The Data 360 tenant host only accepts a client-credentials **JWT**. The `sf org login`
session token is opaque, and the tenant's mesh gateway rejects it with **HTTP 400 and an
empty body**. So `data360` is the one family that needs a Connected App:

```bash
eval "$(./scripts/sf-tenant-token.sh --export)"     # mint a client-credentials JWT
./scripts/sf-api.sh --tenant --path /api/v1/metadata
```

See [Connected App setup](docs/CONNECTED-APP-SETUP.md) to create the app, and
[Troubleshooting](docs/TROUBLESHOOTING.md) if you are seeing 400s.

### Diagnosing connectivity

```bash
SF_TARGET_ORG=my-org \
DATA360_TENANT_URL=https://<tenant>.c360a.salesforce.com \
./scripts/diagnose.sh
```

This probes each family and interprets the status codes — notably the difference between
**400** (credential is not a JWT) and **401** (JWT was parsed and rejected).

---

## Usage from the CLI

```bash
# Discover endpoints
node scripts/catalog-search.mjs list --family data360-connect --group Segments
node scripts/catalog-search.mjs list --search "data stream" --kind query
node scripts/catalog-search.mjs describe segments.create-segment
node scripts/catalog-search.mjs groups

# Call an endpoint
./scripts/sf-api.sh --path /ssot/segments --query 'batchSize=20'
./scripts/sf-api.sh --method POST --path /ssot/segments --body @payload.json

# Data 360 core APIs need a Connected App token (see docs/CONNECTED-APP-SETUP.md)
eval "$(./scripts/sf-tenant-token.sh --export)"
./scripts/sf-api.sh --tenant --path /api/v1/metadata

# Check connectivity across all three families
./scripts/diagnose.sh

# Native sf commands work too
sf data query --query "SELECT Id, Name FROM Account LIMIT 5" -o "$SF_TARGET_ORG" --json
sf sobject describe -s Account -o "$SF_TARGET_ORG" --json
sf org list limits -o "$SF_TARGET_ORG" --json
```

---

## Regenerating the catalog

The catalog is generated from the official Salesforce Postman collections:

```bash
# In the mc-next-mcp-server repo
npm run generate
cp catalog/endpoints.json ../salesforce-mcn-d360-agent/catalog/endpoints.json

# Regenerate the markdown index
cd ../salesforce-mcn-d360-agent
node scripts/catalog-search.mjs index > catalog/ENDPOINT-INDEX.md
```

CI fails if the index is stale.

---

## What we found the platform actually does

Every claim in the skills was tested against a live org. Several things behave
unlike the documentation suggests, and each is documented where you would hit it.

| Behaviour | What happens | Where |
| --- | --- | --- |
| The tenant host rejects session tokens | Opaque token -> **HTTP 400 with an empty body**, not 401 | [CONNECTED-APP-SETUP.md](docs/CONNECTED-APP-SETUP.md) |
| Unrecognised query params are ignored | The API applies its own default, so a typo returns a plausible-but-wrong result | `check-query-params.mjs` warns before the request |
| Short pages do not mean the end | `/ssot/data-lake-objects` returns 18, 17, 20, 15 across pages — an offset loop that stops on a short page returns **18 of 80** and reports success | [data360-connect-api](.github/skills/data360-connect-api/SKILL.md) |
| A listing `totalSize` can overcount | Reported 80; walking `nextPageUrl` yielded 70 unique items | [data360-connect-api](.github/skills/data360-connect-api/SKILL.md) |
| `/ssot/data-streams` offsets from 1 | `offset=0` and `offset=1` return the same page, so an offset loop skips the last page | [data360-connect-api](.github/skills/data360-connect-api/SKILL.md) |
| `EntityDefinition` never lists Data 360 objects | Returns **zero rows**, not an error, in an org with 1,067 DMOs | [platform-soql](.github/skills/platform-soql/SKILL.md) |
| Defined is not materialised | **1,067** DMOs existed; only **45** were queryable | [data360-connect-api](.github/skills/data360-connect-api/SKILL.md) |
| Data objects reject all DML | `CANNOT_INSERT_UPDATE_ACTIVATE_ENTITY` — a property of the object, not your permissions | [records-crud](.github/skills/records-crud/SKILL.md) |
| `destructive: no` is not a green light | `POST /connect/cms/spaces` creates a workspace with **no delete route** | [Safety](#safety) |
| Catalog optional flags can lie | `/ssot/connections` marks `connectorType` optional; the API requires it | [data360-connect-api](.github/skills/data360-connect-api/SKILL.md) |

Two of these are worth calling out:

**The 400-vs-401 split is the useful diagnostic.** On the Data 360 tenant host, a
*missing* credential returns 401, but a token that is not a JWT returns **400**. The
status tracks the number of dot-separated segments, so `./scripts/diagnose.sh` uses it
to tell "wrong token type" from "expired token".

**Irreversible creation is not flagged anywhere.** The catalog's `destructive` flag
describes the verb, not the outcome — a POST destroys nothing, so it reads `no` even
when what it creates cannot be removed. The agent checks for a matching DELETE before
creating a resource.

---

## Development and CI

```bash
node scripts/validate.mjs   # 8 checks: skills, links, catalog, secrets, drift, writability
shellcheck scripts/*.sh     # shell lint
```

`validate.mjs` needs **no org connection**. Checks that would normally require live
data compare against recorded fixtures in `catalog/describe-fixtures.json`, which
`scripts/record-describe.mjs` refreshes.

It verifies things that have silently drifted before:

- the resource-group table in `data360-connect-api` matches the generated catalog
- skills' writability claims match what `sobject describe` actually reports

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to tell a moved platform from broken docs.

---

## Safety

- **`destructive: true` marks permanent deletes** (records, segments, data streams,
  custom objects and fields). The agent confirms before running them, and
  `describe` reports the flag.
- **`destructive: no` is not a green light.** Creation can be irreversible when no
  delete route exists — `POST /connect/cms/spaces` creates a workspace that this
  API cannot remove. The agent checks for a matching DELETE before creating a
  resource and confirms when there is none.
- **Some objects reject all DML.** Data 360 data objects (`__dlm`, `__dll`) and CMS
  content (`ManagedContent`) are read-only by design; writes go to the family's own
  API. `records-crud` has the detail.
- **No credentials are stored.** The agent reuses the `sf` CLI session; tokens are read at
  runtime and never written to disk.
- **Polling loops are always bounded.**

See [SECURITY.md](SECURITY.md) for the full policy.

---

## License

[MIT](LICENSE) © Supan Maniar
