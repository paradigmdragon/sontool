// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import { parseDocument } from '../src/document.mjs';

const paths = process.argv.slice(2);
if (paths.length === 0) {
  console.error('Usage: npm run validate -- <work.sjg> [more.sjg ...]');
  process.exitCode = 1;
}
for (const path of paths) {
  try {
    parseDocument(await readFile(path, 'utf8'));
    console.log(`OK ${path}`);
  } catch (error) {
    // JSON parser messages may quote document contents. Print only a category.
    const category = error instanceof SyntaxError ? 'invalid JSON'
      : error.errors ? 'invalid SJG document' : 'unable to read or validate file';
    console.error(`FAIL ${path}: ${category}`);
    process.exitCode = 1;
  }
}
