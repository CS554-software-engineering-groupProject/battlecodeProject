'use strict';

var SPECS = {"COMMUNICATION_BITS":16,"CASTLE_TALK_BITS":8,"MAX_ROUNDS":1000,"TRICKLE_FUEL":25,"INITIAL_KARBONITE":100,"INITIAL_FUEL":500,"MINE_FUEL_COST":1,"KARBONITE_YIELD":2,"FUEL_YIELD":10,"MAX_TRADE":1024,"MAX_BOARD_SIZE":64,"MAX_ID":4096,"CASTLE":0,"CHURCH":1,"PILGRIM":2,"CRUSADER":3,"PROPHET":4,"PREACHER":5,"RED":0,"BLUE":1,"CHESS_INITIAL":100,"CHESS_EXTRA":20,"TURN_MAX_TIME":200,"MAX_MEMORY":50000000,"UNITS":[{"CONSTRUCTION_KARBONITE":null,"CONSTRUCTION_FUEL":null,"KARBONITE_CAPACITY":null,"FUEL_CAPACITY":null,"SPEED":0,"FUEL_PER_MOVE":null,"STARTING_HP":200,"VISION_RADIUS":100,"ATTACK_DAMAGE":10,"ATTACK_RADIUS":[1,64],"ATTACK_FUEL_COST":10,"DAMAGE_SPREAD":0},{"CONSTRUCTION_KARBONITE":50,"CONSTRUCTION_FUEL":200,"KARBONITE_CAPACITY":null,"FUEL_CAPACITY":null,"SPEED":0,"FUEL_PER_MOVE":null,"STARTING_HP":100,"VISION_RADIUS":100,"ATTACK_DAMAGE":0,"ATTACK_RADIUS":0,"ATTACK_FUEL_COST":0,"DAMAGE_SPREAD":0},{"CONSTRUCTION_KARBONITE":10,"CONSTRUCTION_FUEL":50,"KARBONITE_CAPACITY":20,"FUEL_CAPACITY":100,"SPEED":4,"FUEL_PER_MOVE":1,"STARTING_HP":10,"VISION_RADIUS":100,"ATTACK_DAMAGE":null,"ATTACK_RADIUS":null,"ATTACK_FUEL_COST":null,"DAMAGE_SPREAD":null},{"CONSTRUCTION_KARBONITE":15,"CONSTRUCTION_FUEL":50,"KARBONITE_CAPACITY":20,"FUEL_CAPACITY":100,"SPEED":9,"FUEL_PER_MOVE":1,"STARTING_HP":40,"VISION_RADIUS":49,"ATTACK_DAMAGE":10,"ATTACK_RADIUS":[1,16],"ATTACK_FUEL_COST":10,"DAMAGE_SPREAD":0},{"CONSTRUCTION_KARBONITE":25,"CONSTRUCTION_FUEL":50,"KARBONITE_CAPACITY":20,"FUEL_CAPACITY":100,"SPEED":4,"FUEL_PER_MOVE":2,"STARTING_HP":20,"VISION_RADIUS":64,"ATTACK_DAMAGE":10,"ATTACK_RADIUS":[16,64],"ATTACK_FUEL_COST":25,"DAMAGE_SPREAD":0},{"CONSTRUCTION_KARBONITE":30,"CONSTRUCTION_FUEL":50,"KARBONITE_CAPACITY":20,"FUEL_CAPACITY":100,"SPEED":4,"FUEL_PER_MOVE":3,"STARTING_HP":60,"VISION_RADIUS":16,"ATTACK_DAMAGE":20,"ATTACK_RADIUS":[1,16],"ATTACK_FUEL_COST":15,"DAMAGE_SPREAD":3}]};

function insulate(content) {
    return JSON.parse(JSON.stringify(content));
}

class BCAbstractRobot {
    constructor() {
        this._bc_reset_state();
    }

    // Hook called by runtime, sets state and calls turn.
    _do_turn(game_state) {
        this._bc_game_state = game_state;
        this.id = game_state.id;
        this.karbonite = game_state.karbonite;
        this.fuel = game_state.fuel;
        this.last_offer = game_state.last_offer;

        this.me = this.getRobot(this.id);

        if (this.me.turn === 1) {
            this.map = game_state.map;
            this.karbonite_map = game_state.karbonite_map;
            this.fuel_map = game_state.fuel_map;
        }

        try {
            var t = this.turn();
        } catch (e) {
            t = this._bc_error_action(e);
        }

        if (!t) t = this._bc_null_action();

        t.signal = this._bc_signal;
        t.signal_radius = this._bc_signal_radius;
        t.logs = this._bc_logs;
        t.castle_talk = this._bc_castle_talk;

        this._bc_reset_state();

        return t;
    }

    _bc_reset_state() {
        // Internal robot state representation
        this._bc_logs = [];
        this._bc_signal = 0;
        this._bc_signal_radius = 0;
        this._bc_game_state = null;
        this._bc_castle_talk = 0;
        this.me = null;
        this.id = null;
        this.fuel = null;
        this.karbonite = null;
        this.last_offer = null;
    }

    // Action template
    _bc_null_action() {
        return {
            'signal': this._bc_signal,
            'signal_radius': this._bc_signal_radius,
            'logs': this._bc_logs,
            'castle_talk': this._bc_castle_talk
        };
    }

    _bc_error_action(e) {
        var a = this._bc_null_action();
        
        if (e.stack) a.error = e.stack;
        else a.error = e.toString();

        return a;
    }

    _bc_action(action, properties) {
        var a = this._bc_null_action();
        if (properties) for (var key in properties) { a[key] = properties[key]; }
        a['action'] = action;
        return a;
    }

    _bc_check_on_map(x, y) {
        return x >= 0 && x < this._bc_game_state.shadow[0].length && y >= 0 && y < this._bc_game_state.shadow.length;
    }
    
    log(message) {
        this._bc_logs.push(JSON.stringify(message));
    }

    // Set signal value.
    signal(value, radius) {
        // Check if enough fuel to signal, and that valid value.
        
        var fuelNeeded = Math.ceil(Math.sqrt(radius));
        if (this.fuel < fuelNeeded) throw "Not enough fuel to signal given radius.";
        if (!Number.isInteger(value) || value < 0 || value >= Math.pow(2,SPECS.COMMUNICATION_BITS)) throw "Invalid signal, must be int within bit range.";
        if (radius > 2*Math.pow(SPECS.MAX_BOARD_SIZE-1,2)) throw "Signal radius is too big.";

        this._bc_signal = value;
        this._bc_signal_radius = radius;

        this.fuel -= fuelNeeded;
    }

    // Set castle talk value.
    castleTalk(value) {
        // Check if enough fuel to signal, and that valid value.

        if (!Number.isInteger(value) || value < 0 || value >= Math.pow(2,SPECS.CASTLE_TALK_BITS)) throw "Invalid castle talk, must be between 0 and 2^8.";

        this._bc_castle_talk = value;
    }

    proposeTrade(karbonite, fuel) {
        if (this.me.unit !== SPECS.CASTLE) throw "Only castles can trade.";
        if (!Number.isInteger(karbonite) || !Number.isInteger(fuel)) throw "Must propose integer valued trade."
        if (Math.abs(karbonite) >= SPECS.MAX_TRADE || Math.abs(fuel) >= SPECS.MAX_TRADE) throw "Cannot trade over " + SPECS.MAX_TRADE + " in a given turn.";

        return this._bc_action('trade', {
            trade_fuel: fuel,
            trade_karbonite: karbonite
        });
    }

    buildUnit(unit, dx, dy) {
        if (this.me.unit !== SPECS.PILGRIM && this.me.unit !== SPECS.CASTLE && this.me.unit !== SPECS.CHURCH) throw "This unit type cannot build.";
        if (this.me.unit === SPECS.PILGRIM && unit !== SPECS.CHURCH) throw "Pilgrims can only build churches.";
        if (this.me.unit !== SPECS.PILGRIM && unit === SPECS.CHURCH) throw "Only pilgrims can build churches.";
        
        if (!Number.isInteger(dx) || !Number.isInteger(dx) || dx < -1 || dy < -1 || dx > 1 || dy > 1) throw "Can only build in adjacent squares.";
        if (!this._bc_check_on_map(this.me.x+dx,this.me.y+dy)) throw "Can't build units off of map.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] > 0) throw "Cannot build on occupied tile.";
        if (!this.map[this.me.y+dy][this.me.x+dx]) throw "Cannot build onto impassable terrain.";
        if (this.karbonite < SPECS.UNITS[unit].CONSTRUCTION_KARBONITE || this.fuel < SPECS.UNITS[unit].CONSTRUCTION_FUEL) throw "Cannot afford to build specified unit.";

        return this._bc_action('build', {
            dx: dx, dy: dy,
            build_unit: unit
        });
    }

