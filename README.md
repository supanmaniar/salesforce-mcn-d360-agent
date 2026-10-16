# Salesforce MCN + D360 Agent

A self-contained GitHub Copilot agent for Salesforce **Marketing Cloud Next** and
**Data 360** administration. It runs entirely on the **Salesforce CLI** — no MCP server,
no Connected App, no client secret.

This repository replaces [`mc-next-mcp-server`](../mc-next-mcp-server): all 30 tools that
server exposed are reproduced here as skills, scripts, and catalog data.

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

## Setup

1. **Install the Salesforce CLI** and authenticate:

   ```bash
   sf org login web --alias my-org
   sf org list
   ```

2. **Point the agent at the org:**

   ```bash
   export SF_TARGET_ORG=my-org
   ```

3. **For Data 360 core APIs only**, set the tenant host:

   ```bash
   export DATA360_TENANT_URL=https://my-tenant.c360a.salesforce.com
   ```

   The `mc-next` and `data360-connect` families do not need this.

## Usage

### In Copilot Chat

Pick **Salesforce MCN + D360** from the agent selector, or just ask a Salesforce
question — the skills load on demand based on their descriptions.

### From the CLI

```bash
# Discover endpoints
node scripts/catalog-search.mjs list --family data360-connect --group Segments
node scripts/catalog-search.mjs describe segments.create-segment

# Call an endpoint
./scripts/sf-api.sh --path /ssot/segments --query 'batchSize=20'

# Data 360 core APIs use the tenant host
./scripts/sf-api.sh --tenant --path /api/v1/metadata

# Native sf commands work too
sf data query --query "SELECT Id, Name FROM Account LIMIT 5" -o "$SF_TARGET_ORG" --json
```

## API routing

The three families do not share a host. This is the most common source of errors:

| Family | Endpoints | Path prefix | Host | Invocation |
| --- | --- | --- | --- | --- |
| `mc-next` | 27 | `/connect/cms/...` | org instance | `./scripts/sf-api.sh --path ...` |
| `data360-connect` | 383 | `/ssot/...` | org instance | `./scripts/sf-api.sh --path ...` |
| `data360` | 35 | `/api/v1`, `/api/v2` | Data 360 tenant | `./scripts/sf-api.sh --tenant --path ...` |

`sf api request rest` always prefixes the org instance and ignores absolute URLs, so the
`data360` family goes through tenant mode, which reads a token from `sf org display` and
calls the host with `curl`.

## Skills

| Skill | Covers |
| --- | --- |
| [mc-next-api](.github/skills/mc-next-api/SKILL.md) | Content, CMS spaces, variants, publish/unpublish, clone |
| [data360-api](.github/skills/data360-api/SKILL.md) | Query v1/v2, Profile, Ingestion, Metadata, Data Graph, Insights |
| [data360-connect-api](.github/skills/data360-connect-api/SKILL.md) | Data streams, segments, activations, identity resolution, governance |
| [platform-soql](.github/skills/platform-soql/SKILL.md) | SOQL, pagination, describe, REST explorer, org limits |
| [records-crud](.github/skills/records-crud/SKILL.md) | Record CRUD, bulk API, composite requests |
| [metadata-crud](.github/skills/metadata-crud/SKILL.md) | Custom objects and fields via the Tooling API |
| [async-jobs-and-cache](.github/skills/async-jobs-and-cache/SKILL.md) | Job polling, caching, timeouts |

## Regenerating the catalog

The catalog is generated from the official Salesforce Postman collections. To refresh it:

```bash
# In the mc-next-mcp-server repo
npm run generate
cp catalog/endpoints.json ../salesforce-mcn-d360-agent/catalog/endpoints.json

# Regenerate the markdown index
cd ../salesforce-mcn-d360-agent
node scripts/catalog-search.mjs index > catalog/ENDPOINT-INDEX.md
```

## Safety

- Destructive operations (deletes of records, segments, data streams, custom objects and
  fields) are permanent. The catalog marks them `destructive: true`; the agent confirms
  before running them.
- No credentials are stored. The agent reuses the `sf` CLI session.
- Polling loops are always bounded.
