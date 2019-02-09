import {SPECS} from "battlecode";
const movement = {}

//Array for getting direction after rotation
movement.directions = [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: -1 }, { x: -1, y: -1 }, { x: -1, y: 0 }, { x: -1, y: 1 }]

/*Checks whether the x and y values of position A and B are equivalent
*Input: A - a 'position/ location' object {x, y}
*       B - a 'position/ location' object {x, y}
*Output:    retVal - true if x and y matches, false otherwise
*/
movement.positionsAreEqual = (A, B) =>{
    return (A.x === B.x && A.y === B.y);
}

/*Return relative position of point B from point A
*Input: A - a 'position/ location' object {x, y}
*       B - a 'position/ location' object {x, y}
*Output:    retVal - an object {x, y}, containing how many x and y steps needed from A to reach B
*/
movement.getRelativePosition = (A, B) => {
    const x = (B.x-A.x);
    const y = (B.y-A.y);
    return {x, y};
}

/*Return relative direction of B from point A
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

/*Get index of the element matching direction in directions
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

/*Get result of n-times rotation of the direction passed in
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

/*Return difference of x-coord and y-coord between A and B
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

/*Return squared straight line distance between coord A and coord B
*Squared distance as to not introduce inaccuracy, use it as relative distance
*Input: A - a 'position/ location' object {x, y}
*       B - a 'position/ location' object {x, y}
*Output:    retVal - an integer value, the squared value of the distance from A to B
*/
movement.getDistance = (A, B) => {
    return ((A.x-B.x)*(A.x-B.x)+(A.y-B.y)*(A.y-B.y));
}

/*Checks in which map quadrant the given coordinate is in

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

/*Calculate and return enemy castle's potential starting location
*Input:     myCastleLocation    -   the Castle's 'position/ location' object, should be self.me
*           fullMap             -   the full map, Should be self.map or or self.getPassableMap()
*Output:    RetVal  -   An array containing 3 {x, y} objects, 2 of which are the potential 'location' of enemy Castle mirrorring base, 
                        and the third a position of an enemy quadrant to check if the mirror castle is destroyed
*
*TODO: Have the team's castles communicate at start of game to potentially improve accuracy. 
*Given the team's starting castles are in different quadrants, can accurately calculate location of enemy castle
*/
movement.getAttackerPatrolRoute = (myCastleLocation, fullMap) => {
    const {x, y} = myCastleLocation;
    const Ax = fullMap.length - x - 1;
    const Ay = fullMap.length - y - 1;

    return [{x: Ax, y: y}, {x: x, y: Ay}, {x: Ax, y: Ay}];
}

/*Check and return whether tile at specified coordinate is passable
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
}

/*Return an array of resource depot locations sorted by distance from location passed as parameter
*Use Case: for pioneers?
*Might exceed chess clock? remove if so...
*TODO: Might be unnecessary
*/
/*
movement.getSortedResourceList(location, resourceMap)
{
    const length = resourceMap.length;
    var sortedArr = [];
    var distArr = [];
    var currentDist;

    for (let y = 0; y < length; ++y) 
    {
        for (let x = 0; x < length; ++x) 
        {
            if (resourceMap[y][x]) 
            {
                currentDist = movement.getDistance(location, {x, y});

                if(sortedArr.length === 0)
                {
                    sortedArr = [{x, y}];
                    distArr = [currentDist];
                }

                for(let i = 0; i < sortedArr.length; ++i)
                {
                    if(currentDist < distArr[i])
                    {
                        sortedArr.splice(i, 0, {x, y});
                        distArr.splice(i, 0, currentDist);
                        break;
                    }
                }
            }
        }
    }
    return sortedArr;
}
*/

/*A more simple moveTowards, move to a nearby passable adjacent tile, hopefully closer to destination
*Input: self        -   The robot unit
*       destination -   The destination 'position/ location' object {x, y}
*Output:    retVal  -   A 'position/ location' object {x, y} which is adjacent to self.me 
*                   -   OR self.me if they are all not passable
*version of dumberMoveTowards with robot not recording a previous, might get stuck in corner
*/
/*
movement.dumberMoveTowards = (self, destination) => {
    let fullMap = self.map;
    let robotMap = self.getVisibleRobotMap();
    let direction = getRelativeDirection(self.me, destination);
    let {x, y} = self.me;
    let candidate = {x : (x+direction.x), y: (y+direction.y)}


    let initDirection = initDirection;
    do{
        if(isPassable(candidate, fullMap, robotMap))
            return candidate;

        direction = movement.rotateDirection(direction, 1);
    }while(direction !== initDirection);

    return self.me;
}
*/

