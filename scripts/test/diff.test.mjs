#!/usr/bin/env node
/**
 * diff.test.mjs — pins the CI contract of d360-diff.mjs.
 *
 * Run: node scripts/test/diff.test.mjs
 *
 * `--fail-on-change` is a gate, and a gate is only worth having if it fails when
 * it should. The case that matters most is the one this test was written for: a
 * comparison with NO configuration drift but an unsound basis (different orgs,
 * differing redaction, a module captured on one side only, a failed module)
 * previously exited 0 — a false green that would let a real problem through CI.
 *
 * Snapshots are built in memory and written to a temp dir, so this needs no org.
 */

import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..', '..');
const DIFF = join(ROOT, 'scripts', 'd360-diff.mjs');

let failures = 0;
let checks = 0;

/** A minimal but complete formatVersion 1 snapshot. */
function snapshot(over = {}) {
  return {
    formatVersion: 1,
    capturedAt: '2026-01-01T00:00:00.000Z',
    apiVersion: '66.0',
    org: 'demo@example.com',
    dataSpace: 'default',
    redacted: false,
    warnings: [],
    modules: {
      streams: { title: 'Data streams', data: { streams: [{ name: 'S1', status: 'ACTIVE', dataStreamType: 'IngestApi', dataLakeObject: 'S1__dll', sourceFieldCount: 3 }] } },
      dlos: { title: 'DLOs', data: { dataLakeObjects: [{ name: 'S1__dll', label: 'S1', category: 'Other', fieldCount: 3 }] } },
      spaces: { title: 'Data spaces', data: { dataSpaces: [{ name: 'default' }] } },
    },
    contentHash: 'deadbeefdeadbeef',
    ...over,
  };
}

const dir = mkdtempSync(join(tmpdir(), 'd360-diff-test-'));
let n = 0;
const write = (obj) => {
  const p = join(dir, `snap-${n++}.json`);
  writeFileSync(p, JSON.stringify(obj, null, 2));
  return p;
};

function runDiff(a, b, extra = []) {
  return spawnSync(process.execPath, [DIFF, a, b, ...extra], { encoding: 'utf8' });
}

function test(name, fn) {
  checks++;
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (err) {
    failures++;
    console.log(`  FAIL ${name}`);
    console.log(`       ${err.message}`);
  }
}

function assertExit(res, expected, msg) {
  if (res.status !== expected) {
    const out = `${res.stdout || ''}${res.stderr || ''}`.split('\n').filter(Boolean).slice(-5).join('\n       ');
    throw new Error(`${msg}\n       expected exit ${expected}, got ${res.status}\n       ${out}`);
  }
}

console.log('d360-diff.mjs\n');