    move(dx, dy) {
        if (this.me.unit === SPECS.CASTLE || this.me.unit === SPECS.CHURCH) throw "Churches and Castles cannot move.";
        if (!this._bc_check_on_map(this.me.x+dx,this.me.y+dy)) throw "Can't move off of map.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] === -1) throw "Cannot move outside of vision range.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] !== 0) throw "Cannot move onto occupied tile.";
        if (!this.map[this.me.y+dy][this.me.x+dx]) throw "Cannot move onto impassable terrain.";

        var r = Math.pow(dx,2) + Math.pow(dy,2);  // Squared radius
        if (r > SPECS.UNITS[this.me.unit]['SPEED']) throw "Slow down, cowboy.  Tried to move faster than unit can.";
        if (this.fuel < r*SPECS.UNITS[this.me.unit]['FUEL_PER_MOVE']) throw "Not enough fuel to move at given speed.";

        return this._bc_action('move', {
            dx: dx, dy: dy
        });
    }

    mine() {
        if (this.me.unit !== SPECS.PILGRIM) throw "Only Pilgrims can mine.";
        if (this.fuel < SPECS.MINE_FUEL_COST) throw "Not enough fuel to mine.";
        
        if (this.karbonite_map[this.me.y][this.me.x]) {
            if (this.me.karbonite >= SPECS.UNITS[SPECS.PILGRIM].KARBONITE_CAPACITY) throw "Cannot mine, as at karbonite capacity.";
        } else if (this.fuel_map[this.me.y][this.me.x]) {
            if (this.me.fuel >= SPECS.UNITS[SPECS.PILGRIM].FUEL_CAPACITY) throw "Cannot mine, as at fuel capacity.";
        } else throw "Cannot mine square without fuel or karbonite.";

        return this._bc_action('mine');
    }

    give(dx, dy, karbonite, fuel) {
        if (dx > 1 || dx < -1 || dy > 1 || dy < -1 || (dx === 0 && dy === 0)) throw "Can only give to adjacent squares.";
        if (!this._bc_check_on_map(this.me.x+dx,this.me.y+dy)) throw "Can't give off of map.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] <= 0) throw "Cannot give to empty square.";
        if (karbonite < 0 || fuel < 0 || this.me.karbonite < karbonite || this.me.fuel < fuel) throw "Do not have specified amount to give.";

        return this._bc_action('give', {
            dx:dx, dy:dy,
            give_karbonite:karbonite,
            give_fuel:fuel
        });
    }

    attack(dx, dy) {
        if (this.me.unit === SPECS.CHURCH) throw "Churches cannot attack.";
        if (this.fuel < SPECS.UNITS[this.me.unit].ATTACK_FUEL_COST) throw "Not enough fuel to attack.";
        if (!this._bc_check_on_map(this.me.x+dx,this.me.y+dy)) throw "Can't attack off of map.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] === -1) throw "Cannot attack outside of vision range.";

        var r = Math.pow(dx,2) + Math.pow(dy,2);
        if (r > SPECS.UNITS[this.me.unit]['ATTACK_RADIUS'][1] || r < SPECS.UNITS[this.me.unit]['ATTACK_RADIUS'][0]) throw "Cannot attack outside of attack range.";

        return this._bc_action('attack', {
            dx:dx, dy:dy
        });
        
    }


    // Get robot of a given ID
    getRobot(id) {
        if (id <= 0) return null;
        for (var i=0; i<this._bc_game_state.visible.length; i++) {
            if (this._bc_game_state.visible[i].id === id) {
                return insulate(this._bc_game_state.visible[i]);
            }
        } return null;
    }

    // Check if a given robot is visible.
    isVisible(robot) {
        return ('unit' in robot);
    }

    // Check if a given robot is sending you radio.
    isRadioing(robot) {
        return robot.signal >= 0;
    }

    // Get map of visible robot IDs.
    getVisibleRobotMap() {
        return this._bc_game_state.shadow;
    }

    // Get boolean map of passable terrain.
    getPassableMap() {
        return this.map;
    }

    // Get boolean map of karbonite points.
    getKarboniteMap() {
        return this.karbonite_map;
    }

    // Get boolean map of impassable terrain.
    getFuelMap() {
        return this.fuel_map;
    }

    // Get a list of robots visible to you.
    getVisibleRobots() {
        return this._bc_game_state.visible;
    }

    turn() {
        return null;
    }
}

const movement = {};

//Array for getting direction after rotation
movement.directions = [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: -1 }, { x: -1, y: -1 }, { x: -1, y: 0 }, { x: -1, y: 1 }];

/**
*Checks whether the x and y values of position A and B are equivalent
*Input: A - a 'position/ location' object {x, y}
*       B - a 'position/ location' object {x, y}
*Output:    retVal - true if x and y matches, false otherwise
*/
movement.positionsAreEqual = (A, B) =>{
    return (A.x === B.x && A.y === B.y);
};

/**
*Return relative position of point B from point A
*Input: A - a 'position/ location' object {x, y}
*       B - a 'position/ location' object {x, y}
*Output:    retVal - an object {x, y}, containing how many x and y steps needed from A to reach B
*/
movement.getRelativePosition = (A, B) => {
    const x = (B.x-A.x);
    const y = (B.y-A.y);
    return {x, y};
};

/**
*Return relative direction of B from point A
*Input: A - a 'position/ location' object {x, y}
*       B - a 'position/ location' object {x, y}    
*Output:    retVal - an object {x, y}, which is the relative direction of B from point A
*/
movement.getRelativeDirection = (A, B) => {
    let {x, y} = movement.getRelativePosition(A, B);

    if(x < 0)
        x = -1;
    else if(x > 0)
        x = 1;

    if(y < 0)
        y = -1;
    else if(y > 0)
        y = 1;

    return {x, y};
};

/**
*Get index of the element matching direction in directions
*Input: direction   - a 'direction' object {x, y}
*Output:    retVal  - the index of the element matching direction in directions 
*                   - OR -1 if direction has invalid x, y values
*                   - OR -2 if for loop somehow falls through
*/
movement.getDirectionIndex = (direction) => {
    let {x, y} = direction;
    if(x > 1 || x < -1 || y > 1 || y < -1)
        return -1;

    for(let i = 0; i < movement.directions.length; ++i)
    {
        if(movement.positionsAreEqual(direction, movement.directions[i]))
            return i;
    }
    return -2;
};

/**
*Get result of n-times rotation of the direction passed in
*Input: direction   - a 'direction' object {x, y}
*       n           - number of rotations can be clockwise (+ value), counter-clockwise (-value), or 0 (no movement)
*Output:    retVal  - an object {x, y}, which is one of the 'direction' element in movement.directions
*                   - (err) an object {x, y} with x value -1 and y value -1
*/
movement.rotateDirection = (direction, n) => {
    const dirsLen = movement.directions.length;
    let {x, y} = direction;
    let currIndex = null;

    if(n === 0)
        return direction;

    if(x > 1 || x < -1 || y > 1 || y < -1)
    {
        x = -1;
        y = -1;
        return {x, y};
    }

    for(let i = 0; i < dirsLen; ++i)
    {
        if(x === movement.directions[i].x && y === movement.directions[i].y)
        {
            currIndex = i;
            break;
        }
    }

    currIndex = (currIndex + n);
    while(currIndex < 0)
    {
        currIndex = currIndex + dirsLen;
    }
    currIndex %= dirsLen;
    return (movement.directions[currIndex]);
};

/**
*Return difference of x-coord and y-coord between A and B
*Input: A - a 'position/ location' object {x, y}
*       B - a 'position/ location' object {x, y}
*Output:    retVal - an object {x, y}, where x is the difference between A.x and B.x and y is the difference between A.y and B.y
*/
movement.getDistanceXY = (A, B) => {
    let {x, y} = movement.getRelativePosition(A, B);

    x = Math.abs(x);
    y = Math.abs(y);
    return {x, y};
};

/**
*Return squared straight line distance between coord A and coord B
*Squared distance as to not introduce inaccuracy, use it as relative distance
*Input: A - a 'position/ location' object {x, y}
*       B - a 'position/ location' object {x, y}
*Output:    retVal - an integer value, the squared value of the distance from A to B
*/
movement.getDistance = (A, B) => {
    return ((A.x-B.x)*(A.x-B.x)+(A.y-B.y)*(A.y-B.y));
};

/**
*Checks in which map quadrant the given coordinate is in
*Used for guessing starting/ spawning location of enemy castle, and (Advanced) influence 'Pioneer Pilgrims' decision 
*e.g. prefer building churches in enemy quadrant (steal resource, proxy church for building units closer to enemy base) or friendly quadrant (safer) - in case castle is close to midline
*Input: location    - a 'position/ location' object {x, y}
*       fullMap     - the full map, Should be self.map or or self.getPassableMap()
*Output:    retVal - an integer value, each denotes:
*               1 = Top Left
*               2 = Top Right
*               3 = Bottom Left
*               4 = Bottom Right
*/
movement.checkQuadrant = (location, fullmap) => {
    const {x, y} = location;
    const midLength = Math.ceil(fullmap.length/2);
    
    if(x < midLength)
    {
        if(y < midLength)
            return 1;
        else
            return 3;
    }
    else
    {
        if(y < midLength)
            return 2;
        else
            return 4;
    }
};

/**
*Calculate and return enemy castle's potential starting location
*Input:     myCastleLocation    -   the Castle's 'position/ location' object, should be self.me
*           fullMap             -   the full map, Should be self.map or or self.getPassableMap()
*Output:    RetVal  -   An array containing 2 {x, y} objects, One is the enemy castle mirroring myCastleLocation, 
                        and the second a position of an enemy quadrant to check if the mirror castle is destroyed
*
*TODO: Have the team's castles communicate at start of game to potentially improve accuracy. 
*Given the team's starting castles are in different quadrants, can accurately calculate location of enemy castle
*/
movement.getAttackerPatrolRoute = (myCastleLocation, fullMap) => {
    const {x, y} = myCastleLocation;
    const isHorizontal = movement.isHorizontalReflection(fullMap);
    const Ax = fullMap.length - x - 1;
    const Ay = fullMap.length - y - 1;

    if(isHorizontal)
    {
        return [{x: x, y: Ay}, {x: Ax, y: Ay}];
    }
    else
    {
        return [{x: Ax, y: y}, {x: Ax, y: Ay}];
    }
    
};

