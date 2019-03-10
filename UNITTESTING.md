# UNITTESTING.md

File to hold instructions, tips, tricks, and general notes on unit testing

## Overview
1. Run `npm install` or `npm update`.
1. Check for battlecode update - `npm install -g bc19`.
1. Run `npm test` if you have a bash shell or `npm wintest` if you are running on Windows

## Details
After updating your dependancies, running the command `npm test` runs a custom script which does three things. (Note: `npm wintest` does similar things using the `wintest.bat` file)
1. Compiles all our bot code in the `bots/psuteam7bot` into a single file, located at `projectUtils/psuteam7botCompiled.js`.
1. Runs another script which appends the line `module.exports = {MyRobot, pilgrim, castle,...}` to the end of the compiled file. This allows all files to be exported as Node modules which can be understood and utilized by Mocha, our testing framework.
1. `mocha` is run and will test everything in the `test` folder. A test coverage report courtesy of `nyc` will be added at the end of the test.
1. If you are looking for specific line-by-line assessment of which lines are executed by testing, alter the last line in `test_script.sh` to `nyc --coverage=lcov node_modules/.bin/mocha` before running the test. After running, a `coverage` folder will be created in the project directory. Go to `coverage/lcov-report/index.html` to see line-by-line information about what is executed during testing (does not mean that line is properly tested, just that it is run).

## Unit Testing Tips/Tricks

1. For all tests, you need `require('../projectUtils/psuteam7botCompiled.js)` to get access to all methods. From there, you can select certain files/units to test, e.g:
```
const MyRobot = require('../projectUtils/psuteam7botCompiled.js).MyRobot   //Gets export of MyRobot class
const pilgrim = require('../projectUtils/psuteam7botCompiled.js).pilgrim   //Gets export of pilgrim.js file
const movement = require('../projectUtils/psuteam7botCompiled.js).movement //Gets export of movement.js file
```
2. Use the `skip` or `only` attributes in a test to ignore certain tests or focus on a single set of tests. For example `describe.only` will only run the `it` blocks it contains even if there are multiple tests in different files. This is useful as test base grows to focus on certain test results.
3. For this project, we have created a mock testing framework called `mockBC19` which simulates functionality for an entire game. See the [the mockBC19 framework](#mockBC19) for more details on how tests should be run
4. In setting up test scenarios, the best current way is to create a `new MyRobot()` and adjust it's property values. For example, to create a pilgrim with 10 fuel , you could do something like
```
const myBot = new MyRobot();
myBot.me.fuel = 10
```
This works because we are normally passing in a `MyRobot` object into the arguements for most actions, or using a subset of the properties for a test. 
5. Once a test is setup, you can also check specific `MyRobot` properties for an expected value, such as `expect(myBot.me.fuel).to.equal(10)` if you want to ensure that the unit is a pilgrim.
6. If you are trying to ensure that a function returns the expected robot function, such as `mine()`, `move(dx, dy)`, or `buildUnit(unit, dx, dy)`, note the following. These methods return an object where `action` is equal to the name of the function and each parameter is associated to what is passed in. Example:
```
const returnValue = self.buildUnit(2, 1, 1);
//returnValue should equal:
{
    action: 'buildUnit',
    unit: 2,
    dx: 1,
    dy: 1
}
//Test that action is 'buildUnit'
expect(returnValue.action).equals('buildUnit);
//Test that it has a property called 'unit'
expect(returnValue).to.be.have.property(unit);
//Test that it has a property 'dx' which is equal to 1
expect(returnValue).to.be.have.property(dx, 1);

```

## mockBC19

For this project, we implemented a mock framework/class named `mockBC19` that simulates the functionality of a real Battlecode game and is located in the `projectUtils/mockGame.js` file. This allows for simpler and more thorough testing of multi-bot interactions, exchange of communication information, or interaction with maps that depend on other bots. For common uses and advanced functionality, read on:

### Bot Creation

#### createNewRobot(bot, x, y, team, unit)
Creates a new bot on the map at the input coordinates and sets the team and unit properties for that bot to the input value. Because of the way the framework/Javascript is designed, you can pass in a `MyRobot()` object in as a bot and it will be constantly updated if map adjustments or new bots in the game are introduced, meaning it can see other bots/map information properly. Attributes for `MyRobot()` can also be set as necessary, although adjusting game-specific properties like `MyRobot.me` or `MyRobot.map` will only be recognized by that bot and not reflect the game state. 

#### removeAllBots(unit) 
Removes all bots of the input unit from the game, or all bots in the game if no unit is inserted. Maps are updated to reflect the removed bots

#### getBotsInGame(unit)

Get all bots of the input unit currently in the game. Specifically, returns an array of references to the `MyRobot` objects passed into the `createNewRobot` method. 

### Map Management

#### initEmptyMaps(size)

Create a game with blank maps of the input size. In other words, every tile is passable and there are no fuel or karbonite depots on the blank map. Invoking this method will destroy the old map and remove any bots created from the game (the objects themselves will not be deleted, just hte references to them that the mock game stores internally)

#### alterMap(mapName, alterations)
Changes an input map (`map`, `fuel_map`, or `karbonite_map`) based on an array of alterations. Alterations are objects of the form `{x: foo, y: bar, value:boolean}` which reflects the new status of that tiles in the altered map. Altering the `map` to impassable terrain (i.e. `value: false` in the alteraion for that tile) will remove any bots and change the `fuel_map` and `karbonite_map` values to false.


### Communiction Methods

#### _setCommunication(BCAbsBot)
Method that updates the game with the `castle_talk`, `signal`, and `signal_radius` values of the input `MyRobot` object. Necessary to call so other bots in the game can see these properties if they need to check them. For example, if checking that a castle has sent a certain `castle_talk` value, do something like:
```
const mockGame = new mockBC19();
const myChurch = new MyRobot();
mockGame.createNewRobot(myChurch, 0, 0, 0, 0);
myChurch.castle_talk = 100;
mockGame._setCommunication(myChurch);
```

### Advanced Functionality
Finally, there are additional unit testing methods that can be utilized. We imported the [Sinon JS](https://sinonjs.org/) mock framework for stubs and spies. To utilize these methods create a new `mockBC19` object by passing in the relative path to the compiled file created for testing (likely this will be `'../projectUtils/psuteam7botCompiled.js'`). This allows the mock framework to know which modules it needs to stub/spy. From there you can create stubs or spies as necessary.

#### replaceMethod(moduleName, methodName, replacementFunc)
This will create a stub for the `methodName` of `moduleName`and return the `replacementFunc` if there is one. For example, if you want to stub `movement.getDistance` and just return 3 every time, do `replaceMethod('movement', 'getDistance', function() { return 3; })`. This method also returns a Sinon `stub` object, so you can use the [additional functionality](https://sinonjs.org/releases/v7.2.7/stubs/) as desired by manipulating the return value. As an  example:
```
let stubGetDistance = replaceMethod('movement', 'getDistance');
stubGetDistance.withArgs({x: 1, y: 1}).returns(3);
```

#### trackMethod(moduleName, methodName)
This will create a spy for the `methodName` of `moduleName`. This method also returns a Sinon `spy` object, so you can use the [additional functionality](https://sinonjs.org/releases/v7.2.7/spies/) as desired by manipulating the return value. As an  example:
```
let spyGetDistance = trackMethod('movement', 'getDistance');
expect(spyGetDistance.getCallCount).equals(2);
```