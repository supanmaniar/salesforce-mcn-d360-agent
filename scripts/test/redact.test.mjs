#!/usr/bin/env node
/**
 * redact.test.mjs — proves redaction actually hides literals.
 *
 * Run: node scripts/test/redact.test.mjs
 *
 * These tests encode the two defects found by inspection of the original
 * single-purpose implementation:
 *
 *   1. Reach — the original walked only `modules.segments[].includeCriteria`
 *      and `modules.activations`. A criteria blob under any other module
 *      survived redaction untouched.
 *   2. Completeness — redaction was applied per module during capture and
 *      again over the assembled snapshot, so values were walked twice and the
 *      reported count was a pass count, not a value count.
 *
 * Both were invisible in a hand-check because the one module the original did
 * reach came out correct. The tests below use a module the original never
 * looked at, which is the case that would have leaked a real config.
 */

import { redactAll, unescapeHtml, REDACTED } from '../lib/redact.mjs';

let failures = 0;
let checks = 0;

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

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function assertEqual(actual, expected, msg) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${msg}\n       expected ${e}\n       actual   ${a}`);
}

/** A criteria blob as the API returns it: JSON wrapped in HTML entities. */
const criteria = (obj) => JSON.stringify(obj).replace(/"/g, '&quot;');

const SAMPLE = {
  logicalOperator: 'AND',
  criteria: [
    {
      objectApiName: 'ssot__Individual__dlm',
      fieldApiName: 'ssot__CountryId__c',
      operator: 'TextComparison',
      values: ['United States', 'Canada', 'Mexico'],
    },
  ],
};

console.log('redact.mjs\n');

/* -------------------------------------------------------------------------- */
/* Reach                                                                      */
/* -------------------------------------------------------------------------- */

test('redacts criteria in the segments module', () => {
  const snap = {
    modules: {
      segments: { data: { segments: [{ apiName: 'S1', includeCriteria: criteria(SAMPLE) }] } },
    },
  };
  redactAll(snap);
  const c = snap.modules.segments.data.segments[0].includeCriteria;
  assert(!c.includes('United States'), 'literal leaked from segments');
  assert(c.includes(REDACTED), 'no redaction marker in segments');
});

test('redacts criteria nested in an unexpected module (the original blind spot)', () => {
  // The original implementation only looked at segments and activations.
  const snap = {
    modules: {
      calculations: {
        data: {
          calculatedInsights: [
            { name: 'CI', expressionCriteria: criteria(SAMPLE) },
            { name: 'CI2', nested: { deep: { filterCriteria: criteria(SAMPLE) } } },
          ],
        },
      },
    },
  };
  redactAll(snap);
  const [a, b] = snap.modules.calculations.data.calculatedInsights;
  assert(!a.expressionCriteria.includes('United States'), 'literal leaked from expressionCriteria');
  assert(!b.nested.deep.filterCriteria.includes('United States'), 'literal leaked from deeply nested filterCriteria');
  assert(a.expressionCriteria.includes(REDACTED), 'no marker in expressionCriteria');
  assert(b.nested.deep.filterCriteria.includes(REDACTED), 'no marker in nested filterCriteria');
});

test('redacts criteria held as an object rather than a string', () => {
  const snap = {
    modules: {
      activations: { data: { activations: [{ name: 'A', includeCriteria: SAMPLE }] } },
    },
  };
  redactAll(snap);
  const c = snap.modules.activations.data.activations[0].includeCriteria;
  assertEqual(c.criteria[0].values, [REDACTED, REDACTED, REDACTED], 'object criteria not redacted');
  assert(c.criteria[0].objectApiName === 'ssot__Individual__dlm', 'logic key was lost');
});

/* -------------------------------------------------------------------------- */
/* Preservation — a diff must still show logic change                         */
/* -------------------------------------------------------------------------- */

test('keeps objects, fields, operators and structure', () => {
  const snap = {
    modules: { segments: { data: { segments: [{ apiName: 'S1', includeCriteria: criteria(SAMPLE) }] } } },
  };
  redactAll(snap);
  const c = snap.modules.segments.data.segments[0].includeCriteria;
  for (const keep of ['logicalOperator', 'AND', 'objectApiName', 'ssot__Individual__dlm', 'operator', 'TextComparison']) {
    assert(c.includes(keep), `redaction removed filter logic: ${keep}`);
  }
});

test('preserves array length so value-count drift stays visible', () => {
  const snap = {
    modules: {
      segments: {
        data: {
          segments: [
            { apiName: 'S1', includeCriteria: criteria(SAMPLE) },
            { apiName: 'S2', includeCriteria: criteria({ criteria: [{ values: ['a', 'b'] }] }) },
          ],
        },
      },
    },
  };
  redactAll(snap);
  const rec = JSON.parse(snap.modules.segments.data.segments[0].includeCriteria);
  assertEqual(rec.criteria[0].values.length, 3, 'value count changed');
});

test('does not mutate api names or labels', () => {
  const snap = {
    modules: {
      segments: {
        data: { segments: [{ apiName: 'NA_Webinar_Leads', name: 'United States Webinar', includeCriteria: criteria(SAMPLE) }] },
      },
    },
  };
  redactAll(snap);
  const s = snap.modules.segments.data.segments[0];
  assert(s.apiName === 'NA_Webinar_Leads', 'apiName was touched');
  assert(s.name === 'United States Webinar', 'label was touched — redaction is scoped to criteria only');
});

/* -------------------------------------------------------------------------- */
/* Count and edge cases                                                       */
/* -------------------------------------------------------------------------- */

test('counts each hidden value exactly once, not each pass', () => {
  const snap = {
    modules: {
      segments: { data: { segments: [{ apiName: 'S1', includeCriteria: criteria(SAMPLE) }] } },
    },
  };
  const n = redactAll(snap);
  assertEqual(n, 3, 'count is wrong (this is the double-pass defect)');
});

test('counts values across every module in one pass', () => {
  const snap = {
    modules: {
      segments: { data: { segments: [{ includeCriteria: criteria(SAMPLE) }] } },
      other: { data: { things: [{ xCriteria: criteria(SAMPLE) }] } },
    },
  };
  assertEqual(redactAll(snap), 6, 'count does not span modules');
});

test('hides an unparseable criteria blob wholesale', () => {
  const snap = {
    modules: { segments: { data: { segments: [{ includeCriteria: 'NOT JSON — and looks sensitive' }] } } },
  };
  const n = redactAll(snap);
  assertEqual(snap.modules.segments.data.segments[0].includeCriteria, REDACTED, 'opaque blob not hidden');
  assertEqual(n, 1, 'opaque blob not counted');
});

test('is idempotent — a second pass changes nothing', () => {
  const snap = { modules: { segments: { data: { segments: [{ includeCriteria: criteria(SAMPLE) }] } } } };
  redactAll(snap);
  const once = JSON.stringify(snap);
  redactAll(snap);
  assertEqual(JSON.stringify(snap), once, 'second pass altered the snapshot');
});

test('tolerates missing modules and empty criteria', () => {
  assertEqual(redactAll({}), 0, 'empty snapshot threw');
  assertEqual(redactAll({ modules: {} }), 0, 'empty modules threw');
  assertEqual(redactAll({ modules: { m: { data: { l: [{ includeCriteria: '' }] } } } }), 0, 'empty criteria threw');
  assertEqual(redactAll({ modules: { m: { error: 'INTERNAL_SERVER_ERROR' } } }), 0, 'errored module threw');
});

test('unescapes HTML entities in the documented order', () => {
  assertEqual(unescapeHtml('&quot;a&quot;'), '"a"', 'quote unescape failed');
  assertEqual(unescapeHtml('a&amp;b'), 'a&b', 'ampersand unescape failed');
});

console.log(`\n${checks - failures}/${checks} passed`);
process.exit(failures ? 1 : 0);