/*The most simplest moveTowards, get location of a nearby passable adjacent tile, hopefully closer to destination
*Input:     location    -   the robot's 'position/ location' object, should be self.me
*           fullMap     -   the full map, should be self.map or self.getPassableMap()
*           robotMap    -   robot map, should be self.getVisibleRobotMap()
*           destination -   The destination 'position/ location' object {x, y}
*           previous    -   A 'position/ location' object {x, y}, should be self.previous/ the position the robot was in the previous turn
*Output:    retVal          -   A 'position/ location' object {x, y} which is adjacent to self.me 
*                           -   OR the passed in location if they are all not passable
*/
/*
movement.dumberMoveTowards = (location, fullMap, robotMap, destination, previous, previousprevious) => {
    let direction = movement.getRelativeDirection(location, destination);
    let {x, y} = location;
    let candidate = {x : (x+direction.x), y: (y+direction.y)}

    do{
        candidate = {x : (x+direction.x), y: (y+direction.y)};
        if(movement.isPassable(candidate, fullMap, robotMap) && !(movement.positionsAreEqual(candidate, previous)) && !(movement.positionsAreEqual(candidate, previousprevious)))
            return candidate;

        direction = movement.rotateDirection(direction, 1);
    }while(!(movement.positionsAreEqual(candidate, previous)));

    return location;
}
*/

/*The most simplest moveTowards, get location of a nearby passable adjacent tile, hopefully closer to destination
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

/*More complex pathfinding algorithm to check passable path of a robot's current location/ position towards a destination and get the closest possible position to destination
*
*/
/*
movement.pathFinding = (self, destination) => {
    return;
}
movement.pathfinding = (self, destination) => {
    const maxDist = SPECS.UNITS[self.me.unit].SPEED;
    let distance = getDistance(self.me, destination);
    const maxFuelCost = (distance * SPECS.UNITS[self.me.unit].FUEL_PER_MOVE);

    //Looking through 'API questions' discord channel, 'karbonite' and 'fuel' seems to be the way to get global team's karbonite and fuel
    if(fuel < maxFuelCost)
        distance = Math.floor(fuel/FUEL_PER_MOVE);

    let {dx, dy} = destination;
    let direction = getRelativeDirection(self.me, destination);
    let x = -1;
    let y = -1;

    //Get number of XY tile moves to get to the location in moverange that is closest to destination
    if(distance > maxDist)
    {
        let {distX, distY} = getDistanceXY(self.me, destination);
        let rDist = Math.sqrt(maxDist);

        if(distX > rDist && distY > rDist)
        {
            dx = rDist;
            dy = rDist;
        } 
        else if(distX < rDist && distY > rDist)
        {
            dy = maxDist-dx;
        }
        else if(distX > rDist && distY < rDist)
        {
            dx = maxDist-dy;
        }

        x = dx * direction.x;
        y = dy * direction.y;
    }
    x += self.me.x;
    y += self.me.y;

    //Goal is the location in moverange that is closest to destination, may be impassable
    let goal = {x,y};
}
*/

/*A simple movement function for robot movement from point A to Point B,
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

/*Function to check whether map is created using horizontal or vertical reflection,
*Input: fullMap     -  the full map, should be self.map or self.getPassableMap()
*Output:    retVal  -   false if the map is a vertical reflection
*                   -   OR true if it is a horizontal reflection 
*/
movement.isHorizontalReflection = (fullMap) => {
    let y = 0;
    let x = 0;
    const length = fullMap.length;
    let mirror = length-1;

    while(y < length)
    {
        while(x != mirror)
        {
            if(fullMap[y][x] !== fullMap[y][mirror])
            {
                return false
            }
            ++x;
            --mirror;
        }
        ++y;
        mirror = length - 1;
        x = 0;
    }
    return true;
}

/*Calculate and return enemy castle's potential starting location
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

export default movement