/**
*Check and return whether tile at specified coordinate is passable
*Used for movement, placing built/ spawned units
*Input:     location    -   the robot's 'position/ location' object, should be self.me
*           fullMap     -   the full map, should be self.map or self.getPassableMap()
*           robotMap    -   robot map, should be self.getVisibleRobotMap()

*Output:    RetVal  -   true if 'location' is passable, false otherwise
*/
movement.isPassable = (location, fullMap, robotMap) => {
    const {x, y} = location;

    if(x < 0 || y < 0)  //Map bound check
        return false;
    else if(x > fullMap.length || y > fullMap.length)   //Map bound check
        return false;
    return((robotMap[y][x] === 0) && (fullMap[y][x])); //Returns true only if tile is empty and is passable
};

/**
 * Method to get an array of resource locations within a specified distance, sorted by distance.
 * 
 * @param location Position to check from
 * @param maxDistance Maximum allowed distance from location
 * @param resourceMap Either `karbonite_map` or `fuel_map`
 * @return Array of resource locations sorted by distance (i.e. targets[0] will be closest)
 */
movement.getResourcesInRange = (location, maxDistance, resourceMap) => {
    const targets = [];
    let currentDist;

    for (let y = 0; y < resourceMap.length; ++y) 
    {
        for (let x = 0; x < resourceMap.length; ++x) 
        {
            if (resourceMap[y][x])
            {
                currentDist = movement.getDistance(location, {x, y});
                if(currentDist <= maxDistance) {
                    targets.push({x: x, y: y, distance: currentDist});
                }                
            }
        }
    }
    targets.sort((a,b) => {
        if(a.distance < b.distance) {
            return -1;
        } else {
            return 1;
        }
    });
    return targets;
};

/**
*The most simplest moveTowards, get location of a nearby passable adjacent tile, hopefully closer to destination
*Input:     location            -   the robot's 'position/ location' object, should be self.me
*           fullMap             -   the full map, should be self.map or self.getPassableMap()
*           robotMap            -   robot map, should be self.getVisibleRobotMap()
*           destination         -   The destination 'position/ location' object {x, y}
*           previous            -   A 'position/ location' object {x, y}, should be self.previous/ the position the robot was in the previous turn
*           previousprevious    -   A 'position/ location' object {x, y}, should be self.previousprevious/ the position the robot was in the previous turn
*Output:    retVal          -   A 'position/ location' object {x, y} which is adjacent to self.me 
*                           -   OR the passed in location if they are all not passable
*TODO gets stuck in corners, Might need a different move towards for combat units to properly traverse obstacles
*       Keeps on going to previous direction
*/
movement.dumberMoveTowards = (location, fullMap, robotMap, destination, previous) => {
    let direction = movement.getRelativeDirection(location, destination);
    let {x, y} = location;
    let candidate = {x : (x+direction.x), y: (y+direction.y)};

    if(movement.isPassable(candidate, fullMap, robotMap))
        return candidate;

    let dirA = {x: direction.x, y: direction.y};
    let dirB = {x: direction.x, y: direction.y};
    let candidateA = {x : (x+dirA.x), y: (y+dirA.y)};
    let candidateB = {x : (x+dirB.x), y: (y+dirB.y)};

    do{
        dirA = movement.rotateDirection(dirA, 1);
        dirB = movement.rotateDirection(dirB, -1);

        candidateA = {x : (x+dirA.x), y: (y+dirA.y)};
        if(!(movement.positionsAreEqual(candidateA, previous)) && movement.isPassable(candidateA, fullMap, robotMap))
            return candidateA;

        candidateB = {x : (x+dirB.x), y: (y+dirB.y)};
        if(!(movement.positionsAreEqual(candidateB, previous)) && movement.isPassable(candidateB, fullMap, robotMap))
            return candidateB;
    }while(movement.positionsAreEqual(candidateA, previous) || movement.positionsAreEqual(candidateB,previous));

    return location;
};

/**
*A simple movement function for robot movement from point A to Point B,
*Input: self        -   The robot unit
*       destination -   The destination 'position/ location' object {x, y}, assumes passable
*Output:    retVal  -   A 'position/ location' object {x, y} within moverange of robot location, which is passable and closest to destination
*                   -   OR {-1, -1} if distance from robot location to destination <= 0
*/
movement.moveTowards = (self, destination) => {
    let maxDist = SPECS.UNITS[self.me.unit].SPEED;
    let fullMap = self.map;
    let robotMap = self.getVisibleRobotMap();
    let distance = movement.getDistance(self.me, destination);
    const fuelCostPerMove = SPECS.UNITS[self.me.unit].FUEL_PER_MOVE;
    const maxFuelCost = (maxDist * fuelCostPerMove);

    //Looking through 'API questions' discord channel, 'karbonite' and 'fuel' seems to be the way to get global team's karbonite and fuel
    if(self.fuel < maxFuelCost)
        maxDist = Math.floor(self.fuel/fuelCostPerMove);

    //If destination within moverange, set maxDist to distance to destination
    if(distance < maxDist)
        maxDist = distance;

    //Case 0: No movement
    if(distance <= 0) {
        return {x: self.me.x, y: self.me.y};
    }
    //Case 1: Move to destination possible - do it
    let current = {
        x: self.me.x, 
        y: self.me.y
    };
    let previous = self.previous;
    let distTravelled = 0;
    let stepsAttempted = 0;

    while(distTravelled <= maxDist && stepsAttempted <= maxDist)
    {
        let temp = movement.dumberMoveTowards(current, fullMap, robotMap, destination, previous);
        distTravelled = movement.getDistance(self.me, temp);
        //If at furthest move in target direction, do it
        if(distTravelled === maxDist) {
            self.previous = current;
            return temp;
        //If not past maxDistance, make move to get closer to optimal move
        } else if (distTravelled < maxDist) {
            previous = current;
            current = temp;
            stepsAttempted++;
        }        
        //Move goes past maxDistance - don't do and do last best move
        if(distTravelled > maxDist)
            break;
        stepsAttempted++;
    }

    self.previous = previous;

    return current;
};

/**
 * Function that looks for a "base" (castle/church) within one tile of current position.
 * Could be used by any newly created unit to find which unit built it, set self.base to coordinates
 * 
 * @param self MyRobot object passed in
 */
movement.findAdjacentBase = (self) => {
    const bases = self.getVisibleRobots().filter(bot => {
        const dx = Math.abs(bot.x - self.me.x);
        const dy = Math.abs(bot.y - self.me.y);
        const isTeamBase = (bot.unit === 0 || bot.unit === 1) && bot.team === self.me.team;
        return isTeamBase && dx <= 1 && dy <= 1;
    });
    if (bases.length > 0) {
        return {x: bases[0].x, y: bases[0].y};
    } else {
        return null;
    }
};

/**
*Function to check whether map is created using horizontal or vertical reflection,
*Input: fullMap     -  the full map, should be self.map or self.getPassableMap()
*Output:    retVal  -   false if the map is a horizontal reflection
*                   -   OR true if it is a vertical reflection 
* Not accounted for: Case for when the map is both horizontally and vertically reflected
*/
movement.isHorizontalReflection = (fullMap) => {
    let y = 0;
    let x = 0;
    const length = fullMap.length;
    let mirror = length-1;

    while(y < length)
    {
        while(x < mirror)
        {
            if(fullMap[y][x] !== fullMap[y][mirror])
            {
                return true
            }
            ++x;
            --mirror;
        }
        ++y;
        mirror = length - 1;
        x = 0;
    }
    return false;
};

/**
*Calculate and return enemy castle's potential starting location
*Input:     myCastleLocation    -   the Castle's 'position/ location' object, should be self.me/ location of unit's base
*           fullMap             -   the full map, Should be self.map or or self.getPassableMap()
*Output:    RetVal  -   An {x, y} object, which should be the position of the mirror enemy castle to myCastleLocation
*/
movement.getMirrorCastle = (myCastleLocation, fullMap) => {
    const {x, y} = myCastleLocation;
    const Ax = fullMap.length - x - 1;
    const Ay = fullMap.length - y - 1;
    const isHorizontal = movement.isHorizontalReflection(fullMap);

    if(isHorizontal)
    {
        return {x: x, y: Ay}
    }
    else
    {
        return {x: Ax, y: y};
    }
};

/**
* Calculate and return enemy castle's potential starting location
*Input:     alliedCastleLocations       -   An array of 'position/ location' objects for the allied castles, should start with the calling castle's location followed by any allied castles
*           fullMap                     -   the full map, Should be self.map or or self.getPassableMap()
*Output:    RetVal  -   An array of {x, y} objects, which should be positions of enemy castles
*/
movement.getEnemyCastleLocations = (alliedCastleLocations, fullMap) => {
    let enemyCastleLocations = [];
    for(let i = 0; i < alliedCastleLocations.length; ++i)
    {
        enemyCastleLocations.push(movement.getMirrorCastle(alliedCastleLocations[i], fullMap));
    }
    return enemyCastleLocations;
};

/**
*Calculate and return enemy castle's potential starting location
*Input:     myCastleLocation    -   the Castle's 'position/ location' object, should be self.me/ self.base
*           fullMap             -   the full map, Should be self.map or or self.getPassableMap()
*Output:    RetVal  -   The diagonal mirror of myCastleLocation, should be in an enemy quadrant
*Standalone helper function, to obtain the diagonal mirror patrol position
*/
movement.getDiagonalPatrolPosition = (myCastleLocation, fullMap) => {
    const {x, y} = myCastleLocation;
    const Ax = fullMap.length - x - 1;
    const Ay = fullMap.length - y - 1;

    return  {x: Ax, y: Ay};
};

