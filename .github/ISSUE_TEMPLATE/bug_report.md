---
name: Bug report
about: Report something that is broken or behaving unexpectedly
title: '[Bug] '
labels: ['bug']
assignees: ''
---

<!--
Thanks for the report. The environment details below matter a lot here, because
most problems turn out to be configuration rather than code. Please fill them in
— it usually saves a round trip.
-->

## What happened

<!-- A clear description of the bug. -->

## What you expected to happen

<!-- What you thought would happen instead. -->

## Steps to reproduce

1.
2.
3.

## Command and output

<!--
Paste the exact command and its output. Redact your org alias, username, and any
tokens before posting.
-->

```bash
$ 
```

```text

```

## Environment

| | |
| --- | --- |
| Salesforce CLI version (`sf --version`) | |
| Node version (`node --version`) | |
| OS | |
| API family involved | `mc-next` / `data360` / `data360-connect` / platform |
| Auth mode | `sf org login web` / `jwt` / other |

## Which part of the repo

- [ ] Custom agent (`.github/agents/`)
- [ ] A skill (`.github/skills/`)
- [ ] `scripts/sf-api.sh`
- [ ] `scripts/catalog-search.mjs`
- [ ] Catalog data
- [ ] Documentation

## Anything else

<!--
For Data 360 core API issues, note whether DATA360_TENANT_URL is set. The
`data360` family is the only one that needs it.
-->
