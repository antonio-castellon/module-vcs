# @acastellon/vcs

Simple Hash generator from the content of a file.
The idea is to use it to have a real-time version of control based in the content of the file, 
sometimes it's useful you need to check webservices in hot without access to the container/code.

## Install

```bash
npm install @acastellon/vcs
```

## Usage

```js
const vcs = require('@acastellon/vcs');

vcs.getHash('./test.js')
   .then( function(value) { 
       console.log(value); 
   })
   .catch(console.error);
```

## API

- `getHash(fileName: string): Promise<string>` - returns md5 hex of file content.

## License

MIT
