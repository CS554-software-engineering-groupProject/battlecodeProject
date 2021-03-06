const Game = require('bc19/game.js');
const ColdBrew = require('bc19');
const sinon = require('sinon');

class mockBC19 {
    /**
     * Slightly more advanced constructor
     * 
     * @param {String} modules String representing path from directory to any modules you wish to import for mocking purposes
     */
    constructor(modules) {
        this.modules = null;
        this.sandbox = null;
        if(modules !== undefined) {
            this.modules = require(modules);
            this.sandbox = sinon.createSandbox();
        }
        this.game = new Game(0, 100, 20);
        this.robotObjects = [];
        //Create and add BCAbstractRobot shells for all castles in the game
        this.game.robots.forEach(bot => {
            const abstractBotShell = {me: bot}
            this._updateState(abstractBotShell);
            this.robotObjects.push(abstractBotShell);
        })
    }

    /**
     * Helper function to update the state of a BCAbstractRobot when the game state changes
     * 
     * @param {*} BCAbsBot BCAbstractRobot object - REQUIRES THAT `BCAbsBot.me` IS SET
     */
    _updateState(BCAbsBot) {
        /*Duplicates behavior that sets state - a little weird because they insulate with strings, which needs 
          to be unparsed back into JSON object. Process ensures map, shadow, etc. properly configured with game
          at the time this method is invoked*/
        const stateString = this.game.getGameStateDump(BCAbsBot.me).replace('robot._do_turn(', '').replace(');', '');
        const game_state = JSON.parse(stateString);
        
        BCAbsBot._bc_game_state = game_state;
        BCAbsBot.id = game_state.id;
        BCAbsBot.karbonite = game_state.karbonite;
        BCAbsBot.fuel = game_state.fuel;
        BCAbsBot.last_offer = game_state.last_offer;
        BCAbsBot.map = this.game.map;
        BCAbsBot.karbonite_map = this.game.karbonite_map;
        BCAbsBot.fuel_map = this.game.fuel_map;
    }

    /**
     * Helper function to update the state of all bots. Necessary during creation so order of creation does not matter
     */
    _updateBotReferences() {
        for(let i = 0; i < this.robotObjects.length; i++) {
            this._updateState(this.robotObjects[i]);
        }
    }

    /**
     * Method to take a BCAbstractRobot object and update the game's record of this bot with its communication information.
     * Necessary because the game refers to a simplified `robot` object which does not reference `BCAbstractRobot.me` inherently
     * and does not automatically adjust when bot adjusted.
     * 
     * @param {*} BCAbsBot BCAbstractRobot passed in to update the corresponding `robot` object in `this.game`
     */
    _setCommunication(BCAbsBot) {
        const gameBot = this.game.getItem(BCAbsBot.me.id);
        gameBot.signal = BCAbsBot.me.signal;
        gameBot.signal_radius = BCAbsBot.me.signal_radius;
        gameBot.castle_talk = BCAbsBot.me.castle_talk;
        this._updateBotReferences();
    }

    /**
     * Method to create a robot from scratch based on inputs and shell of full robot passed in as parameter
     * 
     * @param {Object} bot  MyRobot/BCAbstractRobot object shell to pass in so method knows what to fill in with proper data 
     * @param {int} x       Starting x-coordinate
     * @param {int} y       Starting y-coordinate
     * @param {int} team    Team number
     * @param {int} unit    Unit number
     * @return {Object}     Returns a modified version of the input `bot`, including map  
     */
    createNewRobot(bot, x, y, team, unit) {
        bot.me = this.game.createItem(x, y, team, unit);
        this.game.initializeRobot();
        this.robotObjects.push(bot); //keep track of bots in use
        this._updateBotReferences(bot); //Update game state for all bots
        //No return since bot passed in is altered as an object
    }
    

