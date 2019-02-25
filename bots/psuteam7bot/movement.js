import {SPECS} from "battlecode";
const movement = {};

//Array for getting direction after rotation
movement.directions = [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: -1 }, { x: -1, y: -1 }, { x: -1, y: 0 }, { x: -1, y: 1 }]

/**
*Checks whether the x and y values of position A and B are equivalent
*Input: A - a 'position/ location' object {x, y}
*       B - a 'position/ location' object {x, y}
*Output:    retVal - true if x and y matches, false otherwise
*/
movement.positionsAreEqual = (A, B) =>{
    return (A.x === B.x && A.y === B.y);
}

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
}

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
}

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
}

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
}

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
}

/**
*Return squared straight line distance between coord A and coord B
*Squared distance as to not introduce inaccuracy, use it as relative distance
*Input: A - a 'position/ location' object {x, y}
*       B - a 'position/ location' object {x, y}
*Output:    retVal - an integer value, the squared value of the distance from A to B
*/
movement.getDistance = (A, B) => {
    return ((A.x-B.x)*(A.x-B.x)+(A.y-B.y)*(A.y-B.y));
}

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
}

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
    
}

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
    else if(x >= fullMap.length || y >= fullMap.length)   //Map bound check
        return false;
    return((robotMap[y][x] <= 0) && (fullMap[y][x])); //Returns true only if tile is empty and is passable
}

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
                    targets.push({x: x, y: y, distance: currentDist})
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
}

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
    let candidate = {x : (x+direction.x), y: (y+direction.y)}

    if(movement.isPassable(candidate, fullMap, robotMap))
        return candidate;

    let dirA = {x: direction.x, y: direction.y};
    let dirB = {x: direction.x, y: direction.y};
    let candidateA = {x : (x+dirA.x), y: (y+dirA.y)};
    let candidateB = {x : (x+dirB.x), y: (y+dirB.y)}

    do{
        dirA = movement.rotateDirection(dirA, 1);
        dirB = movement.rotateDirection(dirB, -1);

        candidateA = {x : (x+dirA.x), y: (y+dirA.y)}
        if(!(movement.positionsAreEqual(candidateA, previous)) && movement.isPassable(candidateA, fullMap, robotMap))
            return candidateA;

        candidateB = {x : (x+dirB.x), y: (y+dirB.y)}
        if(!(movement.positionsAreEqual(candidateB, previous)) && movement.isPassable(candidateB, fullMap, robotMap))
            return candidateB;
    }while(movement.positionsAreEqual(candidateA, previous) || movement.positionsAreEqual(candidateB,previous));

    return location;
}

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
}

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
}

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
}

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
}

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
}

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
}

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
    let nextMove = self.path.pop();

    //If next move is viable, do it
    if(movement.isPassable(nextMove, self.map, self.getVisibleRobotMap()) && movement.hasFuelToMove(self, nextMove)) {
        self.log("Unit " + self.me.id + " moving to: [" + nextMove.x + "," + nextMove.y + "]")
        return self.move(nextMove.x-self.me.x, nextMove.y-self.me.y);
    //If nextMove is passable (i.e. just not enough fuel), readd next move to path and wait until enough fuel
    } else if (movement.isPassable(nextMove, self.map, self.getVisibleRobotMap())) {
        self.path.push(nextMove);
        self.log("Unit " + self.me.id + " waiting for more fuel")
        return;
    //If next move not viable, reset path by readding next move, attempt to adjust path accounting for bots
    } else {
        self.path.push(nextMove);
        //If adjustment successful, recurse to move on new path
        if(movement.adjustPath(self, self.me)) {
            return movement.moveAlongPath(self)
        //Otherwise, just dont move (may want to fix)
        } else {
            self.log("bot " + self.me.id + " not moving due to path conflict");
            return;
        }
    }
}


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
    self.log('ADJUSTING PATH')
    const oldPath = self.path.slice(0);
    let remainingPath;
    let reconnectionPoint// = self.path.pop();
    let oldMoves = [];

    /*
        Repeatedly pop off list until a passible point in path is found. reconnectionPoint will be set to this
        passible location to reconnect design path from current location to reconnectionPoint 
    */
    self.log(self.path)
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
        self.log('GENERATED NEW PATH')
        self.log(self.path);
        return true;
    } else {
        self.log('MOVEMENT ADJUSTMENT UNNEEDED OR IMPOSSIBLE');
        self.path = oldPath;
        return false;
    }
}

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
}

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
            const dist = movement.getDistance(start, output)
            if(dist <= maxDist && !movement.positionsAreEqual(start, output)) {
                output.r2 = dist;
                output.dirIndex = movement.getDirectionIndex(movement.getRelativeDirection(start, output))
                moveablePositions.push(output);
            }
        }
    }
    return moveablePositions;
}

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
        self.log('Error - cannot do A* with no target')
        return false;
    } else if (movement.positionsAreEqual(location, destination)) {
        self.log("Don't use pathfinding when destination obvious")
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
        self.log("New path set:")
        self.log(self.path);
        return true;
    } else {
        self.log('Cannot get to target');
        return false;
    }
}

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
}


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
    //Sort list by distance and then potentially direction - small optimization?
    openQueue.sort((a, b) => {
        const aCell = infoMap[a.y][a.x];
        const bCell = infoMap[b.y][b.x];
        if(aCell.f < bCell.f) {
            return -2;
        } else if (aCell.f > bCell.f) {
            return 2;
        } else {
            return 0;
        }
    });
    const moveablePositions = movement.getMoveablePositions(self.me.unit);
    const current = openQueue.shift();
    const currCell = infoMap[current.y][current.x];
    const targetDirIndex = movement.getDirectionIndex(movement.getRelativeDirection(current, destination));
    //Add to closedMap, as it is now being processed
    closedMap[current.y][current.x] = true;


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
        const nextCell = infoMap[nextCoordinates.y][nextCoordinates.x];
        //If destination found, we found a path! Update this last parent and return true to indicate successful completion
        if(movement.positionsAreEqual(nextCoordinates, destination)) {
            nextCell.parent = current;
            return true;
        }
        //If coordinates not already processed, do stuff
        if(!closedMap[nextCoordinates.y][nextCoordinates.x]) {
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
    //If none of moveable are destination, return false
    return false;
}
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
}

movement.hasFuelToMove = (self, target) => {
    const dist = movement.getDistance(self.me, target);
    const cost = SPECS.UNITS[self.me.unit].FUEL_PER_MOVE * dist;
    return self.fuel >= cost;
}

export default movement;
