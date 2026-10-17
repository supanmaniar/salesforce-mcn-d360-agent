#!/usr/bin/env node
/**
 * validate.mjs — repository integrity checks.
 *
 * Runs in CI and locally. Verifies the things that silently break an agent:
 * skill frontmatter, relative links, catalog shape, and accidental secrets.
 *
 * Usage:
 *   node scripts/validate.mjs
 *   node scripts/validate.mjs --quiet
 *
 * Exit code 0 when everything passes, 1 otherwise.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve, normalize } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..');
const QUIET = process.argv.includes('--quiet');

const failures = [];
const warnings = [];

function fail(check, message) {
  failures.push({ check, message });
}
function warn(check, message) {
  warnings.push({ check, message });
}
function pass(message) {
  if (!QUIET) console.log(`  ok  ${message}`);
}

/** Walk the repo, skipping .git and node_modules. */
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === '.git' || entry === 'node_modules') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(ROOT);
const rel = (f) => relative(ROOT, f);

/* -------------------------------------------------------------------------- */
/* 1. Skill frontmatter                                                       */
/* -------------------------------------------------------------------------- */

function checkSkills() {
  const skillFiles = files.filter((f) => /\.github[/\\]skills[/\\][^/\\]+[/\\]SKILL\.md$/.test(f));
  if (skillFiles.length === 0) fail('skills', 'no SKILL.md files found');

  for (const file of skillFiles) {
    const folder = file.split(/[/\\]/).slice(-2)[0];
    const src = readFileSync(file, 'utf8');
    const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    if (!m) {
      fail('skills', `${rel(file)}: missing YAML frontmatter`);
      continue;
    }
    const fm = m[1];
    const name = fm.match(/^name:\s*(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, '');
    const desc = fm.match(/^description:\s*(.+)$/m)?.[1]?.trim();

    if (!name) fail('skills', `${rel(file)}: missing "name"`);
    else if (name !== folder) {
      fail('skills', `${rel(file)}: name "${name}" does not match folder "${folder}"`);
    }

    if (!desc) fail('skills', `${rel(file)}: missing "description"`);
    else if (desc.length < 40) {
      warn('skills', `${rel(file)}: description is short (${desc.length} chars) — weak discovery`);
    }

    // A skill must have a body beyond the frontmatter.
    const body = src.slice(m[0].length).trim();
    if (body.length < 100) fail('skills', `${rel(file)}: body is empty or trivial`);
  }
  pass(`${skillFiles.length} skill(s) validated`);
}

/* -------------------------------------------------------------------------- */
/* 2. Agent frontmatter                                                       */
/* -------------------------------------------------------------------------- */

function checkAgents() {
  const agentFiles = files.filter((f) => /\.github[/\\]agents[/\\].+\.agent\.md$/.test(f));
  if (agentFiles.length === 0) fail('agents', 'no .agent.md files found');

  for (const file of agentFiles) {
    const src = readFileSync(file, 'utf8');
    const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    if (!m) {
      fail('agents', `${rel(file)}: missing YAML frontmatter`);
      continue;
    }
    if (!/^description:\s*\S/m.test(m[1])) {
      fail('agents', `${rel(file)}: missing "description" (required for agent picker)`);
    }
    const body = src.slice(m[0].length).trim();
    if (body.length < 200) fail('agents', `${rel(file)}: body is empty or trivial`);
  }
  pass(`${agentFiles.length} agent(s) validated`);
}

/* -------------------------------------------------------------------------- */
/* 3. Relative links resolve                                                  */
/* -------------------------------------------------------------------------- */

function checkLinks() {
  const mdFiles = files.filter((f) => f.endsWith('.md'));
  let checked = 0;

  for (const file of mdFiles) {
    const base = dirname(file);
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = m[1].trim();
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      const pathPart = target.split('#')[0];
      if (!pathPart) continue;
      checked++;
      const resolved = normalize(join(base, decodeURIComponent(pathPart)));
      if (!existsSync(resolved)) {
        fail('links', `${rel(file)}: broken link -> ${target}`);
      }
    }
  }
  pass(`${checked} relative link(s) resolve`);
}