    /**
     * Method to delete all robots or all robots of a specific unit type from the game if a type integer is passed in
     * 
     * @param {?int} unit Optional unit integer value of units to remove. Otherwise, removes all bots from game
     */
    removeAllBots(unit) {
        let i = 0;
        //Delete bots from game
        const toDelete = unit !== undefined ? this.game.robots.filter(bot => { return bot.unit == unit}) : this.game.robots.slice(0);
        for(let i = 0; i < toDelete.length; i++) {
            this.game._deleteRobot(toDelete[i]);
            
        }
        //Delete full bot references in mock
        const refsToDelete = unit !== undefined ? this.robotObjects.filter(bot => { return bot.me.unit == unit}) : this.robotObjects.slice(0);
        for(let i = 0; i < refsToDelete.length; i++) {
            this.robotObjects.splice(refsToDelete.indexOf(refsToDelete[i]), 1);
            
        }
        this._updateBotReferences();

        return this;
    }

    /**
     * Method to get all bots in the game that match the input unit value, or all bots if not unitValue provided
     * @param {int} unitValue Integer number associated with unit type
     * @return                Array of bots in game
     */
    getBotsInGame(unitValue) {
        if(unitValue === undefined) {
            return this.robotObjects;
        } else {
            return this.robotObjects.filter(bot => {
                if(bot.hasOwnProperty("me")) {
                    return unitValue === bot.me.unit;
                } else {
                    return unitValue === bot.unit;
                }
            });
        }
    }

    /**
     * Method that will destroy any existing map information/bots a create fresh new NxN maps based on input. Note that:
     * <ul>
     * <li>`map` will be set to all passible terrain</li>
     * <li>`karbonite_map` will be all false (i.e. no karbonite depots) </li>
     * <li>`fuel_map` will be all false (i.e. no fuel depots)</li>
     * <li>Any bots on an existing map will be erased from the game, meaning any references to in-game bots will no longer alter the game state</li>
     * </ul>
     * Thus, this method is best used as a very first step during the testing process
     * 
     * @param {int} size  Dimension of map
     * @return {mockBC19} Returns self for chaining purposes
     */
    initEmptyMaps(size) {
        //Taken directly from `bc19/game.js` code for consistency
        function makemap(contents,w,h) {
            var arr = new Array(h);
            for (var i=0; i<h; i++) {
                arr[i] = new Array(w);
                for (var j=0; j<w; j++) arr[i][j] = contents;
            } 
            return arr;
        }
        this.removeAllBots();
        this.game.shadow = makemap(0, size, size);
        this.game.map = makemap(true, size, size);
        this.game.karbonite_map = makemap(false, size, size);
        this.game.fuel_map = makemap(false, size, size);
        this._updateBotReferences();
        return this;
    }



    /**
     * Method to make specific tweaks to a map. If the `map` is changed, any locations set to impassible terrain will override
     * any existing elements at that location, meaning any resource depots or bots on that location will be destroyed
     * 
     * @param {String} mapName            String name of map to alter (`map`, `karbonite_map`, `fuel_map`);
     * @param {Array<Object>} alterations Array of objects corresponding to transformations to make. Alterations should be
     *                                    styled as `{x: foo, y: bar, value: bar}` where the desired alteration is
     *                                    `map[y][x] = value` and value is a boolean
     * @return {Array}                    Returns the map that was altered
     */
    alterMap(mapName, alterations) {
        const map = this.game[mapName];
        alterations.forEach(element => {
            if(typeof element.value !== "boolean") {
                throw "Error - map alterations must provide boolean value"
            } else if (element.x < 0 || element.x >= map.length) {
                throw "Error - x-coordinate for map alteration must be between 0 and " + map.length;
            } else if (element.y < 0 || element.y >= map.length) {
                throw "Error - y-coordinate for map alteration must be between 0 and " + map.length;
            }
            if(mapName === 'map') {
                if(element.value == false) {
                    const botId = this.game.shadow[element.y][element.x]
                    this.game.karbonite_map[element.y][element.x] = false;
                    this.game.fuel_map[element.y][element.x] = false;
                    if(botId > 0) {
                        this.game._deleteRobot(this.game.getItem(botId));
                    }
                }
            }
            map[element.y][element.x] = element.value
        });
        this._updateBotReferences();

        return map;
    }

