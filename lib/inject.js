'use strict';

const fs = require('fs');
const readline = require('readline');

const filename = process.argv[2];
const readStream = readline.createInterface({
    input: fs.createReadStream(filename.slice(0, -4) + '_inject.txt'),
    terminal: false
});
const writeStream = fs.createWriteStream(filename.slice(0, -4) + '_injected.txt', {'flags': 'w'});

let index = 0;
var dict = JSON.parse(fs.readFileSync(filename.slice(0, -3) + 'json'));

readStream.on('line', function(line) {
  let newLine = line;
  if (line.indexOf('%%') > -1) {
    // contains a variable
    let keys = line.match(/%%[0-9]+%%/g);
    for (let i = 0; i < keys.length; i++) {
      newLine = newLine.replace(keys[i], dict[keys[i]]);
    }

  }
  writeStream.write(newLine + '\n');
});

readStream.on('close', function () {
  writeStream.end()
});
