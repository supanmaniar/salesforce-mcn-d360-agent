#!/usr/bin/env node
/**
 * d360-diff.mjs — compare two Data 360 snapshots and report configuration drift.
 *
 * Built for the CI use case a browser extension cannot serve: snapshot nightly,
 * diff, and fail the build when configuration changes unexpectedly.
 *
 * Usage:
 *   node scripts/d360-diff.mjs old.json new.json
 *   node scripts/d360-diff.mjs old.json new.json --fail-on-change
 *   node scripts/d360-diff.mjs old.json new.json --include-segments
 *
 * Exit codes: 0 no drift, 1 drift found (only with --fail-on-change), 2 bad input.
 */

import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const files = args.filter((a) => !a.startsWith('--'));

if (flag('--help') || flag('-h') || files.length < 2) {
  console.log(`Usage: node scripts/d360-diff.mjs <old.json> <new.json> [options]

Options:
  --fail-on-change    exit 1 when drift is found (for CI)
  --include-segments  also diff individual segments (noisy; off by default)
  --show-unchanged    list modules with no drift too

Compares module summaries by default, so the output is a configuration review
rather than a wall of JSON. Segment criteria are compared per-segment only with
--include-segments.`);
  process.exit(files.length < 2 ? 2 : 0);
}

let A, B;
try {
  A = JSON.parse(readFileSync(files[0], 'utf8'));
  B = JSON.parse(readFileSync(files[1], 'utf8'));
} catch (err) {
  console.error(`d360-diff: cannot read snapshot: ${err.message}`);
  process.exit(2);
}

for (const [label, s] of [['old', A], ['new', B]]) {
  if (s.formatVersion !== 1) {
    console.error(`d360-diff: ${label} is not a formatVersion 1 snapshot (got ${s.formatVersion}).`);
    process.exit(2);
  }
}

console.log(`${files[0]}  ->  ${files[1]}`);
console.log(`  ${A.capturedAt}   ->   ${B.capturedAt}`);

// Conditions that make the comparison itself unsound. These do not by themselves
// mean config changed, but a "no drift" verdict from such a pair would be a false
// green, so they are tracked and surfaced separately from drift.
const unsound = [];
if (A.org !== B.org) {
  console.log(`  WARNING: different orgs (${A.org} vs ${B.org})`);
  unsound.push('the two snapshots come from different orgs');
}
if ((A.dataSpace ?? 'default') !== (B.dataSpace ?? 'default')) {
  console.log(`  WARNING: different data spaces (${A.dataSpace} vs ${B.dataSpace})`);
  unsound.push('the two snapshots cover different data spaces');
}
if (A.redacted !== B.redacted) {
  console.log(`  WARNING: redaction differs (${A.redacted} vs ${B.redacted}) — a redacted side may show false drift`);
  unsound.push('one snapshot is redacted and the other is not');
}
console.log('');

let changed = 0;

/** Report added/removed/changed entries for a keyed list. */
function diffList(module, key, nameOf, compare) {
  const presentA = module in (A.modules ?? {});
  const presentB = module in (B.modules ?? {});
  // Not captured in either snapshot is not drift — stay silent.
  if (!presentA && !presentB) return null;

  const a = A.modules?.[module]?.data?.[key];
  const b = B.modules?.[module]?.data?.[key];

  // Captured on one side only: that is a real difference in coverage, so say so.
  if (!presentA || !presentB) {
    const which = presentA ? 'old' : 'new';
    unsound.push(`${module} was captured in the ${which} snapshot only`);
    return { added: [], removed: [], modified: [], countA: 0, countB: 0, onlyIn: which };
  }
  if (!Array.isArray(a) || !Array.isArray(b)) {
    const ea = A.modules?.[module]?.error;
    const eb = B.modules?.[module]?.error;
    unsound.push(`${module} could not be captured in both snapshots`);
    return { added: [], removed: [], modified: [], countA: 0, countB: 0, errored: [ea, eb].filter(Boolean) };
  }

  const keyOf = (x) => nameOf(x);
  const am = new Map(a.map((x) => [keyOf(x), x]));
  const bm = new Map(b.map((x) => [keyOf(x), x]));

  const added = [...bm.keys()].filter((k) => !am.has(k));
  const removed = [...am.keys()].filter((k) => !bm.has(k));
  const modified = [...am.keys()].filter((k) => bm.has(k) && compare(am.get(k), bm.get(k)));

  return { added, removed, modified, countA: a.length, countB: b.length };
}

