#!/usr/bin/env node
/**
 * catalog-search.mjs — local replacement for the MCP server's
 * `mcnext_list_endpoints` and `mcnext_describe_endpoint` tools.
 *
 * Reads catalog/endpoints.json (445 endpoints across 3 API families) and lets
 * you discover and inspect endpoints without an MCP server.
 *
 * Usage:
 *   node scripts/catalog-search.mjs list [--family F] [--group G] [--kind K]
 *                                        [--method M] [--search TEXT] [--limit N]
 *   node scripts/catalog-search.mjs describe <endpoint-id>
 *   node scripts/catalog-search.mjs groups
 *   node scripts/catalog-search.mjs stats
 *
 * Examples:
 *   node scripts/catalog-search.mjs list --family data360-connect --group Segments
 *   node scripts/catalog-search.mjs list --search "data stream" --kind query
 *   node scripts/catalog-search.mjs describe content.search-content-in-workspace
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const CATALOG = join(here, '..', 'catalog', 'endpoints.json');

const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
const endpoints = catalog.endpoints;

/* -------------------------------------------------------------------------- */
/* Argument parsing                                                           */
/* -------------------------------------------------------------------------- */

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        out[key] = true;
      } else {
        out[key] = next;
        i++;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                 */
/* -------------------------------------------------------------------------- */

/** First meaningful line of an endpoint description, stripped of markdown. */
function summary(ep) {
  const raw = (ep.description || '').split('\n').map((l) => l.trim());
  const line = raw.find((l) => l && !l.startsWith('#') && !l.startsWith('`') && !l.startsWith('|'));
  if (!line) return '';
  const clean = line.replace(/[*_`]/g, '').trim();
  return clean.length > 110 ? `${clean.slice(0, 107)}...` : clean;
}

function paramLine(p) {
  const req = p.required ? 'required' : 'optional';
  const def = p.default && !/^\{\{.*\}\}$/.test(p.default) ? `, default: ${p.default}` : '';
  const desc = p.description ? ` — ${p.description.split('\n')[0]}` : '';
  return `  - ${p.name} (${p.type}, ${req}${def})${desc}`;
}

/* -------------------------------------------------------------------------- */
/* Commands                                                                   */
/* -------------------------------------------------------------------------- */

function cmdList(args) {
  let rows = endpoints;

  if (args.family) rows = rows.filter((e) => e.family === args.family);
  if (args.group) {
    const g = String(args.group).toLowerCase();
    rows = rows.filter((e) => e.group.toLowerCase().includes(g));
  }
  if (args.kind) rows = rows.filter((e) => e.kind === args.kind);
  if (args.method) rows = rows.filter((e) => e.method === String(args.method).toUpperCase());
  if (args.search) {
    const q = String(args.search).toLowerCase();
    rows = rows.filter((e) =>
      [e.id, e.name, e.path, e.group, e.subGroup, e.action, e.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }

  const limit = args.limit ? Number(args.limit) : 60;
  const shown = rows.slice(0, limit);

  console.log(`${rows.length} endpoint(s) matched${rows.length > shown.length ? `, showing ${shown.length}` : ''}.\n`);
  for (const e of shown) {
    console.log(`${e.id}`);
    console.log(`  ${e.method} ${e.path}   [${e.family} / ${e.group} / ${e.kind}]`);
    const s = summary(e);
    if (s) console.log(`  ${s}`);
    console.log('');
  }
  if (rows.length > shown.length) {
    console.log(`... ${rows.length - shown.length} more. Narrow with --group, --kind, or --search.`);
  }
}

function cmdDescribe(args) {
  const id = args._[1];
  if (!id) {
    console.error('Usage: catalog-search.mjs describe <endpoint-id>');
    process.exit(1);
  }
  const ep = endpoints.find((e) => e.id === id);
  if (!ep) {
    console.error(`No endpoint with id "${id}".`);
    const near = endpoints.filter((e) => e.id.includes(id)).slice(0, 8);
    if (near.length) {
      console.error('\nDid you mean:');
      for (const n of near) console.error(`  ${n.id}`);
    }
    process.exit(1);
  }

  console.log(`# ${ep.name}`);
  console.log('');
  console.log(`id:       ${ep.id}`);
  console.log(`family:   ${ep.family} (${ep.familyLabel})`);
  console.log(`group:    ${ep.group}${ep.subGroup ? ` / ${ep.subGroup}` : ''}`);
  console.log(`kind:     ${ep.kind}`);
  console.log(`base:     ${ep.base}`);
  console.log(`request:  ${ep.method} ${ep.path}`);
  console.log(`destructive: ${ep.destructive ? 'YES — requires confirmation' : 'no'}`);
  console.log('');

  if (ep.pathParams?.length) {
    console.log('Path parameters:');
    for (const p of ep.pathParams) console.log(paramLine(p));
    console.log('');
  }
  if (ep.queryParams?.length) {
    console.log('Query parameters:');
    for (const p of ep.queryParams) console.log(paramLine(p));
    console.log('');
  }
  if (ep.headers?.length) {
    console.log('Headers:');
    for (const h of ep.headers) console.log(`  - ${h.name}: ${h.value ?? ''}`);
    console.log('');
  }
  if (ep.bodyMode) {
    console.log(`Body (${ep.bodyMode}${ep.bodyContentType ? `, ${ep.bodyContentType}` : ''}):`);
    if (ep.bodySample) console.log(ep.bodySample);
    console.log('');
  }
  if (ep.formFields?.length) {
    console.log('Form fields:');
    for (const f of ep.formFields) console.log(`  - ${f.name} (${f.type})`);
    console.log('');
  }
  if (ep.description) {
    console.log('---');
    console.log('');
    console.log(ep.description);
  }
}

function cmdGroups() {
  const byFamily = new Map();
  for (const e of endpoints) {
    if (!byFamily.has(e.family)) byFamily.set(e.family, new Map());
    const g = byFamily.get(e.family);
    g.set(e.group, (g.get(e.group) ?? 0) + 1);
  }
  for (const [family, groups] of byFamily) {
    console.log(`\n${family} (${[...groups.values()].reduce((a, b) => a + b, 0)} endpoints)`);
    for (const [g, n] of [...groups].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(n).padStart(4)}  ${g}`);
    }
  }
}

function cmdStats() {
  console.log(JSON.stringify({ api: catalog.api, stats: catalog.stats }, null, 2));
}

/**
 * Emit a condensed markdown index of every endpoint, grouped by family then
 * resource group. This is the human/agent-readable companion to the 1 MB
 * endpoints.json, and is what the skills reference for discovery.
 */
function cmdIndex() {
  const lines = [];
  lines.push('# Endpoint Index');
  lines.push('');
  lines.push(
    `Generated from \`catalog/endpoints.json\` — ${catalog.stats.endpointCount} endpoints across ` +
      `${catalog.stats.familyCount} API families and ${catalog.stats.groupCount} resource groups.`
  );
  lines.push('');
  lines.push('Regenerate with `node scripts/catalog-search.mjs index > catalog/ENDPOINT-INDEX.md`.');
  lines.push('');
  lines.push('| Family | Endpoints | Base | Auth scope |');
  lines.push('| --- | --- | --- | --- |');
  for (const f of catalog.api.families) {
    lines.push(
      `| \`${f.key}\` | ${f.endpointCount} | \`${f.key}\` | \`${f.auth?.scope ?? '—'}\` |`
    );
  }
  lines.push('');
  lines.push('## Contents');
  lines.push('');
  for (const f of catalog.api.families) {
    const groups = [...new Set(endpoints.filter((e) => e.family === f.key).map((e) => e.group))];
    lines.push(`- **${f.label}** (\`${f.key}\`) — ${groups.length} groups`);
    for (const g of groups) {
      const anchor = `${f.key}-${g}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      lines.push(`  - [${g}](#${anchor})`);
    }
  }
  lines.push('');

  for (const f of catalog.api.families) {
    lines.push(`## ${f.label} (\`${f.key}\`)`);
    lines.push('');
    lines.push(`Base: \`${f.key}\` · Auth scope: \`${f.auth?.scope ?? '—'}\``);
    lines.push('');
    const groups = [...new Set(endpoints.filter((e) => e.family === f.key).map((e) => e.group))];
    for (const g of groups) {
      const rows = endpoints.filter((e) => e.family === f.key && e.group === g);
      lines.push(`### ${g}`);
      lines.push('');
      lines.push('| Endpoint id | Method | Path | Kind |');
      lines.push('| --- | --- | --- | --- |');
      for (const e of rows) {
        const d = e.destructive ? ' ⚠️' : '';
        lines.push(`| \`${e.id}\`${d} | ${e.method} | \`${e.path}\` | ${e.kind} |`);
      }
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('');
  lines.push('⚠️ = destructive operation. Confirm with the user before invoking.');
  lines.push('');
  console.log(lines.join('\n'));
}

/* -------------------------------------------------------------------------- */
/* Entry                                                                      */
/* -------------------------------------------------------------------------- */

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0] ?? 'stats';

switch (cmd) {
  case 'list':
    cmdList(args);
    break;
  case 'describe':
    cmdDescribe(args);
    break;
  case 'groups':
    cmdGroups();
    break;
  case 'stats':
    cmdStats();
    break;
  case 'index':
    cmdIndex();
    break;
  default:
    console.error(`Unknown command "${cmd}". Use: list | describe | groups | stats | index`);
    process.exit(1);
}
