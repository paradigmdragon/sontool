import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const run = (...args) => spawnSync(process.execPath, ['scripts/validate.mjs', ...args], {
  cwd: root, encoding: 'utf8'
});

test('CLI accepts all public fixtures', () => {
  const result = run('examples/landing.sjg', 'examples/scroll.sjg', 'examples/choice.sjg');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.match(/^OK /gm)?.length, 3);
});

test('CLI returns nonzero for no input and unreadable input', () => {
  assert.notEqual(run().status, 0);
  assert.notEqual(run('does-not-exist.sjg').status, 0);
});

test('CLI rejects invalid files without printing their contents', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sontool-cli-'));
  try {
    const path = join(dir, 'invalid.sjg');
    const privateText = 'SYNTHETIC_PRIVATE_TEXT_MUST_NOT_APPEAR';
    for (const contents of [`{"title":"${privateText}"}`, `{${privateText}`]) {
      await writeFile(path, contents);
      const result = run('examples/landing.sjg', path);
      assert.notEqual(result.status, 0);
      assert.ok(result.stdout.includes('OK examples/landing.sjg'));
      assert.equal((result.stdout + result.stderr).includes(privateText), false);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
