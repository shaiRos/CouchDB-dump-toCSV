
var jsdom = require("jsdom");
const {
  JSDOM
} = jsdom;
const {
  window
} = new JSDOM();
const {
  document
} = (new JSDOM('')).window;
global.document = document;
var $ = jQuery = require('jquery')(window);
const fs = require('fs');
var dataJson = require('./myfile.json');

convertData();


// rows are in an array [] and as objects inside
function convertData() {
  var value = "\uFEFF";
  data = dataJson.docs;
  var keys = []
  data.forEach(docInfo => {
    Object.keys(docInfo).forEach(atr => {
      if (!keys.includes(atr)) keys.push(atr)
    })
  })
  keys.sort()
  value += keys.join(',') + "\n"
  data.forEach((docInfo,index) => {
    var values = []
    keys.forEach(atr => {
      if (docInfo[atr] != undefined) {
        var keyVal = docInfo[atr]
        if (typeof docInfo[atr] === 'object') keyVal = JSON.stringify(keyVal)
        values.push('"' + (keyVal + "").replace(/("|“)/g,'""').replace(/(\r\n|\n|\r)/gm,"") + '"')
      }
      else values.push("")
    })
    value += values.join(',') + "\n"
  })
  console.log(value)
  fs.appendFileSync('output1.csv', value);
}
