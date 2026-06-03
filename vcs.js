"use strict";
// -- Version Control
//
// Castellon.CH - 2019-2026 (c)
// Author: Antonio Castellon - antonio@castellon.ch
//
// Generate a HASH from the content of the file
//

const crypto = require('crypto');
const fs = require('fs');

/**
 * Generate md5 hash from file content.
 * Uses streaming to support large files without loading everything in memory.
 *
 * @param {string} fileName - Path to the file to hash
 * @returns {Promise<string>} - Hex digest (32 chars for md5)
 * @throws {Error} - On file read errors (e.g. ENOENT, permission)
 */
function getHash(fileName) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(fileName);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}

module.exports = { getHash };