function report(label, d) {
  if (!d) return 0;
  if (d.onlyIn) {
    console.log(`  ${label}`);
    console.log(`    ! captured in ${d.onlyIn} snapshot only — rerun with the same --modules to compare`);
    return 1;
  }
  if (d.errored) {
    console.log(`  ${label}`);
    for (const e of d.errored) console.log(`    ! capture failed: ${e}`);
    return 1;
  }
  const n = d.added.length + d.removed.length + d.modified.length;
  if (n === 0) {
    if (flag('--show-unchanged')) console.log(`  ${label.padEnd(22)} unchanged (${d.countA} entries)`);
    return 0;
  }
  console.log(`  ${label}`);
  if (d.countA !== d.countB) console.log(`    count ${d.countA} -> ${d.countB}`);
  for (const x of d.added) console.log(`    + added     ${x}`);
  for (const x of d.removed) console.log(`    - removed   ${x}`);
  for (const x of d.modified) console.log(`    ~ changed   ${x}`);
  return n;
}

const segCmp = (x, y) =>
  x.publishStatus !== y.publishStatus ||
  x.segmentType !== y.segmentType ||
  (flag('--include-segments') && x.includeCriteria !== y.includeCriteria);

console.log('Drift by module:');
changed += report('data model', diffList('model', 'objects', (o) => o.name,
  (x, y) => (x.fields ?? []).length !== (y.fields ?? []).length || x.category !== y.category));
changed += report('data streams', diffList('streams', 'streams', (s) => s.name,
  (x, y) => x.status !== y.status || x.dataStreamType !== y.dataStreamType ||
    x.dataLakeObject !== y.dataLakeObject || x.sourceFieldCount !== y.sourceFieldCount));
changed += report('segments', diffList('segments', 'segments', (s) => s.apiName, segCmp));
changed += report('data lake objects', diffList('dlos', 'dataLakeObjects', (o) => o.name,
  (x, y) => x.fieldCount !== y.fieldCount || x.category !== y.category));
changed += report('data graphs', diffList('graphs', 'graphs', (g) => g.developerName,
  (x, y) => x.status !== y.status || x.primaryObjectName !== y.primaryObjectName));
changed += report('identity resolution', diffList('identity', 'identityResolutions', (r) => r.name ?? r.id ?? JSON.stringify(r).slice(0, 24), () => false));
changed += report('data spaces', diffList('spaces', 'dataSpaces', (s) => s.name, () => false));

// Injected DMOs are a set, not a list, so compare directly.
const ai = (A.modules?.graphs?.data?.injectedDmos ?? []).slice().sort();
const bi = (B.modules?.graphs?.data?.injectedDmos ?? []).slice().sort();
if (ai.length || bi.length) {
  const added = bi.filter((x) => !ai.includes(x));
  const removed = ai.filter((x) => !bi.includes(x));
  if (added.length || removed.length) {
    console.log('  graph-injected DMOs');
    for (const x of added) console.log(`    + added     ${x}`);
    for (const x of removed) console.log(`    - removed   ${x}`);
    changed += added.length + removed.length;
  } else if (flag('--show-unchanged')) {
    console.log(`  graph-injected DMOs     unchanged (${ai.length})`);
  }
}

// Incomplete captures make a diff unreliable — say so rather than implying clean.
const warnA = A.warnings ?? [];
const warnB = B.warnings ?? [];
if (warnA.length || warnB.length) {
  console.log('');
  console.log('Warnings present — this diff may be incomplete:');
  for (const w of warnA) console.log(`    old: ${w}`);
  for (const w of warnB) console.log(`    new: ${w}`);
  unsound.push(`${warnA.length + warnB.length} capture warning(s)`);
}

console.log('');
const driftLine = changed === 0 ? 'No configuration drift detected.' : `${changed} change(s) detected.`;
console.log(driftLine);

if (unsound.length) {
  console.log('');
  console.log('This comparison is not conclusive:');
  for (const u of [...new Set(unsound)]) console.log(`    - ${u}`);
}

// --fail-on-change is a CI gate, and a gate that passes on an unsound comparison
// is a false green: the exact failure this repo keeps defending against. Exit 1
// when either config drifted or the comparison cannot be trusted.
if (flag('--fail-on-change')) process.exit(changed !== 0 || unsound.length ? 1 : 0);
process.exit(0);
