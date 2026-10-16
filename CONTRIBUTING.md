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

There is no test suite. Verify against a real org:

```bash
export SF_TARGET_ORG=my-org

# Scripts work
node scripts/catalog-search.mjs stats
node scripts/catalog-search.mjs list --family mc-next --limit 3
./scripts/sf-api.sh --path /limits

# Links and frontmatter resolve
python3 - <<'EOF'
import re, os, glob
bad = 0
for f in glob.glob('.github/**/*.md', recursive=True) + glob.glob('*.md'):
    base = os.path.dirname(f)
    for m in re.finditer(r'\[([^\]]+)\]\(([^)]+)\)', open(f).read()):
        t = m.group(2)
        if t.startswith(('http', '#', 'mailto')): continue
        p = os.path.normpath(os.path.join(base, t))
        if not os.path.exists(p):
            print(f'BROKEN {f}: {t}'); bad += 1
print(f'{bad} broken link(s)' if bad else 'All links resolve')
EOF
```

## Guidelines

- **Never commit credentials.** No tokens, client secrets, or org-specific
  identifiers. The agent reuses the `sf` CLI session.
- **Document only what you have verified.** Command flags and response shapes
  change between CLI and API versions — run the command before writing it down.
- **Keep destructive operations clearly marked.** The catalog flags them with
  `destructive: true`; skills should tell the agent to confirm first.
- **Conventional commits** (`feat:`, `fix:`, `docs:`, `chore:`).
