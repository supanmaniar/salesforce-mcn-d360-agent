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
  for (const name of ['sf-api.sh', 'sf-tenant-token.sh', 'diagnose.sh', 'catalog-search.mjs', 'check-query-params.mjs', 'record-describe.mjs', 'validate.mjs']) {
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
/* 8. Writability claims match the recorded describe results                   */
/* -------------------------------------------------------------------------- */

/**
 * Several skills make claims about whether objects accept DML. Those claims were
 * wrong more than once, each time in the direction of over-generalising from a
 * single object. This checks each claim against recorded describe output, so a
 * claim that contradicts the platform fails CI.
 *
 * Checks are deliberately narrow: they key off a specific object name appearing
 * near a specific claim, so prose can change freely without false positives.
 */
function checkWritabilityClaims() {
  let fixtures;
  try {
    fixtures = JSON.parse(readFileSync(join(ROOT, 'catalog', 'describe-fixtures.json'), 'utf8'));
  } catch {
    fail('writability', 'catalog/describe-fixtures.json is missing or unreadable');
    return;
  }

  const obj = fixtures.objects ?? {};
  const skillsDir = join(ROOT, '.github', 'skills');
  if (!existsSync(skillsDir)) return;

  const skillFiles = [];
  for (const entry of readdirSync(skillsDir)) {
    const p = join(skillsDir, entry, 'SKILL.md');
    if (existsSync(p)) skillFiles.push(p);
  }

  const problems = [];
  const checked = [];

  const isReadOnly = (o) => obj[o] && !obj[o].createable && !obj[o].updateable && !obj[o].deletable;
  const isWritable = (o) => obj[o] && obj[o].createable && obj[o].updateable && obj[o].deletable;

  // Build the name alternation from the fixture rather than from suffix patterns.
  // Keying off `__dlm`/`__dll`/`ManagedContent` missed a claim about DataStream,
  // which is exactly the kind of over-generalisation this check exists to catch.
  const names = Object.keys(obj).sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (names.length === 0) return;

  // (a) An object named as read-only must actually be read-only in the fixture.
  const READONLY_CLAIM = new RegExp(
    `(\`?(?:${names.join('|')})\`?)[^.\\n]{0,90}?(?:is |are )?(?:read-only|rejects? (?:all )?DML|reject (?:all )?DML|createable=false|c=u=d=False)`,
    'gi'
  );

  // (b) An object named as writable must actually be writable.
  const WRITABLE_CLAIM = new RegExp(
    `(?:${names.join('|')})[^.\\n]{0,120}?createable\\/updateable\\/deletable\\s*=\\s*true`,
    'gi'
  );
  const WRITABLE_EXPLICIT = new RegExp(
    `(\`?(?:${names.join('|')})\`?)\\s*(?:is|are)\\s*(?:createable\\/updateable\\/deletable\\s*=\\s*true|c=u=d=True)`,
    'gi'
  );

  for (const file of skillFiles) {
    const src = readFileSync(file, 'utf8');
    const rel = relative(ROOT, file);

    for (const m of src.matchAll(READONLY_CLAIM)) {
      const name = m[1].replace(/`/g, '');
      if (!obj[name]) continue;               // not in the fixture; nothing to verify
      checked.push(`${rel}: ${name} claimed read-only`);
      if (!isReadOnly(name)) {
        problems.push(
          `${rel}: claims ${name} is read-only, but describe reports ` +
            `createable=${obj[name].createable} updateable=${obj[name].updateable} deletable=${obj[name].deletable}`
        );
      }
    }

    // The writable claim names several objects in a list; check each one found.
    for (const re of [WRITABLE_CLAIM, WRITABLE_EXPLICIT]) {
      for (const m of src.matchAll(re)) {
        const chunk = m[0];
        for (const nm of Object.keys(obj)) {
          if (!chunk.includes(nm)) continue;
          checked.push(`${rel}: ${nm} claimed writable`);
          if (!isWritable(nm)) {
            problems.push(
              `${rel}: claims ${nm} is writable, but describe reports ` +
                `createable=${obj[nm].createable} updateable=${obj[nm].updateable} deletable=${obj[nm].deletable}`
            );
          }
        }
      }
    }
  }

  if (problems.length) {
    for (const p of problems) fail('writability', p);
    return;
  }
  pass(`writability claims consistent with fixtures (${checked.length} claim(s))`);
}

/* -------------------------------------------------------------------------- */
/* 9. No truncating paging loops in skill code examples                        */
/* -------------------------------------------------------------------------- */

/**
 * `/ssot/data-lake-objects` returns short pages mid-sequence, so a loop that
 * stops when a page is shorter than the requested size silently truncates. That
 * pattern was documented in this repo and returned 18 of 80 objects while
 * reporting success.
 *
 * This catches the shape: a shell loop that pages one of the endpoints which
 * must be walked by `nextPageUrl`, without referencing `nextPageUrl`.
 */
const NEXT_PAGE_ONLY = [
  { path: '/ssot/data-lake-objects', key: 'dataLakeObjects' },
  { path: '/ssot/data-streams', key: 'dataStreams' },
];

function checkPagingLoops() {
  const skillsDir = join(ROOT, '.github', 'skills');
  if (!existsSync(skillsDir)) return;

  const problems = [];
  let inspected = 0;

  for (const entry of readdirSync(skillsDir)) {
    const file = join(skillsDir, entry, 'SKILL.md');
    if (!existsSync(file)) continue;
    const rel = relative(ROOT, file);
    const lines = readFileSync(file, 'utf8').split('\n');

    // Look for fenced bash blocks that contain a while loop over a path.
    let inFence = false;
    let buffer = [];
    let startLine = 0;

    const flush = (endLine) => {
      if (buffer.length === 0) return;
      const body = buffer.join('\n');
      const isLoop = /while\s/.test(body) || /until\s/.test(body);
      if (!isLoop) return;
      inspected++;
      for (const { path } of NEXT_PAGE_ONLY) {
        if (!body.includes(path)) continue;
        // A loop over this endpoint must use nextPageUrl, or explain why not.
        if (body.includes('nextPageUrl')) continue;
        if (/offset/i.test(body) && !/nextPageUrl/.test(body)) {
          problems.push(
            `${rel}:${startLine}-${endLine}: loops over ${path} using offset without nextPageUrl. ` +
              `That endpoint returns short pages mid-sequence, so the loop truncates silently. ` +
              `Walk nextPageUrl instead.`
          );
        }
      }
    };

    lines.forEach((line, i) => {
      if (/^\s*```/.test(line)) {
        if (inFence) {
          flush(i);
          buffer = [];
        } else {
          startLine = i + 2;
        }
        inFence = !inFence;
        return;
      }
      if (inFence) buffer.push(line);
    });
  }

  // Prose can teach the same truncating rule without a code block. The original
  // instance of this bug was a prose line, not a loop, so the code scan above
  // would have missed it — catch the claim as well as the code.
  const NEXT_PAGE_KEYWORDS = ['nextPageUrl', 'nextPageURL', 'next page url'];
  // Wording that teaches truncation (bad) versus wording that warns about it (good).
  const TEACHES_TRUNCATION = /(?:page\s+until|stop\s+(?:on|when)|until)[^.]{0,60}short page/i;
  const WARNS_ABOUT_IT = /(?:not|n't|never)\s+mean|truncat|silently|mislead/i;

  for (const entry of readdirSync(skillsDir)) {
    const file = join(skillsDir, entry, 'SKILL.md');
    if (!existsSync(file)) continue;
    const rel = relative(ROOT, file);
    const text = readFileSync(file, 'utf8');
    text.split('\n').forEach((line, i) => {
      const endpoint = NEXT_PAGE_ONLY.find(({ path }) => line.includes(path));
      if (!endpoint) return;
      const nearby = text.split('\n').slice(Math.max(0, i - 1), i + 3).join(' ');
      if (NEXT_PAGE_KEYWORDS.some((k) => nearby.includes(k))) return;
      if (!TEACHES_TRUNCATION.test(nearby)) return;
      // A sentence that warns about the trap is the fix, not the bug.
      if (WARNS_ABOUT_IT.test(nearby)) return;
      problems.push(
        `${rel}:${i + 1}: teaches "stop on a short page" for ${endpoint.path} without mentioning ` +
          `the pagination link. That endpoint returns short pages mid-sequence, so the rule truncates silently.`
      );
    });
  }

  if (problems.length) {
    for (const p of problems) fail('paging', p);
    return;
  }
  pass(`no truncating paging guidance found (${inspected} loop(s) inspected)`);
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
checkWritabilityClaims();
checkPagingLoops();

if (!QUIET) console.log('');

for (const w of warnings) console.log(`  warn  [${w.check}] ${w.message}`);
for (const f of failures) console.log(`  FAIL  [${f.check}] ${f.message}`);

if (failures.length) {
  console.log(`\n${failures.length} failure(s), ${warnings.length} warning(s).`);
  process.exit(1);
}
console.log(`All checks passed${warnings.length ? ` (${warnings.length} warning(s))` : ''}.`);
