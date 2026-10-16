# Salesforce MCN + D360 Agent

[![CI](https://img.shields.io/github/actions/workflow/status/supanmaniar/salesforce-mcn-d360-agent/ci.yml?branch=main&label=CI)](https://github.com/supanmaniar/salesforce-mcn-d360-agent/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/supanmaniar/salesforce-mcn-d360-agent)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![Salesforce CLI](https://img.shields.io/badge/Salesforce%20CLI-v2-00A1E0)](https://developer.salesforce.com/tools/salesforcecli)
[![Endpoints](https://img.shields.io/badge/endpoints-445-blue)](catalog/endpoints.json)
[![Skills](https://img.shields.io/badge/skills-7-purple)](.github/skills)
[![No MCP](https://img.shields.io/badge/MCP-not%20required-success)](#why-no-mcp)

A **GitHub Copilot agent** for Salesforce **Marketing Cloud Next** and **Data 360**
administration. It runs entirely on the **Salesforce CLI** — no MCP server, no Connected
App, no client secret.

Ask Copilot to list your Data 360 segments, add a custom field, query records, or debug a
data stream, and it does the work through the `sf` session you already have.

**At a glance**

- **445 API endpoints** across 3 families and 44 resource groups, from a generated catalog
- **7 skills** covering all 30 tools of the equivalent MCP server
- **1 custom agent** — pick it from the agent selector, or just ask a Salesforce question
- **Zero credentials** — reuses your `sf` CLI session
- **Zero setup** beyond `sf org login web`

---

## Why no MCP?

The sibling project [`mc-next-mcp-server`](https://github.com/supanmaniar/salesforce-mc-next-mcp)
exposes the same APIs as an MCP server. That works, but it means running a Node process,
configuring a client, and managing OAuth credentials.

This repo takes the other path: the agent calls the Salesforce CLI directly. You get the
same 445 endpoints and 30 capabilities with nothing to install or configure.

| | MCP server | This agent |
| --- | --- | --- |
| Setup | Install, configure client, create Connected App | `sf org login web` |
| Credentials | Client id + secret | None — reuses the CLI session |
| Runs as | A background process | Nothing extra |
| Identity | An integration user | **You** |
| Works in CI | Yes | Yes (with `sf org login jwt`) |

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
| [scripts/sf-api.sh](scripts/sf-api.sh) | Authenticated REST calls via the CLI |
| [scripts/validate.mjs](scripts/validate.mjs) | Repo integrity checks (runs in CI) |

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

| Family | Endpoints | Path prefix | Host | Invocation |
| --- | --- | --- | --- | --- |
| `mc-next` | 27 | `/connect/cms/...` | org instance | `./scripts/sf-api.sh --path ...` |
| `data360-connect` | 383 | `/ssot/...` | org instance | `./scripts/sf-api.sh --path ...` |
| `data360` | 35 | `/api/v1`, `/api/v2` | Data 360 tenant | `./scripts/sf-api.sh --tenant --path ...` |

`sf api request rest` always prefixes the org instance and **ignores absolute URLs**, so
the `data360` family goes through tenant mode, which reads a token from `sf org display`
and calls the host with `curl`.

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
./scripts/sf-api.sh --tenant --path /api/v1/metadata

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

## Development

```bash
node scripts/validate.mjs   # skills, agents, links, catalog, secrets
shellcheck scripts/*.sh     # shell lint
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add a skill or refresh the catalog.

---

## Safety

- **Destructive operations** (deletes of records, segments, data streams, custom objects
  and fields) are permanent. The catalog marks them `destructive: true`, and the agent
  confirms before running them.
- **No credentials are stored.** The agent reuses the `sf` CLI session; tokens are read at
  runtime and never written to disk.
- **Polling loops are always bounded.**

See [SECURITY.md](SECURITY.md) for the full policy.

---

## License

[MIT](LICENSE) © Supan Maniar