/**
 * Method to move bot according to `self.path`. Checks if next move on path is viable; if so does it,
 * if not adjusts path. If path adjustment successful, makes new move. Otherwise, does nothing in hopes
 * path will reopen later
 * 
 * @param self MyRobot object to do moving
 * @return Call to `self.move()` with apppriate move if possible, or nothing if no move can be made. This
 *         method thus needs to be returned by the action of whatever bot is calling it in order to make move.
 */
movement.moveAlongPath = (self) => {
    //self.log("me: [" + self.me.x + "," + self.me.y + "]")
    let nextMove = self.path.pop();
    //self.log("nextMove: [" + nextMove.x + "," + nextMove.y + "]")

    //If next move is viable, do it
    if(movement.isPassable(nextMove, self.map, self.getVisibleRobotMap())) {
        self.log("Unit " + self.me.id + " moving to: [" + nextMove.x + "," + nextMove.y + "]");
        return self.move(nextMove.x-self.me.x, nextMove.y-self.me.y);
    //If nextMove is destination (because path is empty), readd destination to path and wait to be moveable
    /*} else if (self.path.length === 0) {
        self.log("Final path position occupied - wait until unoccupied")
        self.path.push(nextMove);
        return;*/
    //If next move not viable, reset path by readding next move, attempt to adjust path accounting for bots
    } else {
        self.path.push(nextMove);
        //If adjustment successful, pop off new next move and go to it
        if(movement.adjustPath(self, self.me)) {
            //self.log(self.path);
            nextMove = self.path.pop();
            self.log("Unit " + self.me.id + " moving to: [" + nextMove.x + "," + nextMove.y + "]");
            return self.move(nextMove.x-self.me.x, nextMove.y-self.me.y);
        //Otherwise, just dont move (may want to fix)
        } else {
            self.log("bot " + self.me.id + " not moving due to path conflict");
            return;
        }
    }
};


/**
 * Method to update path to account for possible
 * 
 * @param self MyRobot object whose path needs adjusting, likely due to bots in way
 * @param newOrigin New starting destination. Can be `self.me` if issue with bot in way of
 *                  optimal path, or some other location if bot needs to move off path and
 *                  then readjust target path accordingly (i.e. if attackers moving to fight
 *                  a visible enemy)
 * @return Boolean indicating whether `self.path` was changed or not
 */
movement.adjustPath = (self, newOrigin) => {
    self.log('ADJUSTING PATH');
    const oldPath = self.path.slice(0);
    let remainingPath;
    let reconnectionPoint;// = self.path.pop();

    /*
        Repeatedly pop off list until a passible point in path is found. reconnectionPoint will be set to this
        passible location to reconnect design path from current location to reconnectionPoint 
    */
    self.log(self.path);
    do {
        //oldMoves.push(reconnectionPoint);
        reconnectionPoint = self.path.pop();

        //self.log("reconnectionPoint: [" + reconnectionPoint.x + "," + reconnectionPoint.y + "]");
    } while(!movement.isPassable(reconnectionPoint, self.map, self.getVisibleRobotMap()) && self.path.length > 0);

    //If the last option is the final destination and that destination is a bot, adjust to a viable final location
    if(self.path.length === 0 && !movement.isPassable(reconnectionPoint, self.map, self.getVisibleRobotMap())) {
        reconnectionPoint = movement.findNearestLocation(self, reconnectionPoint);
    }
    
    /*
        Make path from newOrigin to reconnectionPoint with A* pathfinding accounting for bots and reconnect with rest
        of original path. If successful, self.path will be set to optimal path between newOrigin and reconnectionPoint,
        so concat with remainingPath to form new self.path. If pathfinding unsuccessful, I honestly don't know what
        to do, so I'll just reset self.path to original path without adjustment
    */
    remainingPath = self.path;
    if(movement.aStarPathfinding(self, newOrigin, reconnectionPoint, true)) {
        self.path = remainingPath.concat(self.path);
        self.log('GENERATED NEW PATH');
        self.log(self.path);
        return true;
    } else {
        self.log('MOVEMENT ADJUSTMENT UNNEEDED OR IMPOSSIBLE');
        self.path = oldPath;
        return false;
    }
};

/**
 * Method to find a nearby square for a location if the location itself is not viable. Intended for use in
 * `movement.adjustPath` in case you are trying to move on top of a castle.
 * 
 * @param self MyRobot object trying to move
 * @param location Location to find a nearby square
 * @return Returns a coordinate pair for a nearby location.
 */
movement.findNearestLocation = (self, location) => {
    //Use Pilgrim's movable positions as example
    const idealDirection = movement.getRelativeDirection(location, self.me);
    const positions = movement.getMoveablePositions(2).sort((a, b) => {
        if(a.r2 < b.r2) {
            return -2;
        } else if (a.r2 > b.r2) {
            return 2;
        } else {
            if (a.dirIndex === idealDirection) {
                return -1;
            } else if(b.dirIndex === idealDirection) {
                return 1;
            } else {
                return 0;
            }
        }
    });

    for(let i = 0; i < positions.length; i++) {
        const position = {x: location.x+positions[i].x, y: location.y+positions[i].y};
        if(movement.isPassable(position, self.map, self.getVisibleRobotMap())) {
            return position;
        }
    }
    return location;
};

/**
 * Method that returns an array of all relative moveable positions which also includes r2 distance and index
 * of the relative direction (these can be used to filter or sort entire list as desired).
 * 
 * @param unit Integer of unit type to dictate r2 distance and viable moves
 * @return Array of moveable positions relative to {x: 0, y: 0}
 */
movement.getMoveablePositions = (unit) => {
    const moveablePositions = [];
    const maxDist = SPECS.UNITS[unit].SPEED;
    for(let y = -1*Math.sqrt(maxDist); y <= Math.sqrt(maxDist); y++) {
        for(let x = -1*Math.sqrt(maxDist); x <= Math.sqrt(maxDist); x++) {
            const start = {x: 0, y: 0};
            const output = {x: x, y: y, r2: -1, dirIndex: -1};
            const dist = movement.getDistance(start, output);
            if(dist <= maxDist && !movement.positionsAreEqual(start, output)) {
                output.r2 = dist;
                output.dirIndex = movement.getDirectionIndex(movement.getRelativeDirection(start, output));
                moveablePositions.push(output);
            }
        }
    }
    return moveablePositions;
};

/**
 * A* pathfinding method - follow algorithm to find an optimal path from a location to a destination. Updates
 * self's path accordingly (meaning that if `location` is not the position in `self.me`, need to handle!!!)
 * 
 * @param self MyRobot object to be using path
 * @param location Starting location of path. May or may not be current position of `self`
 * @param destination Ending location of path.
 * @param accountForBots Boolean indicating whether bots should be considered when building path. False indicates
 *                       finding optimal path based on terrain and not on whether collisions with bots may occur;
 *                       true accounts for current position of bots. The 'false' option should be used when creating
 *                       an original path; 'true' should be used when adjusting a path due to possible bot collision.
 */
movement.aStarPathfinding = (self, location, destination, accountForBots) => {
    if(!destination) {
        self.log('Error - cannot do A* with no target');
        return false;
    } else if (movement.positionsAreEqual(location, destination)) {
        self.log("Don't use pathfinding when destination obvious");
        return false;
    }
    let foundDest = false;
    const openQueue = [];
    const closedMap = [];
    const infoMap = [];
    
    movement.initAStarMaps(self, location, accountForBots, closedMap, infoMap);

    openQueue.push({x: location.x, y: location.y});

    while(openQueue.length > 0 && !foundDest) {
        foundDest = movement.processAStarCell(self, destination, infoMap, openQueue, closedMap);
    }

    if(foundDest) {
        self.path = movement.createPathFromInfoMap(location, destination, infoMap);
        self.log("New path set:");
        self.log(self.path);
        return true;
    } else {
        self.log('Cannot get to target');
        return false;
    }
};

/**
 * Helper method for `aStarPathFinding` to initialize the `closedMap` and `infoMap` parts of the algorithm
 */
movement.initAStarMaps = (self, location, accountForBots, closedMap, infoMap) => {
    const maxDist = 2*Math.pow(self.map.length,2);
    //Init infoMap with unusable/max values, init closedMap opposite of self.map so impassibe is "closed"
    for(let y = 0; y < self.map.length; y++) {
        closedMap.push([]);
        infoMap.push([]);
        for(let x = 0; x < self.map.length; x++) {
            infoMap[y][x] = {
                f: maxDist,
                g: maxDist,
                h: maxDist,
                parent: {
                    x: -1,
                    y: -1
                }
            };
            //If accounting for bots, set closedMap cell to false if passible
            if(accountForBots) {
                closedMap[y][x] = !movement.isPassable({x: x, y: y}, self.map, self.getVisibleRobotMap());
            //If just looking at map, set closedMap cell to false if passible terrain
            } else {
                closedMap[y][x] = !self.map[y][x];
            }
        }
    }
    //Init current position
    infoMap[location.y][location.x] = {
        f: 0,
        g: 0,
        h: 0,
        parent: {
            x: location.x,
            y: location.y
        }
    };
};


