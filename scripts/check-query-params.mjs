#!/usr/bin/env node
/**
 * check-query-params.mjs — warn when a query parameter is not one the endpoint
 * declares.
 *
 * Silent parameter rejection is a real failure mode: the Data 360 APIs ignore
 * unknown query parameters and fall back to their own defaults. Passing
 * `batchSize=200` to an endpoint whose parameter is `limit` returns 50 records
 * with no error, which reads as "there are only 50".
 *
 * `sf-api.sh` calls this before every request. Unknown parameters produce a
 * warning on stderr; they never block the request, because a parameter that is
 * absent from the catalog is not proof that the API rejects it.
 *
 * Usage:
 *   node scripts/check-query-params.mjs --path /ssot/data-model-objects --query 'limit=500'
 *   node scripts/check-query-params.mjs --path /ssot/segments --query 'batchSize=2' --family data360-connect
 *
 * Exit code is always 0 unless invoked with --strict, which exits 1 on an
 * unrecognised parameter.
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..');
const CATALOG = join(ROOT, 'catalog', 'endpoints.json');

function parseArgs(argv) {
  const out = { _: [], flags: new Set() };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--strict') { out.flags.add('strict'); continue; }
    if (a.startsWith('--')) { out[a.slice(2)] = argv[++i]; continue; }
    out._.push(a);
  }
  return out;
}

/** Turn a catalog path template ("/api/v1/profile/:dmoApiName") into a regex. */
function templateToRegex(template) {
  const body = template
    .replace(/[.+*?^${}()|[\]\\]/g, '\\$&')
    .replace(/:[A-Za-z0-9_]+/g, '[^/]+');
  return new RegExp(`^${body}/?$`);
}

function paramNames(queryString) {
  if (!queryString) return [];
  return queryString
    .split('&')
    .map((part) => part.split('=')[0].trim())
    .filter(Boolean);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const path = args.path;
  const query = args.query ?? '';
  const family = args.family;
  const strict = args.flags.has('strict');

  if (!path || !existsSync(CATALOG)) process.exit(0);

  const supplied = paramNames(query);
  if (supplied.length === 0) process.exit(0);

  let catalog;
  try {
    catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
  } catch {
    process.exit(0);
  }

  const normalised = `/${String(path).replace(/^\/+/, '')}`;
  const candidates = catalog.endpoints.filter(
    (e) => e.method === 'GET' && (!family || e.family === family)
  );

  // A path can appear more than once in the catalog (for example /api/v1/metadata
  // is listed three times with different parameter sets). Collect every matching
  // definition and union their parameters — taking the first would produce false
  // warnings for parameters the API genuinely accepts.
  const exact = candidates.filter(
    (e) => e.path.replace(/\/$/, '') === normalised.replace(/\/$/, '')
  );
  const matches = exact.length
    ? exact
    : candidates.filter((e) => templateToRegex(e.path).test(normalised));

  if (matches.length === 0) process.exit(0);

  const declared = new Set();
  for (const m of matches) {
    for (const p of m.queryParams ?? []) {
      if (p?.name) declared.add(p.name);
    }
  }
  const unknown = supplied.filter((p) => !declared.has(p));

  if (unknown.length === 0) process.exit(0);

  const label = matches.length === 1
    ? `${matches[0].method} ${matches[0].path}`
    : `${matches[0].method} ${normalised} (${matches.length} catalog entries)`;
  const valid = [...declared].sort();
  process.stderr.write(`sf-api: warning: unrecognised query parameter(s) for ${label}:\n`);
  for (const p of unknown) {
    process.stderr.write(`sf-api:          ${p}\n`);
  }
  if (valid.length) {
    process.stderr.write(`sf-api:          declared parameters: ${valid.join(', ')}\n`);
  } else {
    process.stderr.write('sf-api:          this endpoint declares no query parameters\n');
  }
  process.stderr.write(
    'sf-api:          Unrecognised parameters are usually ignored by the API, which\n' +
    'sf-api:          silently applies its own default. Verify before trusting a count.\n'
  );

  process.exit(strict ? 1 : 0);
}

main();
