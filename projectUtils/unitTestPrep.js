/**
 * unitTestPrep.js
 * 
 * Script that checks for compiled version of our robot and appends a list of exports.
 * Goal is to ensure that the compiled file can be required so all components therein 
 * (i.e. all the .js files in our bot directory) can be exported for testing. Expectation
 * is that exportable object is named the same as the file. 
 * E.g. If a file is called 'pilgrim.js', the 'pilgrim.js' file is exporting an object named
 * 'pilgrim' with a line of code like "export default pilgrim";
 */

const fs = require('fs');
const compiledCodePath = 'projectUtils/psuteam7botCompiled.js';

//Check if compiled code exists, exit if not
if(!fs.existsSync(compiledCodePath)) {
    console.log("Error - Bot code has not been compiled into single module. Please compile before running script");
    process.exit(1);
}

//Find all files in bot directory
fs.readdir('bots/psuteam7bot', function(err, files) {
    let outputToWrite = '';
    let stringifiedNames = '';

    if(err) {
        console.log(err);
        process.exit(1);
    }

    //For each file name, add to stringified list of exported objects
    for(let i = 0; i < files.length; i++) {
        //If file is robot.js, need to export "MyRobot" specifically as distinct class name
        if (files[i] === 'robot.js') {
            stringifiedNames += 'MyRobot';
        //Otherwise, just append filename without '.js' extension, as name should match exported object name
        } else {
            stringifiedNames += files[i].replace(/.js$/, '');
        }
        //Comma seperators for list, except for last item
        if (i != (files.length -1)) {
            stringifiedNames += ',';
        }
    }

    //Create string line representing module.exports being set to all exported objects
    //Should now be of form "module.exports = {object1, object2, pbject3, ...};"
    //
    outputToWrite = '\nmodule.exports = {' + stringifiedNames + '};'

    fs.appendFile(compiledCodePath, outputToWrite, function(err) {
        if(err) {
            console.log(err)
        }
        process.exit(1);
    });
});