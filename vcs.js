"use strict";
// -- version Control
//
// Castellon.CH - 2019 (c)
// Author: Antonio Castellon - antonio@castellon.ch
//
// Generate a HASH from the content of the file
//

const crypto = require('crypto');
const fs = require('fs');

function getHash(fileName){

    return new Promise(function(resolve, reject){

        var hash = crypto.createHash('md5');
        var stream = fs.createReadStream(fileName);
        stream.on('data', function (data) { hash.update(data, 'utf8') })
        stream.on('end', function () { resolve(hash.digest('hex')); })
    });


}

module.exports.getHash = getHash;

