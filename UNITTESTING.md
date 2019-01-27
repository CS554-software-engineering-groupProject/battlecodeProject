## Overview
1. Run `npm install` or `npm update`.
1. Check for battlecode update - `npm install -g bc19`.
1. Run `npm test`!

## Details
After updating your dependancies, running the command `npm test` runs a custom script which does three things.
1. Compiles all our bot code in the `bots/psuteam7bot` into a single file, located at `projectUtils/psuteam7botCompiled.js`.
1. Runs another script which appends the line `module.exports = {MyRobot, pilgrim, castle,...}` to the end of the compiled file. This allows all files to be exported as Node modules which can be understood and utilized by Mocha, our testing framework.
1. Lastly, `mocha` is run and will test everything in the `test` folder

## Unit Testing Tips/Tricks

1. For all tests, you need `require('../projectUtils/psuteam7botCompiled.js)` to get access to all methods. From there, you can select certain files/units to test, e.g:
```
const MyRobot = require('../projectUtils/psuteam7botCompiled.js).MyRobot   //Gets export of MyRobot class
const pilgrim = require('../projectUtils/psuteam7botCompiled.js).pilgrim   //Gets export of pilgrim.js file
const movement = require('../projectUtils/psuteam7botCompiled.js).movement //Gets export of movement.js file
```
2. Use the `skip` or `only` attributes in a test to ignore certain tests or focus on a single set of tests. For example `describe.only` will only run the `it` blocks it contains even if there are multiple tests in different files. This is useful as test base grows to focus on certain test results.
3. In setting up test scenarios, the best current way is to create a `new MyRobot()` and adjust it's property values. For example, to create a pilgrim with id of 11 at `0, 0` on the map and initialize a 2x2 grid, you could do something like
```
const myBot = new MyRobot();
myBot.id: 10;
myBot.me = {
    unit: 2, //Identifies it as a pilgrim
    x: 0,
    y: 0
}
myBot.map = [[10,  0],
             [0 , -1]]
myBot.karbonite_map = [[0,0],
                       [1,0]];
myBot.fuel_map = [[0,1],
                  [0,0]];
```
This works because we are normally passing in a `MyRobot` object into the arguements for most actions, or using a subset of the properties for a test. However, there are obviously some tricky things that can crop up. For example, note that `karbonite_map` and `fuel_map` are a Boolean grid, while `map` has `id` values were robots exist on the map, `-1` for impassible terrain, and `0` where there is passable terrain without a unit. Thus, implementing a proper test can be messy and requires reading the docs to get a better understanding of what the values should be.

4. Once a test is setup, you can also check specific `MyRobot` properties for an expected value, such as `expect(myBot.unit).to.equal(2)` if you want to ensure that the unit is a pilgrim.
5. If you are trying to ensure that a function returns the expected robot function, such as `mine()`, `move(dx, dy)`, or `buildUnit(unit, dx, dy)`, note the following. These methods return an object where `action` is equal to the name of the function and each parameter is associated to what is passed in. Example:
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