/* -------------------------------------------------------------------------- */
/* 4. Catalog integrity                                                       */
/* -------------------------------------------------------------------------- */

function checkCatalog() {
  const catalogPath = join(ROOT, 'catalog', 'endpoints.json');
  if (!existsSync(catalogPath)) {
    fail('catalog', 'catalog/endpoints.json is missing');
    return;
  }

  let catalog;
  try {
    catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  } catch (err) {
    fail('catalog', `catalog/endpoints.json is not valid JSON: ${err.message}`);
    return;
  }

  for (const key of ['api', 'stats', 'groups', 'endpoints']) {
    if (!(key in catalog)) fail('catalog', `catalog is missing top-level key "${key}"`);
  }
  if (!Array.isArray(catalog.endpoints)) {
    fail('catalog', 'catalog.endpoints is not an array');
    return;
  }

  const ids = new Set();
  for (const ep of catalog.endpoints) {
    for (const key of ['id', 'family', 'method', 'path', 'kind']) {
      if (!ep[key]) fail('catalog', `endpoint "${ep.id ?? '<no id>'}" is missing "${key}"`);
    }
    if (ids.has(ep.id)) fail('catalog', `duplicate endpoint id "${ep.id}"`);
    ids.add(ep.id);
  }

  if (catalog.stats.endpointCount !== catalog.endpoints.length) {
    fail(
      'catalog',
      `stats.endpointCount (${catalog.stats.endpointCount}) != endpoints.length (${catalog.endpoints.length})`
    );
  }

  const families = new Set(catalog.endpoints.map((e) => e.family));
  for (const f of catalog.api.families ?? []) {
    if (!families.has(f.key)) warn('catalog', `family "${f.key}" has no endpoints`);
  }

  // The markdown index must exist and mention every family.
  const indexPath = join(ROOT, 'catalog', 'ENDPOINT-INDEX.md');
  if (!existsSync(indexPath)) {
    fail('catalog', 'catalog/ENDPOINT-INDEX.md is missing — run: node scripts/catalog-search.mjs index > catalog/ENDPOINT-INDEX.md');
  } else {
    const index = readFileSync(indexPath, 'utf8');
    for (const f of catalog.api.families ?? []) {
      if (!index.includes(f.key)) fail('catalog', `ENDPOINT-INDEX.md does not mention family "${f.key}"`);
    }
  }

  pass(`catalog: ${catalog.endpoints.length} endpoints, ${ids.size} unique ids`);
}

/* -------------------------------------------------------------------------- */
/* 5. No secrets                                                              */
/* -------------------------------------------------------------------------- */

const SECRET_PATTERNS = [
  { name: 'Salesforce access token', re: /\b00D[A-Za-z0-9]{12}![A-Za-z0-9._-]{20,}/ },
  { name: 'GitHub token', re: /\bgh[pousr]_[A-Za-z0-9]{20,}/ },
  { name: 'AWS access key', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Private key block', re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  {
    name: 'Hardcoded client secret',
    // Only a literal counts. Values that are shell variable references
    // (`${SF_CLIENT_SECRET:-}`), env lookups, or placeholders are not secrets.
    re: /client_?secret\s*[:=]\s*['"](?!\$|%|\{\{)[^'"\s]{12,}['"]/i,
  },
];

function checkSecrets() {
  const scannable = files.filter(
    (f) => !f.endsWith('endpoints.json') && !f.endsWith('package-lock.json')
  );
  let hits = 0;
  for (const file of scannable) {
    let src;
    try {
      src = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const { name, re } of SECRET_PATTERNS) {
      if (re.test(src)) {
        fail('secrets', `${rel(file)}: possible ${name}`);
        hits++;
      }
    }
  }
  if (hits === 0) pass('no secrets detected');
}

/* -------------------------------------------------------------------------- */
/* 6. Scripts are executable                                                  */
/* -------------------------------------------------------------------------- */

