import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseDocument, serializeDocument, validateDocument } from '../src/document.mjs';

const fixture = async (name = 'landing') => JSON.parse(
  await readFile(new URL(`../examples/${name}.sjg`, import.meta.url), 'utf8')
);

for (const name of ['landing', 'scroll', 'choice']) {
  test(`${name} fixture survives a document round trip`, async () => {
    const original = await fixture(name);
    const restored = parseDocument(serializeDocument(original));
    assert.deepEqual(restored, original);
    assert.equal(restored.pages[0].scenes[0].blocks[0].id, `${name}-intro`);
  });
}

test('malformed JSON is rejected', () => {
  assert.throws(() => parseDocument('{broken'), SyntaxError);
});

for (const [name, mutate] of [
  ['future schema version', d => { d.schemaVersion = '99.0.0'; }],
  ['missing pages', d => { delete d.pages; }],
  ['negative revision', d => { d.revision = -1; }],
  ['fractional revision', d => { d.revision = 0.5; }],
  ['unsafe revision', d => { d.revision = Number.MAX_SAFE_INTEGER + 1; }],
  ['empty ID', d => { d.id = ''; }],
  ['invalid scenes', d => { d.pages[0].scenes = {}; }],
  ['missing block content', d => { delete d.pages[0].scenes[0].blocks[0].content; }],
  ['missing module version', d => { delete d.pages[0].scenes[0].blocks[0].module.version; }],
  ['invalid layout type', d => { d.pages[0].scenes[0].blocks[0].layout = []; }]
]) {
  test(`rejects ${name} without repairing the input`, async () => {
    const doc = await fixture();
    mutate(doc);
    const before = JSON.stringify(doc);
    assert.equal(validateDocument(doc).valid, false);
    assert.throws(() => parseDocument(JSON.stringify(doc)), /Invalid SJG document/);
    assert.throws(() => serializeDocument(doc), /Invalid SJG document/);
    assert.equal(JSON.stringify(doc), before);
  });
}

test('IDs are unique across the entire hierarchy', async () => {
  const doc = await fixture();
  doc.pages[0].scenes[0].blocks[0].id = doc.id;
  const result = validateDocument(doc);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.keyword === 'uniqueId'));
});

test('unknown fields and unsupported module data remain inert and preserved', async () => {
  const doc = await fixture();
  doc.future = { text: '한글 🐉', nested: [null, false, 1.25] };
  const block = doc.pages[0].scenes[0].blocks[0];
  block.module = { id: 'future.example/opaque', version: '9.0' };
  block.content = { source: 'throw new Error("must never execute")', payload: [1, 2] };
  block.futureLayout = { arbitrary: true };
  const restored = parseDocument(serializeDocument(doc));
  assert.deepEqual(restored, doc);
  assert.deepEqual(restored.future, { text: '한글 🐉', nested: [null, false, 1.25] });
});

test('validation never mutates a valid work', async () => {
  const doc = await fixture();
  const before = JSON.stringify(doc);
  assert.equal(validateDocument(doc).valid, true);
  assert.equal(JSON.stringify(doc), before);
});

test('non-document roots fail with structured errors', () => {
  for (const value of [null, [], 'text', 1]) {
    const result = validateDocument(value);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
  }
});

test('serialization refuses values JSON would silently lose or alter', async () => {
  for (const value of [undefined, NaN, Infinity, 1n, () => {}, new Date()]) {
    const doc = await fixture();
    doc.future = value;
    assert.throws(() => serializeDocument(doc), /Invalid SJG document/);
  }
  const cyclic = await fixture();
  cyclic.future = cyclic;
  assert.throws(() => serializeDocument(cyclic), /Invalid SJG document/);
});

test('serialization rejects array subclasses without invoking inherited toJSON', async () => {
  let calls = 0;
  class ReplacingArray extends Array {
    toJSON() {
      calls++;
      return ['changed'];
    }
  }
  const doc = await fixture();
  doc.future = new ReplacingArray('original');
  assert.throws(() => serializeDocument(doc), /Invalid SJG document/);
  assert.equal(validateDocument(doc).valid, false);
  assert.equal(calls, 0);
});
