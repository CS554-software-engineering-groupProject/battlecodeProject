# battlecodeProject

## Instructions from BattleCode site for installation:
1. Install npm.
2. `npm install -g bc19`.
3. Run or compile your code using bc19run or bc19compile. Note that the bot code needs to be in its own directory. Example: `bc19run -b bots/psuteam7bot -r bots/psuteam7bot --chi 1000`.
4.  Upload compiled code using bc19upload. Make sure you've defined environment variables BC_USERNAME and BC_PASSWORD, which should be the credentials you use to access this site.

## Testing:
0. Fetch origin and `npm install` or `npm update`.
2. Check for battlecode update - `npm install -g bc19`.
3. the number after `--chi` is the number of turns of the game, edit it to a smaller value for a quicker game.
4. `bc19run -b bots/psuteam7bot -r bots/donothingbot --chi 1000`.
5. A `replay.bc19` file should be created in the project folder, you can upload it to [http://battlecode.org/dash/replay](http://battlecode.org/dash/replay) by drag-and-drop (Need to be precise on the text) to view the game visually.

## Testing vs reference bot:
0. Fetch origin and npm install or npm update.
1. Check for battlecode update - `npm install -g bc19`.
2. the number after `--chi` is the number of turns of the game, edit it to a smaller value for a quicker game.
3. `bc19run -b bots/psuteam7bot -r bots/examplefuncsplayer --chi 1000`.
4. A `replay.bc19` file should be created in the project folder, you can upload it to [http://battlecode.org/dash/replay](http://battlecode.org/dash/replay) by drag-and-drop (Need to be precise on the text) to view the game visually.