/**
 * Helper function for A* pathfinding. Takes first cell coordinates off open queue as current coordinate, 
 * then for each position reachable from current, updates infoMap and adds reachable position to end of open queue
 * Optimizations include avoiding coordinatse on closedMap, prioritizing move positions by distance and then matching
 * the target direction
 * 
 * @param self MyRobot object doing moving, which provides a unit type and other info like map length
 * @param destination Location to find path towards from the position in `self.me`
 * @param infoMap Intermediate results grid tracking optimal path
 * @param openQueue Queue of coordinates to still be processed as part of pathfinding
 * @param closedMap Boolean 2D grid of coordinates where true means the coordinate is immovable or already checked by A* process
 * @return Boolean indicating whether cell matches destination, indicating end of A* process
 */
movement.processAStarCell = (self, destination, infoMap, openQueue, closedMap) => {
    const moveablePositions = movement.getMoveablePositions(self.me.unit);
    const current = openQueue.shift();
    const currCell = infoMap[current.y][current.x];
    const targetDirIndex = movement.getDirectionIndex(movement.getRelativeDirection(current, destination));
    //Add to closedMap, as it is now being processed
    closedMap[current.y][current.x] = true;
    //Sort list by distance and then potentially direction - small optimization?
    moveablePositions.sort((a, b) => {
        if(a.r2 > b.r2) {
            return -2;
        } else if (a.r2 < b.r2) {
            return 2;
        } else {
            if (a.dirIndex === targetDirIndex) {
                return -1;
            } else if(b.dirIndex === targetDirIndex) {
                return 1;
            } else {
                return 0;
            }
        }
    });

    //Iterate through all moveable positions, updating their values and adding them to queue if not destination
    let gNext;
    let hNext;
    let fNext;
    for(let i = 0; i < moveablePositions.length; i++) {
        const nextCoordinates = {x: current.x+moveablePositions[i].x, y: current.y+moveablePositions[i].y};
        //Skip if nextCoordinates not on map
        if(nextCoordinates.x >= self.map.length || 
           nextCoordinates.x < 0 ||
           nextCoordinates.y >= self.map.length ||
           nextCoordinates.y < 0) {
            continue;
        }
        //If coordinates not already processed, do stuff
        if(!closedMap[nextCoordinates.y][nextCoordinates.x]) {
            const nextCell = infoMap[nextCoordinates.y][nextCoordinates.x];
            //If destination found, we found a path! Update this last parent and return true to indicate successful completion
            if(movement.positionsAreEqual(nextCoordinates, destination)) {
                nextCell.parent = current;
                return true;
            //Otherwise, update cell information and push onto openQueue if possible improvement on path
            } else {
                gNext = currCell.g + movement.getDistance(current, nextCoordinates);
                hNext = movement.getDistance(nextCoordinates, destination);
                fNext = gNext+hNext;
                if(nextCell.f > fNext) {
                    nextCell.parent = current;
                    nextCell.g = gNext;
                    nextCell.h = hNext;
                    nextCell.f = fNext;
                    openQueue.push(nextCoordinates);
                }
            }
        }        
    }
    //If none of moveable are destination, return false
    return false;
};
/**
 * A* helper ethod that takes an info map and works backwards from destination to the current position of self,
 * pushing each pair of coordiantes on the path into an array.
 * 
 * @param location Starting position (to know when to stop creating path)
 * @param destination Target destination (to know where to start creating the path)
 * @param infoMap 2D array created by A* method `aStarPathFinding`. 
 * @return Returns an array where the first element is the destination coordinates and the last element is the
 *         coordinates of the next move on the path to the destination (i.e. NOT location, just next place to move
 *         from location)
 */
movement.createPathFromInfoMap = (location, destination, infoMap) => {
    const pathArray = [];
    let current = destination;
    let traversedPath = false;
    while(!traversedPath) {
        pathArray.push({x: current.x, y: current.y});
        current = infoMap[current.y][current.x].parent;
        if (movement.positionsAreEqual(location, current)) {
            traversedPath = true;
        }
    }
    return pathArray;
};

const combat = {};

combat.UNITTYPE = ["CASTLE", "CHURCH", "PILGRIM", "CRUSADER", "PROPHET" , "PREACHER"];

/**
 * Method to filter a list of robot elements (attackable, visible, etc.) by unit type
 * 
 * @param units List of robots to filter
 * @param type String like "PILGRIM", "CASTLE", etc
 * @return Returns a list of robot information that are all bots of the input type
 */
combat.filterByUnitType = (units, type) => {
    const index = combat.UNITTYPE.indexOf(type);
    return units.filter(robotElement => {
        return robotElement.unit === index;
    });
};

/*Function to get a list of robots in a certain distance range from calling robot
*Input: self        -   reference to the object of the calling robot, should be the value of self.me
*       minRange    -   minimum distance of the range, should be in r^2
*       maxRange    -   maximum distance of the range, should be in r^2
*Output:    RetVal  -   array containing visible robots with distance in the range specified
*/
combat.getRobotsInRange = (self, minRange, maxRange) => {
    return self.getVisibleRobots().filter((robotElement) => {
        const distance = movement.getDistance(self.me, robotElement);
        return distance >= minRange && distance <= maxRange;
    });
};

/*Filter array of visible robots in a certain distance range from a location/ position
*Input: units       -   array of visible robots to filter
*       position    -   an {x, y} object representing a location/ position
*       minRange    -   minimum distance of the range, should be in r^2
*       maxRange    -   maximum distance of the range, should be in r^2
* Output: RetVal    -   filtered robot array
*/
combat.filterByRange = (units, position, minRange, maxRange) => {
    return units.filter((robotElement) => {
        const distance = movement.getDistance(position, robotElement);
        return distance >= minRange && distance <= maxRange;
    });
};

/*Function to get a list of visible enemy robots
*Input: self        -   reference to the object of the calling robot, should be the value of self.me
*       minRange    -   minimum distance of the range, should be in r^2
*       maxRange    -   maximum distance of the range, should be in r^2
*Output:    RetVal  -   array containing visible enemy robots
*/
combat.getVisibleEnemies = (self) => {
    return self.getVisibleRobots().filter((robotElement) => {
        return robotElement.team !== self.me.team;
    });
};

/*Function to get a list of visible allied robots
*Input:     self    -   reference to the object of the calling robot, should be the value of self
*Output:    RetVal  -   array containing visible allied robots
*/
combat.getVisibleAllies = (self) => {
    return self.getVisibleRobots().filter((robotElement) => {
        return robotElement.team === self.me.team;
    });
};

/*Filter array of visible robots in a certain distance range from a location/ position
*Input: self        -   reference to the object of the calling robot, should be the value of self
*       units       -   array of visible robots to filter
*       team        -   use self.me.team to filter for allies or any other values than 0 or 1 for enemies
* Output: RetVal    -   filtered robot array
*/
combat.filterByTeam = (self, units, team) => {
    if (self.me.team !== team)
        return units.filter((robotElement) => {
            return robotElement.team !== self.me.team;
        });
    else if (self.me.team === team) 
        return units.filter((robotElement) => {
            return robotElement.team === self.me.team;
        });

    return units;
};

/*Function to get a list of robots in a certain distance range from calling robot
*Input: self        -   reference to the object of the calling robot, should be the value of self.me
*Output:    RetVal  -   array containing enemy robots in the calling robot's attack radius
*/
combat.getAttackableEnemies = (self) => {
    return self.getVisibleRobots().filter((robotElement) => {
        const distance = movement.getDistance(self.me, robotElement);

        //Filter for only enemies && distance >= robot's minimum attack radius && distance <= robot's maximum attack radius
        return robotElement.team !== self.me.team && distance >= SPECS.UNITS[self.me.unit].ATTACK_RADIUS[0] && distance <= SPECS.UNITS[self.me.unit].ATTACK_RADIUS[1];
    });
};

/*Filter array of visible robots for attackable enemies
*Input: self        -   reference to the object of the calling robot, should be the value of self
*       units       -   array of visible robots to filter
* Output: RetVal    -   filtered robot array
*/
combat.filterByAttackable = (self, units) => {
    return units.filter((robotElement) => {
        const distance = movement.getDistance(self.me, robotElement);

        //Filter for only enemies && distance >= robot's minimum attack radius && distance <= robot's maximum attack radius
        return robotElement.team !== self.me.team && distance >= SPECS.UNITS[self.me.unit].ATTACK_RADIUS[0] && distance <= SPECS.UNITS[self.me.unit].ATTACK_RADIUS[1];
    });
};

/*Filter array of visible robots for Unattackable enemies
*Input: self        -   reference to the object of the calling robot, should be the value of self
*       units       -   array of visible robots to filter
* Output: RetVal    -   filtered robot array
*/
combat.filterByUnattackable = (self, units) => {
    return units.filter((robotElement) => {
        const distance = movement.getDistance(self.me, robotElement);

        //Filter for only enemies && distance < robot's minimum attack radius && distance > robot's maximum attack radius
        return robotElement.team !== self.me.team && distance < SPECS.UNITS[self.me.unit].ATTACK_RADIUS[0] && distance > SPECS.UNITS[self.me.unit].ATTACK_RADIUS[1];
    });
};
/**
 * Method to return information on a single robot of input type (if it exists) closest to current position
 * 
 * @param self MyRobot object
 */
combat.getClosestAttackableEnemy = (self) => {
    let minDist = 100; //Something beyond max range for all units
    let closestBot = null;
    const allEnemies = combat.getAttackableEnemies(self);
    allEnemies.forEach(robotElement => {
        const dist = movement.getDistance(robotElement, self.me);
        if(dist < minDist) {
            minDist = dist;
            closestBot = robotElement;
        }
    });
    return closestBot;
};

/*Function to check whether passed robot have enough fuel to attack
*Input: self        -   reference to the object of the calling robot, should be the value of self.me
*Output:    RetVal  -   true if it can attack, OR false otherwise
*/
combat.hasFuelToAttack = (self) => {
    return self.fuel >= SPECS.UNITS[self.me.unit].ATTACK_FUEL_COST;
};

