#!/bin/bash
bc19compile -f -d ./bots/psuteam7bot/ -o ./projectUtils/psuteam7botCompiled.js
node ./projectUtils/unitTestPrep.js
nyc node_modules/.bin/mocha