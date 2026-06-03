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

### `getHash(fileName: string): Promise<string>`

Generate md5 hash from file content using streaming (supports large files).

- **Parameters**:
  - `fileName` (string): Path to the file.
- **Returns**: Promise resolving to 32-char hex md5 digest.
- **Throws**: Rejects on FS errors (file not found, permissions, etc.).
- **Example**:
  ```js
  const hash = await vcs.getHash('./package.json');
  console.log(hash); // e.g. 'd41d8cd98f00b204e9800998ecf8427e'
  ```
- **Notes**: Uses crypto.createHash('md5') + fs.createReadStream. Idempotent for same content.

## License

MIT
