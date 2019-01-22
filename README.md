# battlecodeProject

## Instructions from BattleCode site for installation:
1. Install npm.
2. npm install -g bc19.
3. Run or compile your code using bc19run or bc19compile. Note that the bot code needs to be in its own directory. Example: bc19run -b bots/psuteam7bot -r bots/psuteam7bot --chi 1000.
4.  Upload compiled code using bc19upload. Make sure you've defined environment variables BC_USERNAME and BC_PASSWORD, which should be the credentials you use to access this site.

## Testing:
0. Check for battlecode update - npm install -g bc19
1. the number after --chi is the number of turns of the game, enter a smaller value for a quicker game
1a. bc19run -b bots/psuteam7bot -r bots/donothingbot --chi 1000
2. A replay.bc19 file should be created in the project folder, you can upload it to battlecode.org/dash/replay by drag-and-drop to view the game visually

## Testing vs reference bot:
0. Check for battlecode update - npm install -g bc19
1. the number after --chi is the number of turns of the game, enter a smaller value for a quicker game
1a. bc19run -b bots/psuteam7bot -r bots/examplefuncsplayer --chi 1000
2. A replay.bc19 file should be created in the project folder, you can upload it to battlecode.org/dash/replay by drag-and-drop to view the game visually