const communication = {};

/*Translate position object x and y to signal value
*Input:     position    -   An {x, y} position object, self.me or other stuff like self.base, enemy castle location etc.
*           fullMap     -   the full map, Should be self.map or or self.getPassableMap()
*Output:    RetVal  -   signal value, in the range between 0 to maplength^2 - 1
*/
communication.positionToSignal = (position, fullMap) => {
    const {x, y} = position;
    const signalValue = (y)*fullMap.length + x;

    return signalValue;
};

/*Translate signal value to an {x, y} position object
*Input:     signalValue -   A signal value, in the range between 0 to maplength^2 - 1
*           fullMap     -   the full map, Should be self.map or or self.getPassableMap()
*Output:    RetVal      -   An {x, y} position object
*/
communication.signalToPosition = (signalValue, fullMap) => {
    //Case for when signalValue is 0, since Math.floor doesn't work nicely with 0
    const y = Math.floor(signalValue/fullMap.length);
    const x = signalValue % fullMap.length;

    return {x, y};
};

/**
 * Method to get information on all castles and pass it into `self.teamCastles` array
 */
communication.initTeamCastleInformation = (self) => {
    if (self.teamCastles.length > 0) {
        self.log('Team castle locations already initialized - aborting method');
        return false;
    } else {
        const maxDist = -2*Math.pow(self.map.length, 2)-1;
        const castles = combat.filterByTeam(self, combat.filterByUnitType(self.getVisibleRobots(), "CASTLE"), self.me.team);
        //Initialize some basic information
        castles.forEach(castle => {
            if(castle.hasOwnProperty("x") && castle.hasOwnProperty("y")) {
                self.teamCastles.push({id: castle.id, x: castle.x, y: castle.y});
            } else {
                self.teamCastles.push({id: castle.id, x: maxDist, y: maxDist});
            }
        });
        //Sort so nearest castle is self.teamCastles[0]
        self.teamCastles.sort((a,b) => {
            if(movement.getDistance(self.me, a) > movement.getDistance(self.me, b)) {
                return -1;
            } else {
                return 1;
            }
        });
        return true;
    }
};

const pilgrim = {};
pilgrim.maxKarbonite = SPECS.UNITS[SPECS.PILGRIM].KARBONITE_CAPACITY;
pilgrim.maxFuel = SPECS.UNITS[SPECS.PILGRIM].FUEL_CAPACITY;

/**
 * Main action page for a pilgrim unit. Makes decisions and calls helper functions to take action 
 */
pilgrim.doAction = (self) => {
    self.log("pilgrim " + self.id + " taking turn - occupied depots: " + JSON.stringify(self.occupiedResources));
    
    if (self.role === 'UNASSIGNED') {
        self.base = movement.findAdjacentBase(self);
        //Tweaking to set base not directly on top of castle, because causing pathfinding issues
        //self.base = {x: self.me.x, y: self.me.y};
        self.log("Set base as " + JSON.stringify(self.base));
        //Gets nearby base, checks turn
        self.role = 'PIONEER';
        communication.initTeamCastleInformation(self);
        //Set target base on castle signal
        const {x, y} = communication.signalToPosition(self.getRobot(self.teamCastles[0].id).signal, self.map);
        self.target = {x: x, y: y};
        self.log("pilgrim MINER " + self.id + " targeting depot at [" + self.target.x + "," + self.target.y + "]");
    }

    if(self.role === 'MINER') {
        return pilgrim.takeMinerAction(self);
    } else if (self.role === 'PIONEER') {
        return pilgrim.takePioneerAction(self);
    }

    return;
};

/**
 * Method to dictate strategy for MINER pilgrims
 */
pilgrim.takeMinerAction = (self) => {
    if(self.target === null) {
        if(self.karbonite*5 <= self.fuel) {
            self.target = pilgrim.findClosestResource(self.me, self.karbonite_map, self.occupiedResources);
            self.log("pilgrim MINER " + self.id + " targeting karbonite depot at [" + self.target.x + "," + self.target.y + "]");
        } else {
            self.target = pilgrim.findClosestResource(self.me, self.fuel_map, self.occupiedResources);
            self.log("pilgrim MINER " + self.id + " targeting fuel depot at [" + self.target.x + "," + self.target.y + "]");
        }
    }
    //If full on a resource, return to base to deposit
    if(self.me.karbonite === pilgrim.maxKarbonite || self.me.fuel === pilgrim.maxFuel) {
        let adjacentBase = movement.findAdjacentBase(self);
        if(adjacentBase != null) {
            self.log("pilgrim MINER " + self.id + " depositing resources with base at [" + adjacentBase.x + "," + adjacentBase.y + "]");
            return self.give(adjacentBase.x-self.me.x, adjacentBase.y-self.me.y, self.me.karbonite, self.me.fuel);
        } else if (self.path.length === 0) {
            if(movement.aStarPathfinding(self, self.me, self.base, false)) {
                self.log(self.path);
            } else {
                self.log('Cannot get path back to base');
            }
        }
        self.log('pilgrim MINER ' + self.id + ' moving towards base, Current: [' + self.me.x + ',' + self.me.y + ']');
        return movement.moveAlongPath(self);
    } else {
        //If at target, mine
        if(self.me.x === self.target.x && self.me.y === self.target.y) {
            self.log("pilgrim MINER " + self.id + " mining resources at [" + self.me.x + "," + self.me.y + "]");
            return self.mine();
        //If not at target, make sure you aren't going to an occupied depot, then move towards target
        } else {
            pilgrim.updateResourceTarget(self);
            self.log('pilgrim MINER ' + self.id + ' moving towards target, Current: [' + self.me.x + ',' + self.me.y + ']');
            return movement.moveAlongPath(self);
        }
    }
};

/**
 * Method to dictate strategy for PIONEER pilgrims
 */
pilgrim.takePioneerAction = (self) => {
    //If target not set, have pilgrims alternate between looking for karbonite or fuel
    if(self.target === null) {
        const localPilgrims = self.getVisibleRobots().filter(bots => {
            return bots.team === self.me.team && bots.unit === 2;
        });
        if(localPilgrims.length % 2 === 1) {
            self.target = pilgrim.findClosestResource(self.me, self.karbonite_map, self.occupiedResources);
            self.log("pilgrim PIONEER " + self.id + " targeting karbonite depot at [" + self.target.x + "," + self.target.y + "]");
        } else {
            self.target = pilgrim.findClosestResource(self.me, self.fuel_map, self.occupiedResources);
            self.log("pilgrim PIONEER " + self.id + " targeting fuel depot at [" + self.target.x + "," + self.target.y + "]");
        }
        if(movement.aStarPathfinding(self, self.me, self.target, false)) {
            self.log(self.me);
            self.log(self.path);
        }
    }
    //Target set, if not at target make sure you aren't going to an occupied depot, then move towards target
    if (self.target.x !== self.me.x || self.target.y !== self.me.y) {
        pilgrim.updateResourceTarget(self);
        self.log('pilgrim PIONEER ' + self.id + ' moving towards target, Current: [' + self.me.x + ',' + self.me.y + ']');
        return movement.moveAlongPath(self);
    //If at target, become miner
    } else {
        self.role = 'MINER';
        self.log('pilgrim PIONEER ' + self.id + ' becoming MINER');
        return pilgrim.takeMinerAction(self);
    }
};

/**
 * Function to execute mining
 */
pilgrim.mine = (self) => {
    const onKarboniteDepot = self.karbonite_map[self.me.y][self.me.x];
    const onFuelDepot = self.fuel_map[self.me.y][self.me.x];
    //Just in case you don't have one fuel
    if(self.fuel <= 0) {
        self.log("pilgrim " + self.id + " attempting to mine when not enough fuel");
        return;
    }
    if (!onKarboniteDepot && !onFuelDepot) {
        self.log("pilgrim " + self.id + " attempting to mine where there is no resource");
        return;
    } else {
        if(onKarboniteDepot && self.me.karbonite >= pilgrim.maxKarbonite) {
            self.log("pilgrim " + self.id + " attempting to mine karbonite when at capacity");
            return;
        } else if(onFuelDepot && self.me.fuel >= pilgrim.maxFuel) {
            self.log("pilgrim " + self.id + " attempting to mine fuel when at capacity");
            return;
        } else {
            return self.mine();
        }
    }
};

/**
 * Method to find the location of the closest resource to a bot.
 * @TODO There might be a more efficient version of this to implement
 * 
 * @param position Object with x and y fields representing the bot's current position
 * @param depotMap The 2d boolean map, either `karbonite_map` or `fuel_map`
 * @param occupiedResources Array of locations representing resource depots another bot has targeted.
 * This bot therefore will avoid targeting anything on this location
 * @return Returns an object with the x and y position of the closet resource
 */
pilgrim.findClosestResource = (position, depotMap, occupiedResources) => {
    const mapSize = depotMap.length;
    let minDist = 2*Math.pow(mapSize, 2);
    let closest = { x: -1, y: -1};
    for(let y = 0; y < mapSize; y++) {
        for(let x = 0; x < mapSize; x++) {
            const currDist = movement.getDistance(position, {x: x, y: y});
            if (depotMap[y][x] == true && (currDist<minDist)) {
                //Check if occupiedResources has a match
                const occupiedArray = occupiedResources.filter(depot => {
                    return depot.x === x && depot.y === y;
                });
                //If no matches (occupiedArray is empty), set as potential position
                if(occupiedArray.length === 0) {
                    closest.x = x;
                    closest.y = y;
                    minDist = currDist;
                }
            }
        }
    }
    return closest;
};

