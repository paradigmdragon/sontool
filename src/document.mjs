// SPDX-License-Identifier: Apache-2.0
import Ajv2020 from 'ajv/dist/2020.js';
import schema from '../schemas/sjg-draft.schema.json' with { type: 'json' };

const checkSchema = new Ajv2020({ allErrors: true, strict: true }).compile(schema);

// Object APIs accept JSON data only. Reject values stringify would drop or alter.
function isJsonValue(value, ancestors = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object' || ancestors.has(value)) return false;
  const proto = Object.getPrototypeOf(value);
  if (Array.isArray(value) && proto !== Array.prototype) return false;
  if (!Array.isArray(value) && proto !== Object.prototype && proto !== null) return false;
  ancestors.add(value);
  const keys = Reflect.ownKeys(value).filter(key => !(Array.isArray(value) && key === 'length'));
  const descriptors = keys.map(key => Object.getOwnPropertyDescriptor(value, key));
  const plain = keys.every(key => typeof key === 'string') && descriptors.every(d => d.enumerable && 'value' in d);
  const arrayKeys = !Array.isArray(value) || (keys.length === value.length && keys.every((key, i) => key === String(i)));
  const valid = plain && arrayKeys && descriptors.every(d => isJsonValue(d.value, ancestors));
  ancestors.delete(value);
  return valid;
}

/** Validate the draft envelope and document-wide IDs without changing the input. */
export function validateDocument(value) {
  if (!isJsonValue(value)) {
    return { valid: false, errors: [{ path: '', keyword: 'jsonValue', message: 'must contain only finite, acyclic JSON data' }] };
  }
  if (!checkSchema(value)) {
    return {
      valid: false,
      errors: checkSchema.errors.map(e => ({ path: e.instancePath, keyword: e.keyword, message: e.message }))
    };
  }
  const seen = new Set();
  const errors = [];
  function visit(node, path) {
    if (seen.has(node.id)) errors.push({ path: `${path}/id`, keyword: 'uniqueId', message: 'must be unique within the work' });
    seen.add(node.id);
  }
  visit(value, '');
  value.pages.forEach((page, p) => {
    visit(page, `/pages/${p}`);
    page.scenes.forEach((scene, s) => {
      const path = `/pages/${p}/scenes/${s}`;
      visit(scene, path);
      scene.blocks.forEach((block, b) => visit(block, `${path}/blocks/${b}`));
    });
  });
  return { valid: errors.length === 0, errors };
}

function assertDocument(value) {
  const result = validateDocument(value);
  if (!result.valid) {
    const error = new TypeError('Invalid SJG document');
    error.errors = result.errors;
    throw error;
  }
}

/** Parse data only: no module loading, network requests or behavior execution. */
export function parseDocument(text) {
  const value = JSON.parse(text);
  assertDocument(value);
  return value;
}

/** Preserve JSON values, including opaque extensions; whitespace is normalized. */
export function serializeDocument(value) {
  assertDocument(value);
  return `${JSON.stringify(value, null, 2)}\n`;
}
