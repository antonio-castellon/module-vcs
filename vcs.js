"use strict";
// -- Version Control (content-based hashing for real-time versioning)
//
// Castellon.CH - 2019-2026 (c)
// Author: Antonio Castellon - antonio@castellon.ch
//
// Generate a HASH from the content of a file, string, buffer, or entire directory tree.
// Useful for content-addressable versioning / hot checks of services/files
// without needing full git access inside containers.
//

const crypto = require('crypto');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

/**
 * Compute hash of data (string or Buffer).
 * @param {string|Buffer} data
 * @param {string} [algorithm='md5']
 * @returns {string} hex digest
 */
function _hashData(data, algorithm = 'md5') {
  const hash = crypto.createHash(algorithm);
  hash.update(data);
  return hash.digest('hex');
}

/**
 * Validate supported hash algorithm.
 */
function _validateAlgorithm(algorithm) {
  const supported = ['md5', 'sha1', 'sha256', 'sha512'];
  if (!supported.includes(algorithm)) {
    throw new Error(`Unsupported algorithm "${algorithm}". Use one of: ${supported.join(', ')}`);
  }
}

/**
 * Generate hash from file content (streaming for memory efficiency on large files).
 *
 * @param {string} fileName - Path to the file
 * @param {string} [algorithm='md5'] - 'md5' | 'sha1' | 'sha256' | 'sha512'
 * @returns {Promise<string>} hex digest
 */
async function getHash(fileName, algorithm = 'md5') {
  _validateAlgorithm(algorithm);

  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm);
    const stream = fs.createReadStream(fileName);

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Generate hash directly from string or Buffer content (no file I/O).
 * Extremely useful for hashing configs, API payloads, templates, etc. in memory.
 *
 * @param {string|Buffer} content
 * @param {string} [algorithm='md5']
 * @returns {Promise<string>} hex digest
 */
async function getHashFromContent(content, algorithm = 'md5') {
  _validateAlgorithm(algorithm);
  if (content == null) {
    throw new Error('content is required');
  }
  // Support string or Buffer (or array-like that works with update)
  const data = Buffer.isBuffer(content) ? content : String(content);
  return _hashData(data, algorithm);
}

/**
 * Recursively collect all regular files under a directory (sorted for deterministic hash).
 * @private
 */
async function _collectFiles(dir, baseDir, recursive, ignoreSet) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  let files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath);

    if (ignoreSet.has(entry.name) || ignoreSet.has(relPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      if (recursive) {
        const sub = await _collectFiles(fullPath, baseDir, recursive, ignoreSet);
        files = files.concat(sub);
      }
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files.sort(); // lexical sort for stable order
}

/**
 * Generate a content-based hash for an entire directory tree.
 * Useful to get a "version" of a whole service / folder of files.
 *
 * The hash is computed by:
 *  - Walking files (sorted)
 *  - For each: relativePath + '\0' + fileContentHash
 *  - Final hash over the concatenated "manifest"
 *
 * @param {string} dirPath
 * @param {object} [options]
 * @param {string} [options.algorithm='md5']
 * @param {boolean} [options.recursive=true]
 * @param {string[]} [options.ignore=['node_modules', '.git', '.svn']]
 * @returns {Promise<string>} hex digest of the directory content
 */
async function getDirHash(dirPath, options = {}) {
  const {
    algorithm = 'md5',
    recursive = true,
    ignore = ['node_modules', '.git', '.svn', 'package-lock.json']
  } = options;

  _validateAlgorithm(algorithm);

  const ignoreSet = new Set(ignore);
  const absDir = path.resolve(dirPath);

  let stat;
  try {
    stat = await fsp.stat(absDir);
  } catch (e) {
    throw new Error(`Directory not accessible: ${dirPath} (${e.message})`);
  }
  if (!stat.isDirectory()) {
    throw new Error(`Not a directory: ${dirPath}`);
  }

  const filePaths = await _collectFiles(absDir, absDir, recursive, ignoreSet);

  if (filePaths.length === 0) {
    // Empty dir hash (stable)
    return _hashData('', algorithm);
  }

  const manifestParts = [];
  for (const filePath of filePaths) {
    const rel = path.relative(absDir, filePath).replace(/\\/g, '/'); // posix-style for stability
    const contentHash = await getHash(filePath, algorithm);
    manifestParts.push(`${rel}\0${contentHash}`);
  }

  const manifest = manifestParts.join('\n');
  return _hashData(manifest, algorithm);
}

module.exports = {
  getHash,
  getHashFromContent,
  getDirHash
};