/**
 * Method to determine if a teammate pilgrim is already mining at a potential depot location.
 * If depot is determined to be occupied, depot is added to `self.occupiedResources` list
 * 
 * @param self MyRobot object
 * @param potentialDepot Location object to check for occpation
 * @return Boolean where true represent a known occupied depot location. A false is anything else 
 * and does not guarantee that no teammate pilgrim is assigned to that location
 */
pilgrim.isDepotOccupied = (self, potentialDepot) => {
    const possibleId = self.getVisibleRobotMap()[potentialDepot.y][potentialDepot.x];
    if(possibleId > 0) {
        //If bot exists on target, check if it's a pilgrim from your team (probbaly mining)
        const botOnTarget = self.getRobot(possibleId);
        if(botOnTarget.team === self.me.team && botOnTarget.unit === self.me.unit) {
            //If teammate pilgrim already there mining, add target to occupiedResources and find new resource to target
            self.occupiedResources.push(potentialDepot);
            return true;
        }
    }
    return false;
};

/**
 * Method that checks if the current target is occupied or not. If so, changes `self.target` to next closest resource
 * of the same type (i.e. if target was kryptonite, next target will be kryptonite)
 * 
 * @param self MyRobot object whose target value (and occupiedResources array) may be updated if necessary 
 */
pilgrim.updateResourceTarget = (self) => {
    while(pilgrim.isDepotOccupied(self, self.target)) {
        if(self.karbonite_map[self.target.y][self.target.x] == true) {
            self.target = pilgrim.findClosestResource(self.me, self.karbonite_map, self.occupiedResources);
        } else {
            self.target = pilgrim.findClosestResource(self.me, self.fuel_map, self.occupiedResources);
        }
    }
    //Update path accordingly
    movement.aStarPathfinding(self, self.me, self.target, false);
};

const prophet = {};

prophet.doAction = (self) => {
    
    if (self.role === 'UNASSIGNED') {
        self.log("UNASSIGNED prophet " + self.id + " taking turn");
        self.base = movement.findAdjacentBase(self);
        self.log("Set base as " + JSON.stringify(self.base));

        //If for some unknown reason can't find base (e.g. created by base, but then base is destroyed on enemy turn before this bot's turn)
        if(self.base == null)
        {
            self.squadSize = 0;
            self.role = "ATTACKER";
            return;
        }

        //Receive location of enemy base from Castle, if they are signaling to its adjacent square
        const baseID = self.getVisibleRobotMap()[self.base.y][self.base.x];   //Get ID of the base Castle robot
        const baseRobot = self.getRobot(baseID);    //Get robot reference of the base castle robot

        //Receive signal just in case
        if(self.isRadioing(baseRobot))  //Check if base has broadcasted a signal on it's turn
        {
            //Get the message using baseRobot.signal and translate to position using helper function
            self.potentialEnemyCastleLocation = [communication.signalToPosition(baseRobot.signal, self.map)];
            self.potentialEnemyCastleLocation.push(movement.getDiagonalPatrolPosition(self.base, self.map));
        }
        else
        {
            self.log("UNASSIGNED prophet didn't receive signal from base, using getAttackerPatrolRoute");
            self.potentialEnemyCastleLocation = movement.getAttackerPatrolRoute(self.base, self.map);
        }

        const nearbyDefenders = self.getVisibleRobots().filter((robotElement) => {
            if(robotElement.team === self.me.team && robotElement.unit === self.me.unit)
            {
                const distance = movement.getDistance(self.base, robotElement);
                //30, assuming defender moved at max speed (r^2= 4) for 5 turns (4*5 = 20), + 10 to account for the possibility of prophet spawning in different starting tiles
                return distance <= 64;
            }
        });

        //2 defenders towards mirror castle, should be enough to kill a crusader in 2 turns before it gets to attack range
        if(nearbyDefenders.length < 2)
        {
            self.log("Base defenders = " + JSON.stringify(nearbyDefenders.length) + ", Assigned as a defender");
            self.role = "DEFENDER";

        }
        else
        {
            self.log("Base defenders = " + JSON.stringify(nearbyDefenders.length) + ", Assigned as an attacker");
            self.squadSize = 9; //-2, account for 1 defender and 1 trigger prophet, need to change squad detection if trigger prophet is to be part of squad
            self.role = "ATTACKER";
        }
    }

    if(self.role === "DEFENDER")
        return prophet.takeDefenderAction(self);

    if(self.role === "ATTACKER")
        return prophet.takeAttackerAction(self);

    //Should not fall through unless still UNASSIGNED or something horrible happened
    self.log('prophet ' + self.role + ' ' + self.me.id + ' still UNASSIGNED!!!');
    return;
};

//DEFENDER Behavior
prophet.takeDefenderAction = (self) =>  {
    self.log("DEFENDER prophet " + self.id + " taking turn");
    
    //Guarding behavior, doesn't flee, doesn't check fuel before attempting to attack
    const attackable = combat.getAttackableEnemies(self);

    if(attackable.length > 0)
    {
        //Compensate guard post movement turn loss due to attacking
        if(self.me.turn < 5)
        {
            --self.me.turn;
        }

        let attacking = attackable[0];
        self.log("Attacking " + combat.UNITTYPE[attacking.unit] + " at " + attacking.x + ", " +  attacking.y);
        return self.attack(attacking.x - self.me.x, attacking.y - self.me.y);
    }


    //Limited movement towards enemy castle (movement towards guard post)
    if(self.me.turn < 4)
    {
        if(self.path.length === 0)
        {
            if(movement.aStarPathfinding(self, self.me, self.potentialEnemyCastleLocation[0], false)) {
                self.log(self.path);
            } else {
                self.log('Cannot get path to guard post');
                return;
            }
        }

        self.log('DEFENDER prophet ' + self.id + ' moving towards guard post, Current: [' + self.me.x + ',' + self.me.y + ']');
        return movement.moveAlongPath(self);
    }
    
    self.log("DEFENDER prophet guarding at x: " + self.me.x + ", y: " + self.me.y);
    return;
};


//ATTACKER Behavior
prophet.takeAttackerAction = (self) => {
    self.log("ATTACKER prophet " + self.id + " taking turn");

    //If no base
    if(self.base == null)
    {
        //Set opposite of current coord as target
        self.potentialEnemyCastleLocation = movement.getAttackerPatrolRoute(self.me, self.map);
    }


    //If no target
    if(self.potentialEnemyCastleLocation === null)
    {
        //Get potential enemy castle locations if Castle didn't send signal
        self.potentialEnemyCastleLocation = movement.getAttackerPatrolRoute(self.base, self.map);
    }

    if(self.target === null)
    {     
        self.target = self.potentialEnemyCastleLocation[0];
    }

    const visibleRobots = self.getVisibleRobots();
    const attackable = combat.filterByAttackable(self, visibleRobots);

    if(prophet.fleeBehavior(self, visibleRobots))
    {
        return movement.moveAlongPath(self);
    }

    //Attack visible enemies
    if(attackable.length > 0)
    {
        --self.me.turn;
        let attacking = attackable[0];
        self.log("Attacking " + combat.UNITTYPE[attacking.unit] + " at " + attacking.x + ", " +  attacking.y);
        return self.attack(attacking.x - self.me.x, attacking.y - self.me.y);
    }

    //No enemy castle at target and there are more waypoint to check
    if(self.potentialEnemyCastleLocation.length > 0 && movement.getDistance(self.me, self.target) <= 49)
    {
        //Assign new target waypoint
        self.potentialEnemyCastleLocation.shift();
        self.target = self.potentialEnemyCastleLocation[0];
    }

    //TODO No more patrol waypoint, do nothing
    if(self.potentialEnemyCastleLocation.length === 0)
    {
        return;
    }

    //If no path yet
    if(self.path.length === 0)
    {
        if(movement.aStarPathfinding(self, self.me, self.target, false)) 
        {
            self.log(self.path);
        } 
        else 
        {
            self.log('Cannot get path to enemy base');
            return;
        }
    }

    //If first seven turns, move away from allied base towards enemy base, else check if squadSize threshold is met and is 0
    if(self.me.turn < 6)
    {
        self.log('ATTACKER prophet ' + self.id + ' moving to rally point, Current: [' + self.me.x + ',' + self.me.y + ']');
        return movement.moveAlongPath(self);
    }
    else if(self.squadSize === 0)
    {
        self.log('ATTACKER prophet ' + self.id + ' moving towards enemy base, Current: [' + self.me.x + ',' + self.me.y + ']');
        return movement.moveAlongPath(self);
    }
    

    let squad = combat.filterByRange(visibleRobots, self.me, 0, 64);
    squad = combat.filterByUnitType(squad, "PROPHET");

    //Check if threshold is reached, then just move towards enemy base
    if(squad.length >= self.squadSize) 
    {
        self.log('ATTACKER prophet ' + self.id + ' squad threshold reached! Deathballing');
        self.squadSize = 0;

        return;
    }
    //Should not fall through unless attacker with squadSize threshold not reached yet
    self.log('prophet ' + self.role + ' ' + self.me.id + ' doing nothing');
    return;
};


