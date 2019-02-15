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
        console.log(size);
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
        return map;
    }

}


const mock = new mockBC19();

mock.initEmptyMaps(6);
const maps = [
    ["karbonite", mock.game.karbonite_map],
    ["fuel", mock.game.fuel_map],
    ["map", mock.game.map],
    ["shadow", mock.game.shadow]
];
/*maps.forEach(mapInfo => {
    console.log(mapInfo[0])
    console.log(mapInfo[1]);
})*/
mock.createNewRobot(1,1,0,2);
console.log(mock.game.shadow)
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
console.log(mock.game.shadow)

module.exports = mockBC19;