try {
  /* ---------------------------------------------------------------------- */
  /* Exit 0 — genuinely clean                                                */
  /* ---------------------------------------------------------------------- */

  test('identical snapshots exit 0 under --fail-on-change', () => {
    const a = write(snapshot());
    assertExit(runDiff(a, a, ['--fail-on-change']), 0, 'clean pair should pass the gate');
  });

  test('clean pair reports no drift', () => {
    const a = write(snapshot());
    const res = runDiff(a, a);
    if (!/No configuration drift detected/.test(res.stdout)) throw new Error('missing clean verdict');
  });

  test('a shorter-but-equal capture is not drift', () => {
    // Same content, different key order / whitespace must not read as change.
    const a = write(snapshot());
    const b = write(snapshot({ capturedAt: '2026-02-02T00:00:00.000Z' }));
    assertExit(runDiff(a, b, ['--fail-on-change']), 0, 'timestamp-only difference is not drift');
  });

  /* ---------------------------------------------------------------------- */
  /* Exit 1 — real drift                                                     */
  /* ---------------------------------------------------------------------- */

  test('added entry exits 1 and is named', () => {
    const a = write(snapshot());
    const s = snapshot();
    s.modules.streams.data.streams.push({ name: 'S2', status: 'ACTIVE', dataStreamType: 'IngestApi', dataLakeObject: 'S2__dll', sourceFieldCount: 1 });
    const b = write(s);
    const res = runDiff(a, b, ['--fail-on-change']);
    assertExit(res, 1, 'added entry must fail the gate');
    if (!res.stdout.includes('S2')) throw new Error('added entry not named in output');
  });

  test('removed entry exits 1 and is named', () => {
    const a = write(snapshot());
    const b = write(snapshot({ modules: { ...snapshot().modules, streams: { title: 'Data streams', data: { streams: [] } } } }));
    const res = runDiff(a, b, ['--fail-on-change']);
    assertExit(res, 1, 'removed entry must fail the gate');
    if (!res.stdout.includes('S1')) throw new Error('removed entry not named');
  });

  test('changed field exits 1 without needing add or remove', () => {
    const a = write(snapshot());
    const s = snapshot();
    s.modules.streams.data.streams[0].status = 'INACTIVE';
    const b = write(s);
    const res = runDiff(a, b, ['--fail-on-change']);
    assertExit(res, 1, 'changed field must fail the gate');
    if (!/changed\s+S1/.test(res.stdout)) throw new Error('changed entry not named');
  });

  test('drift still exits 1 without --fail-on-change only when asked', () => {
    const a = write(snapshot());
    const s = snapshot();
    s.modules.streams.data.streams[0].status = 'INACTIVE';
    const b = write(s);
    assertExit(runDiff(a, b), 0, 'without the flag, diff is informational');
  });

  /* ---------------------------------------------------------------------- */
  /* Exit 1 — unsound with NO drift (the false green)                        */
  /* ---------------------------------------------------------------------- */

  test('different orgs exit 1 even with no drift', () => {
    const a = write(snapshot());
    const b = write(snapshot({ org: 'other@example.com' }));
    const res = runDiff(a, b, ['--fail-on-change']);
    assertExit(res, 1, 'cross-org comparison must not pass the gate');
    if (!/not conclusive/.test(res.stdout)) throw new Error('unsoundness not stated');
  });

  test('different data spaces exit 1 even with no drift', () => {
    const a = write(snapshot());
    const b = write(snapshot({ dataSpace: 'other_space' }));
    assertExit(runDiff(a, b, ['--fail-on-change']), 1, 'cross-space comparison must not pass the gate');
  });

  test('differing redaction exits 1 even with no drift', () => {
    const a = write(snapshot());
    const b = write(snapshot({ redacted: true }));
    assertExit(runDiff(a, b, ['--fail-on-change']), 1, 'redaction mismatch must not pass the gate');
  });

  test('module captured on one side only exits 1 even with no drift', () => {
    const s = snapshot();
    delete s.modules.spaces;
    const a = write(snapshot());
    const b = write(s);
    const res = runDiff(a, b, ['--fail-on-change']);
    assertExit(res, 1, 'partial capture must not pass the gate');
    if (!/spaces was captured in the old snapshot only/.test(res.stdout)) throw new Error('coverage gap not explained');
  });

  test('failed module exits 1 even with no drift', () => {
    const s = snapshot();
    s.modules.dlos = { title: 'DLOs', error: 'INTERNAL_SERVER_ERROR' };
    const a = write(snapshot());
    const b = write(s);
    const res = runDiff(a, b, ['--fail-on-change']);
    assertExit(res, 1, 'failed module must not pass the gate');
    if (!/dlos could not be captured/.test(res.stdout)) throw new Error('capture failure not explained');
  });

  test('capture warning exits 1 even with no drift', () => {
    const a = write(snapshot());
    const b = write(snapshot({ warnings: ['dlos: 70 DLOs  [incomplete]'] }));
    const res = runDiff(a, b, ['--fail-on-change']);
    assertExit(res, 1, 'incomplete capture must not pass the gate');
    if (!/may be incomplete/.test(res.stdout)) throw new Error('warning not surfaced');
  });

  /* ---------------------------------------------------------------------- */
  /* Exit 2 — unusable input                                                 */
  /* ---------------------------------------------------------------------- */

  test('wrong formatVersion exits 2', () => {
    const a = write(snapshot());
    const b = write(snapshot({ formatVersion: 99 }));
    assertExit(runDiff(a, b), 2, 'unknown format must be rejected');
  });

  test('one file exits 2', () => {
    const a = write(snapshot());
    assertExit(runDiff(a), 2, 'a single snapshot cannot be diffed');
  });

  test('non-JSON input exits 2', () => {
    const a = write(snapshot());
    const p = join(dir, 'junk.json');
    writeFileSync(p, 'not json at all');
    assertExit(runDiff(a, p), 2, 'unparseable input must be rejected');
  });

  test('missing file exits 2', () => {
    const a = write(snapshot());
    assertExit(runDiff(a, join(dir, 'does-not-exist.json')), 2, 'missing file must be rejected');
  });
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${checks - failures}/${checks} passed`);
process.exit(failures ? 1 : 0);
