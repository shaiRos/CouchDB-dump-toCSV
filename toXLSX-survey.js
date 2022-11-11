// Similar to survey monkey export of ROWS values

// takes in array of json and lists each question into multiple tabs in excel workbook 
// retrieves numbers and percentages of questions with multiple choices

// keys have to have the string "question" and will not include headings that have "Comment"

/*
supports values:
  multiple values in array (expanded to multiple columns)
  Subquestions in Object 
  up to 3 deep nested questions
*/

// arg1: input  ex: ./input.json
// arg2: output name   ex: "./output/outputFile.xlsx"  // can specify path directory
const args = process.argv.slice(2);

var dataJson = require(args[0]);
var XLSX = require("xlsx");
const fs = require('fs');
Array.prototype.groupBy = function(field){
    let groupedArr = [];
    this.forEach(function(e){
      //look for an existent group
      let group = groupedArr.find(g => g['field'] === e[field]);
      if (group == undefined){
        //add new group if it doesn't exist
        group = {field: e[field], groupList: []};
        groupedArr.push(group);
      }
      //add the element to the group
      group.groupList.push(e);
    });
    
    return groupedArr;
  }

var workbook = XLSX.utils.book_new();


let data = dataJson 
let questionKeys = []
// get all questions' keys in json data
data.forEach(dataRow => {
    let keys = Object.keys(dataRow) 
    for (let keyName of keys) {
        if (keyName.includes("question") && !keyName.includes("Comment") && !questionKeys.includes(keyName)) questionKeys.push(keyName)
    }
})

// prepare worksheets for each question
for (let keyName of questionKeys) {
    
    var ws_data = [[]]
    ws_data.push(["Answer Choices","Responses"])
    
    let totalRows = data.length
    let totalAnswered = 0
    let totalSkipped = 0
    
    // if array of selected values (multi selected answer)
    if (Array.isArray(data[0][keyName])) {
        let valuesCount = {}
        data.forEach(dataRow => {
            if (dataRow.hasOwnProperty(keyName) && dataRow[keyName]?.length > 0) {
                totalAnswered += 1
                for (const val of dataRow[keyName]) {
                    valuesCount[val] = valuesCount[val] ? valuesCount[val] + 1 : 1;
                }
            } else {
                // no answer, skipped
                totalSkipped += 1
            }
        })
    
        for (const [keyVal, count] of Object.entries(valuesCount)) {
            let percentageFloat = Math.round((((count / totalRows) * 100) + Number.EPSILON) * 100) / 100
            let percentage = percentageFloat + "%"
            ws_data.push([keyVal,percentage,count]) 
        }
        // appened totals summary 
        ws_data.push(["", "Answered", totalAnswered])
        ws_data.push(["", "Skipped", totalSkipped])
    
    // if question has subquestions
    } else if (typeof (data[0][keyName]) === 'object') {
        let valuesCount = {}
        data.forEach(dataRow => {
            if (dataRow.hasOwnProperty(keyName)) {
                totalAnswered += 1
                for (const[keyVal,val] of Object.entries(dataRow[keyName])) {
                    valuesCount[keyVal] = "";
                }
            } else {
                // no answer, skipped
                totalSkipped += 1
            }
        })
        let groupByKeyValues = {}
        for (var keyVal of Object.keys(valuesCount)) {
            groupByKeyValues[keyVal] = data.map(d => d[keyName]).filter(d => d!=undefined).groupBy(keyVal)
        }
    
        let subFieldColumns = {}
        let fields = Object.values(groupByKeyValues).flat().map(g => g.field).filter(d => d != undefined)
        fields.forEach(f => {       // initialize rows array tracking for this column
            subFieldColumns[f] = {}
        })
        let subFieldColumnOrder = Object.keys(subFieldColumns)
        let subFieldHeadingRow = [""]
        subFieldColumnOrder.forEach(s => {
            subFieldHeadingRow.push(s)  // percentage column 
            subFieldHeadingRow.push("") // total counts column
        })
        ws_data.push([...subFieldHeadingRow,"Answered","Skipped"]) 
        for (const [keyVal,groupedValues] of Object.entries(groupByKeyValues)) {
            var ws_row = [keyVal]
            // get subField names for heading row 
            subFieldColumnOrder.forEach(sField => {
                let thisFieldGroup = groupedValues.find(g => g.field === sField)
                if (thisFieldGroup) {
                    let percentageFloat = Math.round((((thisFieldGroup.groupList.length / totalRows) * 100) + Number.EPSILON) * 100) / 100
                    let percentage = percentageFloat + "%"
                    ws_row.push(percentage)
                    ws_row.push(thisFieldGroup.groupList.length)
                } else {    // doesn't have this subfield
                    ws_row.push("")
                    ws_row.push("")
                }
            })
            // get count for those who those who answered/skipped question 
            let answeredCount = 0
            let skippedCount = 0
            groupedValues.forEach(g => {
                if (g.field != undefined) answeredCount += g.groupList.length
                else skippedCount += g.groupList.length
            })
            ws_row.push(answeredCount)
            ws_row.push(skippedCount + totalSkipped)
    
    
            ws_data.push(ws_row) 
            let subFieldNames = [] 
    
        }
    } else {
        // if single valued data
        let groupByQuestion = data.groupBy(keyName) // group values to see if answers are similar in terms of categories
        if (groupByQuestion.length <= 10) {     // kinda sketch but if similar answers are more than 10 then assume answer values are not grouped
            groupByQuestion.forEach(group => {
                if (group.field == undefined) totalSkipped += group.groupList.length 
                else {
                    totalAnswered += group.groupList.length
                    let percentageFloat = Math.round((((group.groupList.length/totalRows) * 100) + Number.EPSILON) * 100) / 100
                    let percentage = percentageFloat + "%"
                    ws_data.push([group.field,percentage,group.groupList.length]) 
                }
            })
            
            // appened totals summary 
            ws_data.push(["","Answered",totalAnswered])
            ws_data.push(["","Skipped",totalSkipped])
        } else {
            // generic open ended question 
            var ws_data = [[]] 
            data.forEach(d => {
                if (d[keyName] != undefined) {
                    totalAnswered += 1
                } else totalSkipped += 1
            })
            ws_data.push(["Answered",totalAnswered])
            ws_data.push(["Skipped",totalSkipped])
        }

    }
    
    // parse ws data to worksheet object and append worksheet to workbook
    var ws = XLSX.utils.aoa_to_sheet(ws_data)
    XLSX.utils.book_append_sheet(workbook, ws, keyName);

}    

// write file once finished
XLSX.writeFileXLSX(workbook, args[1]);
console.log('done! Output file: \n' + args[1])


// counts identical values in array
function countValuesInArray(arr) {
    let valCount = {}
    for (const val of arr) {
        valCount[val] = valCount[val] ? valCount[val] + 1 : 1;
    }
    return valCount
}


