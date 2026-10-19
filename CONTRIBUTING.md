# Contributing

## Repository layout

| Path | Purpose |
| --- | --- |
| `.github/agents/` | Custom agent definitions (`.agent.md`) |
| `.github/skills/` | On-demand skills (`SKILL.md` + `references/`) |
| `.github/copilot-instructions.md` | Always-on workspace instructions |
| `catalog/` | Generated endpoint catalog and markdown index |
| `scripts/` | Catalog search and API helper scripts |

## Adding a skill

1. Create `.github/skills/<skill-name>/SKILL.md`.
2. The `name` field **must** match the folder name exactly.
3. Write a keyword-rich `description` — it is the only thing the agent sees
   during discovery, so include the trigger phrases a user would actually say.
4. Keep `SKILL.md` under ~500 lines. Put detail in `references/`.
5. Reference resources with relative paths (`./references/foo.md`).

```yaml
---
name: my-skill
description: 'What it does and when to use it. Include trigger words.'
---
```

## Adding an endpoint to the catalog

The catalog is **generated**, not hand-edited. To refresh it:

```bash
# In the mc-next-mcp-server repo
npm run generate
cp catalog/endpoints.json ../salesforce-mcn-d360-agent/catalog/endpoints.json

# Regenerate the markdown index
cd ../salesforce-mcn-d360-agent
node scripts/catalog-search.mjs index > catalog/ENDPOINT-INDEX.md
```

## Verifying changes

CI runs two gates on every push:

```bash
node scripts/validate.mjs   # skills, links, catalog, secrets, drift guards, unit tests
shellcheck scripts/*.sh     # shell
```

`validate.mjs` needs **no org connection** — checks that would normally require a
live org compare against recorded fixtures in `catalog/describe-fixtures.json`,
and the unit tests under `scripts/test/` build their inputs in memory.

Run the same gates locally before pushing. To verify against a real org:

```bash
export SF_TARGET_ORG=my-org

# Scripts work
node scripts/catalog-search.mjs stats
node scripts/catalog-search.mjs list --family mc-next --limit 3
./scripts/sf-api.sh --path /limits
```

### Unit tests

Two behaviours are extracted so they can be tested without an org, because both
fail in a way that misleads the person relying on them:

| Suite | Guards |
| --- | --- |
| [scripts/test/redact.test.mjs](scripts/test/redact.test.mjs) | `--redact` really hides literals, and reaches criteria outside the modules it was written for |
| [scripts/test/diff.test.mjs](scripts/test/diff.test.mjs) | `--fail-on-change` exits 1 on an unsound comparison, not just on drift |

```bash
node scripts/test/redact.test.mjs
node scripts/test/diff.test.mjs
```

**Both suites are negative-tested.** Each was run against the implementation it
replaced and fails on it — 6 of 12 and 6 of 17 respectively — so a green run means
the behaviour is genuinely asserted rather than merely described. When you change
`scripts/lib/redact.mjs` or the exit logic in `scripts/d360-diff.mjs`, confirm the
suite still fails when you break the behaviour on purpose.

The redaction suite is deliberately not scoped to known modules: it asserts that a
criteria blob under a module nobody has written yet is still redacted. That reach
is the property being protected, not the specific modules.

### The writability check and its fixtures

Several skills state whether objects accept DML. Those statements were wrong more
than once — always by over-generalising from a single object — so
`validate.mjs` verifies each claim against `catalog/describe-fixtures.json`.

If that check fails, one of two things changed. Determine which before editing:

```bash
SF_TARGET_ORG=my-org node scripts/record-describe.mjs
```

- **The fixture updates** (reports `CHANGED`) → the platform moved. Commit the
  fixture, then fix the skills.
- **The fixture is unchanged** (all `ok`) → the skill text is wrong. Fix the text.

Adding an object to the fixture is how you bring a new claim under the check:
add it to `objects` with its `family`, then run the recorder to fill in the flags.

To see the check work, deliberately invert a claim in any skill and confirm
`validate.mjs` fails with `[writability]`. A green run proves nothing on its own.

Links and frontmatter are covered by `validate.mjs`, so no separate script is
needed.

## Guidelines

- **Never commit credentials.** No tokens, client secrets, or org-specific
  identifiers. The agent reuses the `sf` CLI session.
- **Document only what you have verified.** Command flags and response shapes
  change between CLI and API versions — run the command before writing it down.
- **Keep destructive operations clearly marked.** The catalog flags them with
  `destructive: true`; skills should tell the agent to confirm first.
- **Conventional commits** (`feat:`, `fix:`, `docs:`, `chore:`).