prophet.fleeBehavior = (self, visibleRobots) => {
    let minUnattackable = combat.filterByTeam(self, visibleRobots, -1);
    minUnattackable = combat.filterByRange(minUnattackable, self.me, 0, SPECS.UNITS[self.me.unit].ATTACK_RADIUS[0]-1);

    
    //Set 'fleeing behavior?' (whenattack target < min attack range)
    if(minUnattackable.length > 0)
    {
        const attacker = minUnattackable[0];
        const direction = movement.getRelativeDirection(self.me, attacker);
        const directionIndex = movement.getDirectionIndex(direction);
        const moveablePositions = movement.getMoveablePositions(self);

        //Filter for opposite directions perpendicular/ away potential moveable position and is passable
        moveablePositions.filter((location) => {
            if((directionIndex <= location.dirIndex + 2 && directionIndex >= location.dirIndex - 2) 
                && location.r2 <= SPECS.UNITS[self.me.unit].SPEED
                && movement.isPassable(location))
                return true;

            return false;
        });

        //No possible location to flee to, return false
        if(moveablePositions.length === 0)
        {
            return false;
        }

        let minDiffDir = 3;
        let maxDist = 0;
        let bestLoc = null;

        //Get moveable position with lower than minDiffDir and greater than maxDist
        for(let i = 0; i < moveablePositions.length; ++i)
        {
            const current = moveablePositions[i];
            const diffDir = Math.abs(current.dirIndex-directionIndex);
            if(diffDir <= minDiffDir && current.r2 >= maxDist)
            {
                bestLoc = {x: current.x, y: current.y};
                minDiffDir = diffDir;
                maxDist = current.r2;
            }
        }

        if(bestLoc != null)
        {
            //There is a fleeing coord
            //Store retreat position and current position in path (for backtrack after fleeing behavior is done)
            self.path.unshift(bestLoc, self.me);
            self.log("Prophet " + self.id + "Fleeing from attacker" + attacker.unit + " " + attacker.id + " to x: " + bestLoc.x + ", y: " + bestLoc[0].y);
            return true;
        }
        return false;
    }
    return false;
};

const castle = {};


castle.doAction = (self) => {

    self.log("castle" + self.id + "taking turn.");
  
    castle.recordPosition(self);
    castle.findPosition(self);
    //On first turn:
    //  1. add to castleBuildQueue with pilgrims for each local karbonite depot
    //  2. add to castleBuildQueue with pilgrims for each local fuel depot
    //  3. add to castleBuildQueue a single prophet targeting the mirror castle.
    //This ensures that all local depots are filled and a prophet will be built after
    if(self.me.turn === 1)
    {
        const karboniteDepots = movement.getResourcesInRange(self.me, 16, self.karbonite_map);
        karboniteDepots.forEach(depot => {
            self.castleBuildQueue.push({unit: "PILGRIM", x: depot.x, y: depot.y});
        });
        const fuelDepots = movement.getResourcesInRange(self.me, 16, self.fuel_map);
        fuelDepots.forEach(depot => {
            self.castleBuildQueue.push({unit: "PILGRIM", x: depot.x, y: depot.y});
        });
        const mirrorCastle = movement.getMirrorCastle(self.me, self.map);
        self.castleBuildQueue.push({unit: "PROPHET", x: mirrorCastle.x, y: mirrorCastle.y});
        self.log(self.castleBuildQueue);
        return castle.buildFromQueue(self);
    }
    else if (self.castleBuildQueue.length > 0) 
    {
        self.log("BUILD QUEUE NON-EMPTY");
        self.log(self.castleBuildQueue);
        const botsInQueue = self.castleBuildQueue.length;
        //Keep queue at reasonable size, adding another prophet as necessary so prophets are continually build
        if (botsInQueue <= 5) {
            self.castleBuildQueue.push(self.castleBuildQueue[botsInQueue-1]);
        }
        return castle.buildFromQueue(self);
    }
    else 
    {
        //Check if there are enough resources to produce this unit.
       if(self.fuel >= SPECS['PROPHET'].CONSTRUCTION_FUEL && self.karbonite >= SPECS['PROPHET'].CONSTRUCTION_KARBONITE){
           return castle.findUnitPlace(self, 'PROPHET');
       }
       return;
    }

};

castle.findUnitPlace = (self, unitType) => {
    //Check if any of the adjacent tile is available. Place the unit if true.
    for(let i = -1; i<= 1; i++){   
        for(let j = -1; j<= 1; j++){
            const location = {x: (self.me.x + i), y: (self.me.y +j)}; 
            if(movement.isPassable(location, self.map, self.getVisibleRobotMap()))
            {
                self.log('castle ' + self.id + ' building unit ' + unitType + ' at [' + (self.me.x+i) + ',' + (self.me.y+j) +']'); 
                return self.buildUnit(SPECS[unitType], i, j);       
            }
        }
    }
    return;
};


/**
 * Method to build next unit pushed on `castleBuildQueue`. Currently no checks that should be implemented
 */
castle.buildFromQueue = (self) => {
    const nextBuild = self.castleBuildQueue[0];
    //If you are able to build next unit, signal coordinates so it knows where to go and build it
    if(self.fuel >= SPECS.UNITS[SPECS[nextBuild.unit]].CONSTRUCTION_FUEL && 
       self.karbonite >= SPECS.UNITS[SPECS[nextBuild.unit]].CONSTRUCTION_KARBONITE) {
        self.castleBuildQueue.shift();
        self.signal(communication.positionToSignal(nextBuild, self.map), 2);
        return castle.findUnitPlace(self, nextBuild.unit);
    } else {
        self.log('cannot build unit ' + nextBuild.unit + '- not enough resources');
        return;
    }
};


/** Each castle will try to locate and record the positions of the friendly castles at the start of the game
 * Input: self = this is the reference to the object to the calling method. 
 * Output: returnPosition = return value containing the positions of the friendly castle       
 *  */

castle.recordPosition = (self) => {
    let turn = self.me.turn;
    if(turn == 1){
        self.castleTalk(self.me.x);
    }
    if(turn == 2){
        self.castleTalk(self.me.y);
    }
    
};

/**Find positions of the friendly castles. 
 * Input: self, this is the reference to the object to the calling method.
 * Output: positions of other friendly castles.
 */
castle.findPosition = (self) => {
    const bots = self.getVisibleRobotMap().filter(bots =>{
        return bots.team === self.me.team && bots.units === 0;
    });
    let turn = self.me.turn;
    //let storeFriendlyCastles;

    bots.forEach(foundCastle => {
        self.teamCastles.forEach(teamCastle =>{
            if(foundCastle.id == teamCastle.id){
                if(turn == 2){
                    teamCastle.x = foundCastle.castle_talk;
                }
                if(turn == 3){
                    teamCastle.y = foundCastle.castle_talk;
                }
            }
        });
    });
};
/** Castle should calculate the locations of the enemy castles using the recorded postions. Use mirror castle method. 
 * Input : the location of the friendly castles
 * Output: mirrored images of the enemy castles
 */
castle.mirrorCastle = (myLocation, fullMap) => {
    const {x, y} = myLocation;
    const Ax = fullMap.length - x - 1;
    const Ay = fullMap.length - y - 1;
    const isHorizontal = movement.isHorizontalReflection(fullMap);
    
    if(isHorizontal)
    {
        return {x: x, y: Ay}
    }
    else
    {
        return {x: Ax, y: y};
    }
};

const church = {};
//Initial starting health of 100 and vision radius of 100

//are we explicitely assigning the unique 32 bit integer id?
//this unit always occupies single tile
//what about if the health reduces to zero and the unit is removed? how do we write it here?

church.doAction = (self) => {
    self.log("church " + self.id + " taking turn.");
    return;
};

church.doAction = (self)=> {
    self.log("producing" + r.id + "robot");
    //Churches produce robots, and provide a depot for Pilgrims to deposit resources into the global economy.
    //produce robots with their karbonite and fuel cost. 
    //the robots can be spawned in any adjacent square including diagonals. Robots have to be added to the end of the turn queue.

};

church.doAction = (self)=> {
    self.log("depositing fuel to "+ self.karbonite +" global storage.");
    self.log("depositing fuel to "+ self.fuel +" global storage.");
    //
};

class MyRobot extends BCAbstractRobot {
    constructor() {
        super();
        this.role = "UNASSIGNED";                        //Role for unit (for strategy purposes)
        this.target = null;                              //Target destionation like {x: _, y: _}  
        this.base = null;                                //Closest (or original) castle/church like {x: _, y: _} 
        this.teamCastles = [];                           //Array to hold info about friendly castles
        this.enemyCastles = [];                          //Array to hold info about identified enemy castles
        this.path = [];                                  //Array representing sequence of moves towards target. `path.pop()` gets next move
        this.previous = null;                            //Previous tile traversed by unit like {x: _, y: _}, initialized to the spawning/ starting location
        this.potentialEnemyCastleLocation = null;
        this.occupiedResources = [];
        this.squadSize = null;                           //Squad size for squad movements
        this.castleBuildQueue = [];                      //Queue for what units the castle should build. NOT related to which castles should build when
    }
    turn() {
        if(this.previous == null) {
            this.previous = {x: this.me.x, y: this.me.y};
        }
        if (this.myType === undefined){
            switch(this.me.unit) {
                case SPECS.CASTLE:
                    this.myType = castle;
                    break;
                case SPECS.CHURCH:
                    this.myType = church;
                    break;
                case SPECS.PILGRIM:
                    this.myType = pilgrim;
                    break;
                case SPECS.PROPHET:
                    this.myType = prophet;
                    break;
            }
        }
        return this.myType.doAction(this);
    }
}

/* eslint-disable no-unused-vars */
var robot = new MyRobot();
/* eslint-enable no-unused-vars */
var robot = new MyRobot();

module.exports = {castle,church,combat,communication,movement,pilgrim,prophet,MyRobot};