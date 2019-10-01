//
// test module
//
const vcs = require('./vcs.js');

vcs.getHash('./test.js').then(function(value) { console.log(value); });