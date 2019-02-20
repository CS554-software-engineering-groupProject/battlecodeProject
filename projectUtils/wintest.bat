call bc19compile -f -d bots\psuteam7bot -o projectUtils\psuteam7botCompiled.js
call node projectUtils\unitTestPrep.js
call nyc --reporter=lcov --reporter=text-lcov node_modules/.bin/mocha