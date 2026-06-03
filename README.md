# @acastellon/vcs

**Content-based versioning and hashing for files, strings, buffers, and directory trees.**

The goal is to provide a lightweight, real-time "version control" mechanism based purely on **file/content hashes** (no dependency on git or container access). This is especially useful for:

- Hot-checking whether a deployed file, config, or service folder has changed.
- Content-addressable versioning in microservices.
- Detecting drift without shelling into containers or relying on `git rev-parse`.

Supports multiple algorithms (md5, sha1, sha256, sha512) and works great for large files (streaming) and whole directories.

## Install

```bash
npm install @acastellon/vcs
```

## Quick Usage

```js
const vcs = require('@acastellon/vcs');

// Hash a file (streaming, memory efficient)
const fileHash = await vcs.getHash('./package.json');

// Hash arbitrary content (string or Buffer) — no disk I/O needed
const configHash = await vcs.getHashFromContent(JSON.stringify({ port: 3000 }));

// Hash an entire directory tree (great for "version of this service")
const dirVersion = await vcs.getDirHash('./my-service', {
  algorithm: 'sha256',
  ignore: ['node_modules', '.git', 'logs']
});

console.log('Service version:', dirVersion);
```

## API

### `getHash(fileName: string, algorithm?: string): Promise<string>`

Generate a hash from a file's content using streaming (supports very large files without high memory usage).

- **Parameters**:
  - `fileName` (string): Path to the file.
  - `algorithm` (string, optional): `'md5'` (default), `'sha1'`, `'sha256'`, or `'sha512'`.
- **Returns**: Promise resolving to hex digest.
- **Rejects** on FS errors (ENOENT, permission, etc.).

**Minimal example (self-contained):**

```js
const vcs = require('@acastellon/vcs');
const fs = require('fs');
const path = require('path');

const testFile = path.join(__dirname, 'demo.txt');
fs.writeFileSync(testFile, 'hello world - this is the content');

vcs.getHash(testFile, 'sha256')
  .then(hash => {
    console.log('SHA256 of file:', hash);
    fs.unlinkSync(testFile);
  })
  .catch(err => console.error(err));
```

### `getHashFromContent(content: string | Buffer, algorithm?: string): Promise<string>`

Hash data that you already have in memory (config JSON, template, API response body, etc.). No file system access required.

- **Parameters**:
  - `content`: string or Buffer.
  - `algorithm`: same as above.
- **Returns**: hex digest.

**Minimal example (self-contained):**

```js
const vcs = require('@acastellon/vcs');

const config = { version: '1.2.3', featureX: true };
const contentHash = await vcs.getHashFromContent(JSON.stringify(config), 'sha256');

console.log('Config content version:', contentHash);

// Useful for versioning things you receive over the wire or generate dynamically
```

### `getDirHash(dirPath: string, options?: object): Promise<string>`

Compute a stable content-based hash for a whole directory tree. Perfect for getting a single "version id" of a service, a set of static assets, or a code snapshot.

The algorithm walks the tree (sorted), hashes each file, and produces a final manifest hash. Adding/removing/editing any file changes the result deterministically.

- **Parameters**:
  - `dirPath`: root directory.
  - `options.algorithm`: default `'md5'`.
  - `options.recursive`: default `true`.
  - `options.ignore`: array of names/paths to skip (e.g. `['node_modules', '.git']`).
- **Returns**: hex digest of the directory contents.

**Minimal example (self-contained):**

```js
const vcs = require('@acastellon/vcs');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'demo-service');
fs.mkdirSync(root, { recursive: true });
fs.writeFileSync(path.join(root, 'index.js'), 'console.log("hi");');
fs.mkdirSync(path.join(root, 'config'), { recursive: true });
fs.writeFileSync(path.join(root, 'config', 'app.json'), '{"port":3000}');

vcs.getDirHash(root, {
  algorithm: 'sha256',
  ignore: ['node_modules']
})
  .then(version => {
    console.log('Directory version (service snapshot):', version);
    // ... later you can store/compare this version
    fs.rmSync(root, { recursive: true, force: true });
  })
  .catch(console.error);
```

## Why content hashing instead of git?

- Works even when `.git` is not present (common in production containers).
- Gives you a hash based on *actual bytes*, not commit metadata.
- Extremely fast for change detection.
- Directory hashes let you version "the whole thing" with one value.

## License

MIT
