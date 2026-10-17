#!/usr/bin/env node
/**
 * record-describe.mjs — refresh catalog/describe-fixtures.json from a live org.
 *
 * The fixtures record what `sf sobject describe` reports for the object families
 * the skills make claims about. validate.mjs checks those claims against this
 * file, which lets CI verify writability statements without an org connection.
 *
 * Run this after an API version change, or if a claim fails and you suspect the
 * platform moved rather than the docs.
 *
 * Usage:
 *   node scripts/record-describe.mjs                    # uses the tracked object list
 *   node scripts/record-describe.mjs --org my-org
 */

import { execFile } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..');
const FIXTURE = join(ROOT, 'catalog', 'describe-fixtures.json');

const orgFlag = process.argv.indexOf('--org');
const ORG = orgFlag > -1 ? process.argv[orgFlag + 1] : (process.env.SF_TARGET_ORG ?? '');

let existing;
try {
  existing = JSON.parse(readFileSync(FIXTURE, 'utf8'));
} catch {
  console.error('record-describe: cannot read catalog/describe-fixtures.json');
  process.exit(1);
}

const objects = {};
let failed = 0;

for (const [name, meta] of Object.entries(existing.objects)) {
  try {
    const { stdout } = await run('sf', ['sobject', 'describe', '-s', name, ...(ORG ? ['-o', ORG] : []), '--json'], {
      maxBuffer: 32 * 1024 * 1024,
    });
    const r = JSON.parse(stdout).result;
    objects[name] = {
      createable: r.createable,
      updateable: r.updateable,
      deletable: r.deletable,
      queryable: r.queryable,
      family: meta.family,
    };
    const changed =
      r.createable !== meta.createable ||
      r.updateable !== meta.updateable ||
      r.deletable !== meta.deletable;
    console.log(`  ${changed ? 'CHANGED' : 'ok     '}  ${name}`);
    if (changed) {
      console.log(`           was c=${meta.createable} u=${meta.updateable} d=${meta.deletable}`);
      console.log(`           now c=${r.createable} u=${r.updateable} d=${r.deletable}`);
    }
  } catch {
    console.error(`  FAIL     ${name} (describe failed — does the object still exist?)`);
    failed++;
  }
}

if (failed) {
  console.error(`\nrecord-describe: ${failed} object(s) could not be described. Fixture NOT written.`);
  process.exit(1);
}

writeFileSync(
  FIXTURE,
  JSON.stringify(
    { ...existing, recordedAt: new Date().toISOString().slice(0, 10), objects },
    null,
    2
  ) + '\n'
);
console.log(`\nrecord-describe: wrote ${Object.keys(objects).length} object(s) to catalog/describe-fixtures.json`);
