'use strict';

const fs = require('fs');
const readline = require('readline');

const keywords = ['VO', 'SE', 'P1', 'P2', 'P3', 'P4', 'P5', 'AC', 'EF',
                  'FR', 'TI', 'MU', 'IT', 'BG', 'bg_', '#E', '#S', ' '];
const filename = process.argv[2];
const readStream = readline.createInterface({
    input: fs.createReadStream(filename),
    terminal: false
});
const writeStream = fs.createWriteStream(filename.slice(0, -4) + '_inject.txt', {'flags': 'w'});

let index = 0;
var dict = {};
let buffer = [];
let buffering = false;

function replaceString(string) {
  let variable = '%%' + index + '%%';
  let match = string.match(/[^「」]+/);
  if (match === null) {
    return string;
  } else {
    match = match[0];
  }
  let key = containsValue(match);
  let newString = '';
  if (key) {
    // Already contains this string
    newString = string.replace(match, key);
  } else {
    // doesn't contain
    dict[variable] = match;
    newString = string.replace(match, variable);
    index++;
  }
  return newString;
}

function containsValue(string) {
  let index = Object.keys(dict).map(key => dict[key]).indexOf(string);
  if (index > -1) {
    return Object.keys(dict)[index];
  } else {
    return null;
  }
}

readStream.on('line', function(line) {
  if (buffering) {
    // buffering mode to catch multi-line dialogue and squash into one line
    if (line.endsWith('」')) {
      buffering = false;

      buffer.push(line);
      let string = buffer.join('');
      buffer = [];
      let newString = replaceString(string);
      writeStream.write(newString + '\n');
    } else if (keywords.some(keyword => line.startsWith(keyword))) {
      // If buffering and keyword found, we were probably buffering a choice
      buffering = false;

      for (let i = 0; i < buffer.length; i++) {
        let vals = buffer[i].split(',');
        let string = vals[0];
        if (string.startsWith('CO ')) {
          string = 'CO ' + replaceString(string.substring(3));
        } else {
          string = replaceString(string);
        }
        writeStream.write(string + ',' + vals[1] + '\n');
      }
      buffer = [];
      writeStream.write(line + '\n');
    } else {
      buffer.push(line);
    }
  } else {
    if (line.startsWith('「')) {
      if (line.endsWith('」')) {
        // i.e. one line dialogue
        let newString = '';
        if (line === '「 」') {
          newString = line;
        } else {
          newString = replaceString(line);
        }
        writeStream.write(newString + '\n');
      } else {
        buffer.push(line);
        buffering = true;
      }
    } else if (line.startsWith('CO')) {
      buffer.push(line);
      buffering = true;
    } else {
      let found = false;
      if (line === '' || line === '\uFEFF') {
        found = true;
      } else if (keywords.some(keyword => line.startsWith(keyword))) {
        found = true;
      }

      let newLine = line;
      if (!found) {
        if (line.startsWith('ST')) {
          // special case for title
          // format is 'ST 第1話,めんどくさいからやらないよー！'
          if (line !== 'ST  ') {
            let arr = line.substring(3).split(',').map(str => replaceString(str));
            newLine = 'ST ' + arr.join(',');
          }
        } else {
          newLine = replaceString(line, index);
        }
      }

      writeStream.write(newLine + '\n');
    }
  }
});

readStream.on('close', function () {
  fs.writeFileSync(filename.slice(0, -4) + '.json', JSON.stringify(dict, null, 4));
  writeStream.end();
});
