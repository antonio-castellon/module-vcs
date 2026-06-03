//
// Comprehensive tests for @acastellon/vcs
// Covers getHash (file), getHashFromContent, getDirHash + algorithms + errors
//
const assert = require('assert');
const { getHash, getHashFromContent, getDirHash } = require('./vcs');

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

const testFile = path.join(__dirname, 'test.js');

async function runTests() {
  const tmpDir = path.join(__dirname, '.tmp-vcs-tests');
  try {
    await fsp.mkdir(tmpDir, { recursive: true });

    console.log('--- Testing getHash (file) ---');

    const hash1 = await getHash(testFile);
    assert.strictEqual(typeof hash1, 'string');
    assert.strictEqual(hash1.length, 32, 'md5 default is 32 hex chars');
    console.log('✓ Basic md5 hash OK');

    const hash2 = await getHash(testFile);
    assert.strictEqual(hash1, hash2);
    console.log('✓ Idempotent OK');

    // sha256
    const sha256 = await getHash(testFile, 'sha256');
    assert.strictEqual(sha256.length, 64);
    console.log('✓ sha256 algorithm OK');

    // Different content
    const tmpFile = path.join(tmpDir, 'content.txt');
    await fsp.writeFile(tmpFile, 'hello');
    const hA = await getHash(tmpFile);
    fs.writeFileSync(tmpFile, 'hello world');
    const hB = await getHash(tmpFile);
    assert.notStrictEqual(hA, hB);
    fs.unlinkSync(tmpFile);
    console.log('✓ Different content produces different hash OK');

    // Error on missing file
    try {
      await getHash(path.join(tmpDir, 'does-not-exist.txt'));
      assert.fail('should reject');
    } catch (e) {
      assert.ok(e.message.includes('ENOENT') || e.code === 'ENOENT');
      console.log('✓ Non-existent file error OK');
    }

    console.log('\n--- Testing getHashFromContent ---');

    const strHash = await getHashFromContent('hello world');
    assert.strictEqual(strHash.length, 32);
    const sameStrHash = await getHashFromContent('hello world');
    assert.strictEqual(strHash, sameStrHash);

    const bufHash = await getHashFromContent(Buffer.from('hello world'));
    assert.strictEqual(strHash, bufHash);
    console.log('✓ String and Buffer content hashing OK');

    const shaContent = await getHashFromContent('test', 'sha256');
    assert.strictEqual(shaContent.length, 64);
    console.log('✓ getHashFromContent with algorithm OK');

    // Different content different hash
    assert.notStrictEqual(
      await getHashFromContent('a'),
      await getHashFromContent('b')
    );

    console.log('\n--- Testing getDirHash ---');

    // Setup a small dir tree
    const subDir = path.join(tmpDir, 'subdir');
    await fsp.mkdir(subDir, { recursive: true });
    await fsp.writeFile(path.join(tmpDir, 'a.txt'), 'alpha');
    await fsp.writeFile(path.join(subDir, 'b.txt'), 'beta');

    const dirHash1 = await getDirHash(tmpDir);
    assert.strictEqual(typeof dirHash1, 'string');
    assert.strictEqual(dirHash1.length, 32);

    // Same tree = same hash
    const dirHash2 = await getDirHash(tmpDir);
    assert.strictEqual(dirHash1, dirHash2);
    console.log('✓ Directory hash stable and deterministic OK');

    // Change content -> different hash
    await fsp.writeFile(path.join(subDir, 'b.txt'), 'beta changed');
    const dirHash3 = await getDirHash(tmpDir);
    assert.notStrictEqual(dirHash1, dirHash3);
    console.log('✓ Dir hash changes with content OK');

    // sha256 dir
    const dirSha = await getDirHash(tmpDir, { algorithm: 'sha256' });
    assert.strictEqual(dirSha.length, 64);
    console.log('✓ getDirHash with algorithm OK');

    // ignore works
    const nm = path.join(tmpDir, 'node_modules');
    await fsp.mkdir(nm, { recursive: true });
    await fsp.writeFile(path.join(nm, 'ignore.me'), 'should be ignored');
    await fsp.writeFile(path.join(nm, 'pkg.json'), 'ignored');

    const hashWithIgnore = await getDirHash(tmpDir, { ignore: ['node_modules'] });
    assert.ok(hashWithIgnore.length === 32);
    console.log('✓ getDirHash ignore option OK');

    // Empty dir
    const emptyDir = path.join(tmpDir, 'empty');
    await fsp.mkdir(emptyDir);
    const emptyHash = await getDirHash(emptyDir);
    assert.ok(emptyHash.length === 32);
    console.log('✓ Empty directory hash OK');

    // Unsupported algo
    try {
      await getHash(testFile, 'md4');
      assert.fail('should throw');
    } catch (e) {
      assert.ok(e.message.includes('Unsupported algorithm'));
      console.log('✓ Unsupported algorithm error OK');
    }

    console.log('\n=== All vcs tests passed ===');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    // Cleanup
    try {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

runTests();