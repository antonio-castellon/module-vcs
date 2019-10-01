//
// test module
//
const vcs = require('@acastellon/vcs.js');

vcs.getHash('./test.js').then(function(value) { console.log(value); });