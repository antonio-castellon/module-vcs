//
// test module
//
const vcs = require('@acastellon/vcs');

vcs.getHash('./test.js').then(function(value) { console.log(value); });