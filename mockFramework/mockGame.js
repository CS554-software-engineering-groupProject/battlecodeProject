const Game = require('bc19/game.js');
const ColdBrew = require('bc19');

class mockBC19 {
    /**
     * Slightly more advanced constructor
     * 
     * @param {String} modules String representing path from directory to any modules you wish to import for mocking purposes
     */
    constructor(modules) {
        if(modules) {
            this.modules = require(modules);
        }
        this.game = new Game(0, 100, 20);
    }

    /**
     * Method to create a robot from scratch. Intended for only basic robot usage.
     * 
     * @param {int} x     Starting x-coordinate
     * @param {int} y     Starting y-coordinate
     * @param {int} team  Team number
     * @param {int} unit  Unit number
     * @return {Object}   Returns an object with the `robot` properties, which can be modified and affect game state 
     */
    createNewRobot(x, y, team, unit) {
        this.game.createItem(x, y, team, unit);
        return this.game.initializeRobot();
    }

    /**
     * Method to delete all robots or all robots of a specific unit type from the game if a type integer is passed in
     * 
     * @param {?int} unit Optional unit integer value of units to remove. Otherwise, removes all bots from game
     */
    removeAllBots(unit) {
        let i = 0;
        const toDelete = unit !== undefined ? this.game.robots.filter(bot => { return bot.unit == unit}) : this.game.robots.slice(0);
        for(let i = 0; i < toDelete.length; i++) {
            this.game._deleteRobot(toDelete[i]);
        }

        return this;
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
        this.game.shadow = makemap(0, size, size);
        this.game.map = makemap(true, size, size);
        this.game.karbonite_map = makemap(false, size, size);
        this.game.fuel_map = makemap(false, size, size);
        this.removeAllBots();
        return this;
    }
}


const mock = new mockBC19();
const bot = mock.createNewRobot(0, 0, 0, 2);
const bots = mock.game.robots;
console.log("ALL BOTS")
console.log(bots);
const lessBots = mock.removeAllBots();
console.log("LESS BOTS")
console.log(lessBots.game.robots)

module.exports = mockBC19;