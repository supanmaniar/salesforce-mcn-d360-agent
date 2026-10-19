#!/usr/bin/env node
/**
 * d360-snapshot.mjs — capture a Data 360 configuration snapshot to a single file.
 *
 * Replaces the manual "export and diff" loop: capture now, compare later. Built
 * on the same catalogued endpoints and paging rules as the skills, so it inherits
 * the traps already documented there (short pages, offset-from-1, HTML-escaped
 * JSON, graph-injected DMOs).
 *
 * Usage:
 *   node scripts/d360-snapshot.mjs --out snap-2026-10-19.json
 *   node scripts/d360-snapshot.mjs --redact --out shareable.json
 *   node scripts/d360-snapshot.mjs --modules model,segments --out partial.json
 *   node scripts/d360-snapshot.mjs --list-modules
 *
 * Exit codes: 0 ok, 1 usage/config error, 2 a module failed.
 */

import { execFile } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, basename } from 'node:path';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { redactAll } from './lib/redact.mjs';

const run = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..');
const SF_API = join(ROOT, 'scripts', 'sf-api.sh');

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d = '') => {
  const i = args.indexOf(n);
  return i > -1 ? (args[i + 1] ?? d) : d;
};

if (flag('--help') || flag('-h')) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].replace(/^\/\*\*?/, '').replace(/^ \* ?/gm, '').trim());
  process.exit(0);
}

const API_VERSION = opt('--api-version', process.env.SF_API_VERSION || '66.0');
const DATASPACE = opt('--dataspace', '');
const REDACT = flag('--redact');

/* -------------------------------------------------------------------------- */
/* Transport                                                                  */
/* -------------------------------------------------------------------------- */

async function api(path, query = '') {
  const a = ['--path', path, '--raw'];
  if (query) a.push('--query', query);
  try {
    const { stdout } = await run(SF_API, a, { maxBuffer: 64 * 1024 * 1024 });
    return JSON.parse(stdout);
  } catch (err) {
    const text = (err.stderr || err.stdout || '').toString().trim();
    let code = '';
    try {
      const p = JSON.parse(text.slice(text.indexOf('[')));
      code = p?.[0]?.errorCode ?? '';
    } catch { /* not JSON */ }
    const e = new Error(code || text.slice(0, 120) || 'request failed');
    e.errorCode = code;
    throw e;
  }
}

/** Follow a link-style list to exhaustion. Required for endpoints that return
 *  short pages mid-sequence — an offset loop truncates them silently. */
async function getAllByLink(path, collectionKey, query = '') {
  const items = [];
  const prefix = `/services/data/v${API_VERSION}`;
  let next = query ? `${path}?${query}` : path;
  const seen = new Set();
  for (let page = 0; page < 500; page++) {
    const [p, q = ''] = next.split('?');
    const body = await api(p, q);
    items.push(...(body[collectionKey] ?? []));
    const link = body.nextPageUrl;
    if (!link) return { items, complete: true };
    // nextPageUrl is an absolute API path; strip the version prefix so it can be
    // passed back to sf-api.sh. Do not use split(sep, 1) — it returns the part
    // BEFORE the separator, not the part after.
    const rel = link.startsWith(prefix) ? link.slice(prefix.length) : link;
    if (!rel.startsWith('/')) {
      return { items, complete: false, reason: `unexpected nextPageUrl: ${link.slice(0, 60)}` };
    }
    if (seen.has(rel)) return { items, complete: false, reason: 'nextPageUrl repeated' };
    seen.add(rel);
    next = rel;
  }
  return { items, complete: false, reason: 'page cap reached' };
}

/** Walk offset pages and stop on a short page. Only valid where pages pad
 *  consistently — the endpoints below are verified to do so. */
async function getAllByOffset(path, key, { batch = 100, param = 'batchSize' } = {}) {
  const items = [];
  for (let off = 0, page = 0; page < 500; page++, off += batch) {
    const body = await api(path, `${param}=${batch}&offset=${off}`);
    const chunk = body[key] ?? [];
    items.push(...chunk);
    if (chunk.length < batch) return { items, complete: true };
  }
  return { items, complete: false, reason: 'page cap reached' };
}

function ds(sep = '&') {
  return DATASPACE && DATASPACE !== 'default' ? `${sep}dataspace=${encodeURIComponent(DATASPACE)}` : '';
}

/* -------------------------------------------------------------------------- */
/* Modules                                                                    */
/* -------------------------------------------------------------------------- */

