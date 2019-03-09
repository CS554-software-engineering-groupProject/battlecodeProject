call bc19compile -f -d bots\psuteam7bot -o projectUtils\psuteam7botCompiled.js
call node projectUtils\unitTestPrep.js
call nyc node_modules/.bin/mocha