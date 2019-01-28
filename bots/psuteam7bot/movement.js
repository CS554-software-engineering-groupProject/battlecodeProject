const movement = {}

//Array for getting direction after rotation
movement.directions = [{ x: 0, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: -1, y: 1 }, { x: -1, y: 0 }, { x: -1, y: -1 }]

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
    const {x, y} = movement.getRelativePosition(A, B);

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
        if(direction === directions[i])
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
    const {x, y} = movement.getRelativePosition(A, B);

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
    return ((A.x-B.x)*(A.y-B.y)+(A.y-B.y)*(A.y-B.y));
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
    const midLength = fullmap.length/2;
    
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
*Output:    RetVal  -   An array containing 2 {x, y} objects, which are the potential 'location' of enemy Castles
*
*TODO: Have the team's castles communicate at start of game to potentially improve accuracy. 
*Given the team's starting castles are in different quadrants, can accurately calculate location of enemy castle
*/
movement.getPotentialEnemyCastleLocation = (myCastleLocation, fullmap) => {
    const {x, y} = myCastleLocation;

    const midLength = fullmap.length/2;
    const distX = 2*(midLength-x);
    const distY = 2*(midlength-y);
    const quadrant = movement.checkQuadrant(myCastleLocation, fullmap);

    let Ax = null;
    let By = null;
    if(quadrant === 1)  //Enemy in quadrant 2 or 3
    {
        Ax = (x+distX);
        By = (y+distY);
    }
    if(quadrant === 2)  //Enemy in quadrant 1 or 4
    {
        Ax = (x-distX);
        By = (y+distY);
    }
    if(quadrant === 3)  //Enemy in quadrant 1 or 4
    {
        Ax = (x+distX);
        By = (y-distY);
    }
    if(quadrant === 4)  //Enemy in quadrant 2 or 3
    {
        Ax = (x-distX);
        By = (y-distY);
    }

    return [{x: Ax, y}, {x, y: By}];
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
movement.dumberMoveTowards = (location, fullMap, robotMap, destination, previous) => {
    let direction = movement.getRelativeDirection(location, destination);
    let {x, y} = location;
    let candidate = {x : (x+direction.x), y: (y+direction.y)}

    if(movement.isPassable(candidate, fullMap, robotMap))
        return candidate;

    let dirA = direction;
    let dirB = direction;

    do{
        dirA = movement.rotateDirection(dirA, 1);
        dirB = movement.rotateDirection(dirB, -1);

        let candidateA = {x : (x+dirA.x), y: (y+dirA.y)}
        if(candidateA !== previous && movement.isPassable(candidateA, fullMap, robotMap))
            return candidateA;

        let candidateB = {x : (x+dirB.x), y: (y+dirB.y)}
        if(candidateB !== previous && movement.isPassable(candidateB, fullMap, robotMap))
            return candidateB;
    }while(!(dirA.x === direction.x && dirA.y === direction.y));

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
    const maxDist = SPECS.UNITS[self.me.unit].SPEED;
    let fullMap = self.map;
    let robotMap = self.getVisibleRobotMap();
    let distance = movement.getDistance(self.me, destination);
    const maxFuelCost = (distance * SPECS.UNITS[self.me.unit].FUEL_PER_MOVE);

    //Looking through 'API questions' discord channel, 'karbonite' and 'fuel' seems to be the way to get global team's karbonite and fuel
    if(fuel < maxFuelCost)
        maxDist = Math.floor(fuel/FUEL_PER_MOVE);


    //Case 0: No movement
    if(distance <= 0)
        return {x: -1, y: -1};

    //Case 1: move towards dest
    let current = {
        x: self.me.x, 
        y: self.me.y
    };
    let previous = self.me.previous;

    for(let distTravelled = 0; distTravelled < maxDist; ++distTravelled)
    {
        let temp = movement.dumberMoveTowards(current, fullMap, robotMap, destination, previous);
        previous = current;
        current = temp;
    }

    return current;
}

export default movement