const MODULES = {
  model: {
    title: 'Data model',
    async run() {
      // /ssot/metadata carries fields, keys and ACTIVE relationships in one call,
      // and returns only the DMOs the org actually uses. Relationships appear
      // twice (once from each end), so de-duplicate before reporting a count.
      const body = await api('/ssot/metadata', `entityType=DataModelObject${ds()}`);
      const dmos = body.metadata ?? [];
      const relKeys = new Set();
      for (const d of dmos) {
        for (const r of d.relationships ?? []) {
          const a = `${r.fromEntity}|${r.fromEntityAttribute}`;
          const b = `${r.toEntity}|${r.toEntityAttribute}`;
          relKeys.add([a, b].sort().join('~'));
        }
      }
      const byCategory = {};
      for (const d of dmos) byCategory[d.category ?? 'unknown'] = (byCategory[d.category ?? 'unknown'] ?? 0) + 1;
      return {
        data: { objects: dmos, objectCount: dmos.length, byCategory },
        summary: `${dmos.length} objects in use, ${relKeys.size} unique relationships`,
      };
    },
  },

  streams: {
    title: 'Data streams',
    async run() {
      const { items, complete, reason } = await getAllByLink('/ssot/data-streams', 'dataStreams', 'limit=20');
      const out = [];
      for (const s of items) {
        // The list carries no mappings (the array is always empty) and sourceFields
        // names no target DMO, so record only what is actually present.
        out.push({
          name: s.name,
          label: s.label,
          status: s.status,
          dataStreamType: s.dataStreamType,
          connector: s.connectorInfo?.connectorDetails ?? null,
          dataLakeObject: s.dataLakeObjectInfo?.name ?? null,
          sourceFieldCount: (s.sourceFields ?? []).length,
          refreshConfig: s.refreshConfig ?? null,
        });
      }
      return {
        data: { streams: out, streamCount: out.length },
        summary: `${out.length} streams${complete ? '' : ` (INCOMPLETE: ${reason})`}`,
        incomplete: !complete,
      };
    },
  },

  segments: {
    title: 'Segments',
    async run() {
      const { items, complete, reason } = await getAllByOffset('/ssot/segments', 'segments', { batch: 100 });
      const out = items.map((s) => ({
        apiName: s.apiName,
        displayName: s.displayName,
        dataSpace: s.dataSpace,
        segmentType: s.segmentType,
        publishStatus: s.publishStatus,
        lookbackPeriod: s.lookbackPeriod ?? null,
        // includeCriteria is JSON wrapped in HTML entities; some segments return it empty.
        includeCriteria: s.includeCriteria ?? '',
        criteriaAvailable: Boolean(s.includeCriteria),
      }));
      const missing = out.filter((s) => !s.criteriaAvailable).length;
      return {
        data: { segments: out, segmentCount: out.length },
        summary: `${out.length} segments${missing ? `, ${missing} without retrievable criteria` : ''}${complete ? '' : ` (INCOMPLETE: ${reason})`}`,
        incomplete: !complete,
      };
    },
  },

  identity: {
    title: 'Identity resolution',
    async run() {
      const { items, complete, reason } = await getAllByOffset('/ssot/identity-resolutions', 'identityResolutions', { batch: 50 });
      return {
        data: { identityResolutions: items, count: items.length },
        summary: `${items.length} rulesets${complete ? '' : ` (INCOMPLETE: ${reason})`}`,
        incomplete: !complete,
      };
    },
  },

  graphs: {
    title: 'Data graphs',
    async run() {
      const body = await api('/ssot/data-graphs/metadata');
      const graphs = body.dataGraphMetadata ?? [];
      // A graph injects system DMOs filed under ordinary categories, so record
      // their names — a category filter does not catch them.
      const injectedDmos = [];
      const walk = (n) => {
        for (const k of ['memberDmoName', 'fragmentDMOName']) if (n?.[k]) injectedDmos.push(n[k]);
        for (const c of n?.relatedObjects ?? []) walk(c);
      };
      for (const g of graphs) {
        walk(g.dgObject);
        for (const k of ['idDmoName', 'valuesDmoName']) if (g[k]) injectedDmos.push(g[k]);
      }
      return {
        data: {
          graphs: graphs.map((g) => ({
            developerName: g.developerName,
            status: g.status,
            primaryObjectName: g.primaryObjectName,
            primaryObjectType: g.primaryObjectType,
            dataspaceName: g.dataspaceName,
            injectedDmos: [g.idDmoName, g.valuesDmoName].filter(Boolean),
          })),
          graphCount: graphs.length,
          injectedDmos: [...new Set(injectedDmos)].sort(),
        },
        summary: `${graphs.length} graphs, ${new Set(injectedDmos).size} injected DMOs`,
      };
    },
  },

  dlos: {
    title: 'Data lake objects',
    async run() {
      const { items, complete, reason } = await getAllByLink('/ssot/data-lake-objects', 'dataLakeObjects', 'limit=20');
      const out = items.map((o) => ({
        name: o.name,
        label: o.label,
        category: o.category,
        fieldCount: (o.dataLakeFieldInfoRepresentation ?? []).length,
      }));
      return {
        data: { dataLakeObjects: out, count: out.length },
        // totalSize overcounts here (rows from other data spaces are filtered after
        // paging), so the collected count is the reliable figure.
        summary: `${out.length} DLOs${complete ? '' : ` (INCOMPLETE: ${reason})`}`,
        incomplete: !complete,
      };
    },
  },

  spaces: {
    title: 'Data spaces',
    async run() {
      const body = await api('/ssot/data-spaces', 'limit=200');
      const list = body.dataSpaces ?? [];
      return {
        data: { dataSpaces: list.map((s) => ({ name: s.name, label: s.label })), count: list.length },
        summary: `${list.length} data spaces`,
      };
    },
  },
};

