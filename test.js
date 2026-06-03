//
// test module
//
const { getHash } = require('@acastellon/vcs');

getHash('./test.js')
  .then((value) => console.log(value))
  .catch(console.error);