    /**
     * Function that stubs a method for a given module with a substitute function. In other words, allows 
     * you to replace the functionality of a method with whatever you like for testing purposes. For example,
     * let's say you wanted to avoid the implementation of `aStarPathFinding` and just have it set `self.path`
     * when invoked. You could do:
     *      `replaceMethod('movement', 'aStarPathfinding', function(bot) => { bot.path = [...] })`
     * As another example, lets say you want a specific function to always return a certain value during a testing call,
     * like `isPassable` to always be true. Then you could do something like:
     *      `replaceMethod('movement', 'isPassable', function() => { return true; })`
     * Lots of different way to use this; most are probably unnecessary for scope of this project
     * 
     * @param {*} moduleName      String representing module/file in which the method resides
     * @param {*} methodName      String representing name of method whose execution is to be replaced
     * @param {*} replacementFunc Function that will be executed in place of the stubbed method. If not function passed,
     *                            generic `Sinon` stub is returned (this can be manipulated as desired, but probably
     *                            more advanced than necessary)
     * @return {Object}           Returns a `Sinon` stub object. See online SinonJS documentation for more details. 
     */
    replaceMethod(moduleName, methodName, replacementFunc) {
        if(moduleName === undefined || methodName === undefined) {
            throw "Module and method names required"
        } else if (this.modules == null) {
            throw "Need reference to modules"
        } else if (this.modules[moduleName] === undefined) {
            throw "Module '" + moduleName + "' not recognized";
        } else if (this.modules[moduleName][methodName] === undefined) {
            throw "Method '" + methodName + "' in module '" + moduleName + "' not recognized";
        } else if (replacementFunc === undefined) {
            return this.sandbox.stub(this.modules[moduleName], methodName);
        } else {
            return this.sandbox.stub(this.modules[moduleName], methodName).callsFake(replacementFunc);
        }
    }

    /**
     * Function that spys a method for a given module. Using the spy object of `SinonJS`, can track how many times
     * a method is called, whether a method was called with certain arguments, etc. Lots of different way to use this,
     * most are probably unnecessary for scope of this project
     * 
     * @param {*} moduleName      String representing module/file in which the method resides
     * @param {*} methodName      String representing name of method whose execution is to be replaced
     * @return {Object}           Returns a `Sinon` spy object. See online SinonJS documentation for more details. 
     */
    trackMethod(moduleName, methodName) {
        if(moduleName === undefined || methodName === undefined) {
            throw "Module and method names required"
        } else if (this.modules == null) {
            throw "Need reference to modules"
        } else if (this.modules[moduleName] === undefined) {
            throw "Module '" + moduleName + "' not recognized";
        } else if (this.modules[moduleName][methodName] === undefined) {
            throw "Method '" + methodName + "' in module '" + moduleName + "' not recognized";
        } else {
            return this.sandbox.spy(this.modules[moduleName], methodName);
        }
    }

    /**
     * Function to undo any spies/stubs/other mock Sinon objects created during testing. Recommended to call
     * this at conclusion of tests that use Sinon functionality of this class.
     */
    undoSinonMethods() {
        this.sandbox.restore();
    }

}

/*const mock = new mockBC19('../projectUtils/psuteam7botCompiled.js');
console.log(mock.modules)
const mock = new mockBC19();

mock.getBotsInGame(0).forEach(bot => {
    console.log(bot.me.id)
    console.log(bot.me.unit)
    console.log(bot.me.team)
    console.log(bot.me.x)
    console.log(bot.me.y)
})

mock.createNewRobot({}, 1,1,0,2);*/
/*console.log(mock.game.shadow)
const alterations = [
    {x: 0, y: 0, value: false},
    {x: 0, y: 1, value: true},
    {x: 1, y: 0, value: true},
    {x: 2, y: 0, value: false},
    {x: 0, y: 2, value: false},
    {x: 1, y: 1, value: false},
    {x: 2, y: 2, value: true}
];
mock.alterMap("map", alterations);
console.log(mock.game.shadow)*/

module.exports = mockBC19;