/* -------------------------------------------------------------------------- */
/* Run                                                                        */
/* -------------------------------------------------------------------------- */

if (flag('--list-modules')) {
  for (const [k, v] of Object.entries(MODULES)) console.log(`  ${k.padEnd(10)} ${v.title}`);
  process.exit(0);
}

const outPath = opt('--out');
if (!outPath) {
  console.error('d360-snapshot: --out <file> is required (or --list-modules)');
  process.exit(1);
}

const requested = opt('--modules') ? opt('--modules').split(',').map((s) => s.trim()).filter(Boolean) : Object.keys(MODULES);
const unknown = requested.filter((m) => !MODULES[m]);
if (unknown.length) {
  console.error(`d360-snapshot: unknown module(s): ${unknown.join(', ')}`);
  console.error(`d360-snapshot: available: ${Object.keys(MODULES).join(', ')}`);
  process.exit(1);
}

const org = process.env.SF_TARGET_ORG ?? '(default)';
console.log(`Capturing Data 360 snapshot — org ${org}, API v${API_VERSION}`);
console.log('');

const snapshot = {
  formatVersion: 1,
  capturedAt: new Date().toISOString(),
  apiVersion: API_VERSION,
  org,
  dataSpace: DATASPACE || 'default',
  redacted: REDACT,
  modules: {},
  warnings: [],
};

let failed = 0;
let redactedCount = 0;

for (const name of requested) {
  const mod = MODULES[name];
  process.stdout.write(`  ${name.padEnd(10)} `);
  try {
    const t0 = Date.now();
    const { data, summary, incomplete } = await mod.run();
    snapshot.modules[name] = { title: mod.title, data };
    const flagNote = incomplete ? '  [incomplete]' : '';
    console.log(`${summary}  (${((Date.now() - t0) / 1000).toFixed(1)}s)${flagNote}`);
    if (incomplete) snapshot.warnings.push(`${name}: ${summary}`);
  } catch (err) {
    failed++;
    console.log(`FAILED: ${err.errorCode || err.message}`);
    snapshot.warnings.push(`${name}: ${err.errorCode || err.message}`);
    snapshot.modules[name] = { title: mod.title, error: err.errorCode || err.message };
  }
}

if (REDACT) {
  // Single pass over the assembled snapshot, so the count is real and every
  // nested criteria blob is reached.
  redactedCount = redactAll(snapshot);
}

snapshot.contentHash = createHash('sha256')
  .update(JSON.stringify(Object.fromEntries(Object.entries(snapshot.modules).map(([k, v]) => [k, v.data ?? v]))))
  .digest('hex')
  .slice(0, 16);

writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + '\n');

console.log('');
console.log(`Wrote ${outPath}`);
console.log(`  hash ${snapshot.contentHash}${REDACT ? '   redacted' : ''}`);
if (REDACT) console.log(`  ${redactedCount} literal value(s) hidden`);
if (snapshot.warnings.length) {
  console.log(`  ${snapshot.warnings.length} warning(s):`);
  for (const w of snapshot.warnings) console.log(`    - ${w}`);
}
console.log('');
console.log(`Compare with:  node scripts/d360-diff.mjs <old> ${basename(outPath)}`);

process.exit(failed ? 2 : 0);
