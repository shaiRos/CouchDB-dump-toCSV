// Similar to survey monkey export of ROWS values
// takes in array of json (with the question as keys and answers as values) and converts answers to rows in csv file

// questions with subquestions (represented as nested objects in input file) will be expanded to multiple columns

// arg1: input  ex: ./inputfile.json
// arg2: output name   ex: 'output.csv'
const args = process.argv.slice(2);
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
var dataJson = require(args[0]);
let keyss = []
let subkeys = []
let keysMapping = {}

convertData();


// rows are in an array [] and as objects inside
function convertData() {
  var value = "\uFEFF";
  data = dataJson;
  let entriesKeyValArr = []
  data.forEach(docInfo => {
    entriesKeyValArr.push(getEntryKeyValuesArray(docInfo))
    
  })

  let row1MainKeys = []
  let row2SubKeys = []
  // make row 1 
  Object.keys(keysMapping).forEach(mainKey => {
    if (keysMapping[mainKey].length == 0) { // no subkeys
      row1MainKeys.push(mainKey)
      row2SubKeys.push("")
    } else {
      keysMapping[mainKey].forEach((subk,idx) => {
        if (idx == 0) row1MainKeys.push(mainKey)
        else row1MainKeys.push("")
        row2SubKeys.push(subk)
      })
    }
  })


  // add row headings first
  value += row1MainKeys.map(d => (('"' + (d + "").replace(/("|“)/g,'""').replace(/(\r\n|\n|\r)/gm,"") + '"'))).join(',') + "\n"
  value += row2SubKeys.map(d => (('"' + (d + "").replace(/("|“)/g,'""').replace(/(\r\n|\n|\r)/gm,"") + '"'))).join(',') + "\n"

  let currentMainKey = ""
  data.forEach(docInfo => {
    let thisRowStr = []
    row1MainKeys.forEach((maink,i) => {
      if (maink != "") currentMainKey = maink 
      if (row2SubKeys[i] === "") thisRowStr.push(docInfo[currentMainKey] != undefined ? docInfo[currentMainKey] : "")  // access value directly, no subkeys
      else {  // has subkeys
        if (Array.isArray(docInfo[currentMainKey])) {
          if (docInfo[currentMainKey].includes(row2SubKeys[i])) {
            thisRowStr.push(row2SubKeys[i])
          } else {
            thisRowStr.push("")
          }
        }
        else if (docInfo[currentMainKey]?.hasOwnProperty(row2SubKeys[i])) {
            thisRowStr.push(docInfo[currentMainKey][row2SubKeys[i]])
        } else {
          thisRowStr.push("")
        }
      }
    })
    value += thisRowStr.map(d => (('"' + (d + "").replace(/("|“)/g,'""').replace(/(\r\n|\n|\r)/gm,"") + '"'))).join(',') + "\n"
  })

  fs.writeFileSync(args[1], value);
  console.log('done! Output file: \n' + args[1])
}

function getEntryKeyValuesArray(obj) {
  let keysArr = []
  for (let [key,val] of Object.entries(obj)) {
    // keep track of keys names in the entries
    if (!Object.keys(keysMapping).includes(key)) {
      keysMapping[key] = []
    }

    let objKeyVal = {} 
    if (Array.isArray(val)) {  // array, make into object 
      let subKeyObj = {}
      // record subkeys in keymapping arrays 
      for (subK of val)  {
        subKeyObj[subK] = subK
        if (!keysMapping[key].includes(subK)) keysMapping[key].push(subK)
      }
      objKeyVal[key] = subKeyObj
    }
    else if (typeof val === "object") {
      objKeyVal[key] = val
      // record subkeys in keymapping arrays 
      Object.keys(val).forEach(v => {
        if (!keysMapping[key].includes(v)) keysMapping[key].push(v)
      })
    } 
    else {
      objKeyVal[key] = val
    }
    keysArr.push(objKeyVal)
  }
  return keysArr
}
