#!/bin/bash
bc19compile -f -d ./bots/psuteam7bot/ -o ./projectUtils/psuteam7botCompiled.js
node ./projectUtils/unitTestPrep.js
nyc --reporter=lcov --reporter=text-lcov node_modules/.bin/mocha