function checkScriptModes() {
  for (const name of ['sf-api.sh', 'sf-tenant-token.sh', 'diagnose.sh', 'catalog-search.mjs', 'check-query-params.mjs', 'validate.mjs']) {
    const p = join(ROOT, 'scripts', name);
    if (!existsSync(p)) {
      fail('scripts', `scripts/${name} is missing`);
      continue;
    }
    const mode = statSync(p).mode & 0o111;
    if (!mode) warn('scripts', `scripts/${name} is not executable (chmod +x)`);
  }
  pass('scripts present');
}

/* -------------------------------------------------------------------------- */
/* 7. Skill group tables match the catalog                                    */
/* -------------------------------------------------------------------------- */

/**
 * The resource-group table in the data360-connect-api skill is hand-maintained
 * while the catalog is generated from Salesforce's Postman collections, so the
 * two drift apart every time the catalog is regenerated. That is how the table
 * came to disagree with the catalog in 18 of 23 rows.
 *
 * This check compares every "Group | count" pair in the skill against the
 * catalog and fails on any mismatch, so drift is caught at commit time instead
 * of being rediscovered months later.
 */
function checkGroupTable() {
  const skillPath = join(ROOT, '.github', 'skills', 'data360-connect-api', 'SKILL.md');
  if (!existsSync(skillPath)) return;

  let catalog;
  try {
    catalog = JSON.parse(readFileSync(join(ROOT, 'catalog', 'endpoints.json'), 'utf8'));
  } catch {
    return;
  }

  const actual = new Map();
  for (const e of catalog.endpoints) {
    if (e.family !== 'data360-connect') continue;
    actual.set(e.group, (actual.get(e.group) ?? 0) + 1);
  }
  if (actual.size === 0) return;

  const src = readFileSync(skillPath, 'utf8');
  const section = src.split(/^## /m).find((s) => s.startsWith('Resource Groups'));
  if (!section) return;

  const claimed = new Map();
  for (const line of section.split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.split('|').map((c) => c.trim());
    // Two "Group | count" pairs per row: cells[1..2] and cells[4..5].
    for (const [nameIdx, countIdx] of [[1, 2], [4, 5]]) {
      const name = cells[nameIdx];
      const count = cells[countIdx];
      if (!name || !/^\d+$/.test(count ?? '')) continue;
      if (/^-+$/.test(name) || name === 'Group') continue;
      claimed.set(name, Number(count));
    }
  }

  if (claimed.size === 0) return;

  const problems = [];
  for (const [group, claimedCount] of claimed) {
    const actualCount = actual.get(group);
    if (actualCount === undefined) {
      problems.push(`${group}: listed in skill but not in catalog`);
    } else if (actualCount !== claimedCount) {
      problems.push(`${group}: skill says ${claimedCount}, catalog has ${actualCount}`);
    }
  }
  for (const group of actual.keys()) {
    if (!claimed.has(group)) problems.push(`${group}: in catalog but missing from skill table`);
  }

  if (problems.length) {
    for (const p of problems) fail('group-table', `data360-connect-api: ${p}`);
    return;
  }
  pass(`group table matches catalog (${claimed.size} groups)`);
}

/* -------------------------------------------------------------------------- */
/* Run                                                                        */
/* -------------------------------------------------------------------------- */

if (!QUIET) console.log('Validating repository...\n');

checkSkills();
checkAgents();
checkLinks();
checkCatalog();
checkSecrets();
checkScriptModes();
checkGroupTable();

if (!QUIET) console.log('');

for (const w of warnings) console.log(`  warn  [${w.check}] ${w.message}`);
for (const f of failures) console.log(`  FAIL  [${f.check}] ${f.message}`);

if (failures.length) {
  console.log(`\n${failures.length} failure(s), ${warnings.length} warning(s).`);
  process.exit(1);
}
console.log(`All checks passed${warnings.length ? ` (${warnings.length} warning(s))` : ''}.`);
