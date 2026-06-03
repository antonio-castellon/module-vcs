//
// Extended test for vcs module
//
const assert = require('assert');
const { getHash } = require('./vcs');

const fs = require('fs');
const path = require('path');

const testFile = path.join(__dirname, 'test.js');

async function runTests() {
  try {
    // Basic
    const hash1 = await getHash(testFile);
    assert.strictEqual(typeof hash1, 'string');
    assert.strictEqual(hash1.length, 32); // md5 hex
    console.log('Basic hash OK:', hash1);

    // Same file same hash
    const hash2 = await getHash(testFile);
    assert.strictEqual(hash1, hash2);
    console.log('Idempotent OK');

    // Different content -> different hash
    const tmp = path.join(__dirname, '.tmp-test.txt');
    fs.writeFileSync(tmp, 'hello');
    const h1 = await getHash(tmp);
    fs.writeFileSync(tmp, 'hello world');
    const h2 = await getHash(tmp);
    assert.notStrictEqual(h1, h2);
    fs.unlinkSync(tmp);
    console.log('Different content OK');

    // Error case: non-existent file
    try {
      await getHash('/non/existent/file.txt');
      assert.fail('Should have rejected');
    } catch (e) {
      console.log('Non-existent file error OK:', e.message);
    }

    console.log('All vcs tests passed');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

runTests();
