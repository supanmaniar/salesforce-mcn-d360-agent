/**
 * redact.mjs — hide literal filter values in a Data 360 snapshot.
 *
 * Extracted from d360-snapshot.mjs so it can be unit-tested in CI without a
 * live org. Redaction that silently fails is worse than no redaction at all:
 * the user believes the file is shareable and it is not. The tests in
 * scripts/test/redact.test.mjs exist to make that failure loud.
 *
 * Deliberately conservative — values are hidden, names and structure are not,
 * so a diff still reports logic changes and field-level drift.
 */

export const REDACTED = '<redacted>';

/** Criteria blobs arrive HTML-escaped from the API, so `&quot;` must be decoded first. */
export function unescapeHtml(s) {
  return String(s)
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'");
}

/** Keys whose values are literal user data rather than filter logic. */
const VALUE_KEYS = new Set(['values', 'parameterizedValues', 'staticData', 'value', 'staticValues']);

/**
 * Replace literal values in a parsed criteria tree, in place.
 * Returns the number of individual values hidden.
 */
function redactValues(node, count) {
  if (Array.isArray(node)) {
    for (const item of node) count = redactValues(item, count);
    return count;
  }
  if (!node || typeof node !== 'object') return count;

  for (const [k, v] of Object.entries(node)) {
    if (VALUE_KEYS.has(k) && (Array.isArray(v) || typeof v === 'string')) {
      count += Array.isArray(v) ? v.length : 1;
      node[k] = Array.isArray(v) ? v.map(() => REDACTED) : REDACTED;
    } else {
      count = redactValues(v, count);
    }
  }
  return count;
}

/**
 * Find every key ending in `Criteria` anywhere in the snapshot and redact it.
 *
 * Walks the whole tree rather than naming modules, so a criteria blob nested in
 * a module we have not thought of yet is still covered — that reach is the
 * point, and it is what the tests pin down.
 */
function redactCriteria(node, count) {
  if (Array.isArray(node)) {
    for (const item of node) count = redactCriteria(item, count);
    return count;
  }
  if (!node || typeof node !== 'object') return count;

  for (const [k, v] of Object.entries(node)) {
    if (k.endsWith('Criteria')) {
      if (typeof v === 'string' && v) {
        try {
          const tree = JSON.parse(unescapeHtml(v));
          count = redactValues(tree, count);
          node[k] = JSON.stringify(tree);
        } catch {
          // Not parseable as JSON: the whole blob is opaque, so hide it wholesale.
          node[k] = REDACTED;
          count++;
        }
      } else if (v && typeof v === 'object') {
        count = redactValues(v, count);
      }
    } else {
      count = redactCriteria(v, count);
    }
  }
  return count;
}

/**
 * Redact a whole snapshot in one pass.
 * Returns the number of literal values hidden.
 */
export function redactAll(snapshot) {
  return redactCriteria(snapshot?.modules ?? {}, 0);
}
