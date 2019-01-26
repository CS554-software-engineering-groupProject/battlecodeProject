const movement = {}

movement.directions = [{ x: 0, y: -1 }, { x: 1, y: -1 }, { x: -1, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: -1, y: 1 }]

//Return relative position of point A from point B
movement.getRelativePosition = (A, B) => {
    const x = (A.x-B.x);
    const y = (A.y-B.y);
    return {x, y};
}

//Return relative direction of B from point A
movement.getRelativeDirection = (A, B) => {
    const {x, y} = getRelativePosition(A, B);

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

//Get result of n-times rotation of the direction passed in
movement.rotateDirection = (direction, n) => {
    const dirsLen = movement.directions.length;
    let {x, y} = direction;
    let currIndex = null;
    for(let i = 0; i < dirsLen; ++i)
    {
        if(x === movement.directions[i].x && y === movement.directions[i].y)
        {
            currIndex = i;
            break;
        }
    }
    currIndex = (((currIndex + n) % dirsLen) + dirsLen) % dirsLen;
    return (movement.directions[currIndex]);
}

//Return difference of x-coord and y-coord between A and B
movement.getDistanceXY = (A, B) => {
    const {x, y} = getRelativePosition(A, B);

    x = Math.abs(x);
    y = Math.abs(y);
    return {x, y};
}

//Return squared straight line distance between coord A and coord B
//Squared distance as to not introduce inaccuracy, use it as relative distance
movement.getDistance = (A, B) => {
    return ((A.x-B.x)*(A.y-B.y)+(A.y-B.y)*(A.y-B.y));
}

//Checks in which map quadrant the given coordinate is in
//1 = Top Left
//2 = Top Right
//3 = Bottom Left
//4 = Bottom Right
//Used for guessing starting/ spawning location of enemy castle, and (Advanced) influence 'Pioneer Pilgrims' decision 
//e.g. prefer building churches in enemy quadrant (steal resource, proxy church for building units closer to enemy base) or friendly quadrant (safer) - in case castle is close to midline
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

//Calculate enemy castle starting location
//Returns an array with 2 potential location
movement.getPotentialEnemyCastleLocation = (myCastleLocation, fullmap) => {
    const {x, y} = myCastleLocation;

    const midLength = fullmap.length/2;
    const distX = 2*(midLength-x);
    const distY = 2*(midlength-y);
    const quadrant = checkQuadrant(myCastleLocation, fullmap);

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

    return [{Ax, y}, {x, By}];
}

//Check and return whether tile at specified coordinate is passable
//Used for movement, placing built/ spawned units
//location = tile to be checked
//fullMap = value of robot.map / return value of robot.getPassableMap
//robotMap = return value of robot.getVisibleRobotMap (For checking occupied tiles)
movement.isPassable = (location, fullMap, robotMap) => {
    const {x, y} = location;

    if(x < 0 || y < 0)  //Map bound check
        return false;
    else if(x > fullMap.length || y > fullMap.length)   //Map bound check
        return false;
    return((robotMap[y][x] === 0) && (fullMap[y][x])); //Returns true only if tile is empty and is passable
}

//Get closest resource depot location
//resourceMap can be either return value of getFuelMap or getKarboniteMap
movement.getClosestResource(location, resourceMap)
{
    const length = resourceMap.length;
    let closestLocation = null;
    let closestDist = 9001;
    for (let y = 0; y < length; ++y) 
    {
        for (let x = 0; x < length; ++x) 
        {
            if (resourceMap[y][x]) 
            {
                let currentDist = movement.getDistance(location, {x, y});
                if(currentDist < closestDist)
                {
                    currentLocation = {x, y};
                    closestDist = currentDist;
                }
            }
        }
    }
    return closestLocation;
}


//Return an array of resource depot locations sorted by distance from location passed as parameter
//Might exceed chess clock? remove if so...
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

//For robot movement from point A to Point B
//Input reference to robot and destination location in {x, y}
//Output should be point C, location to call robot.move with.
//Returns {-1, -1} if distance from robot location to destination <= 0
movement.moveTowards = (self, destination) => {
    const maxDist = SPECS.UNITS[self.me.unit].SPEED;
    let distance = getDistance(self.me, destination);


    const maxFuelCost = (distance * SPECS.UNITS[self.me.unit].FUEL_PER_MOVE);

    //Looking through 'API questions' discord channel, 'karbonite' and 'fuel' seems to be the way to get global team's karbonite and fuel
    if(fuel < maxFuelCost)
        distance = Math.floor(fuel/FUEL_PER_MOVE);

    var Deque = require("collections/deque");

    let {dx, dy} = destination;
    let x = -1;
    let y = -1;

    //Case 0: No movement
    if(distance <= 0)
        return {x, y};

    if(distance > maxDist)
    {
        let {distX, distY} = getDistanceXY(self.me, destination);
        let rDist = Math.sqrt(maxDist);
        let direction = getRelativeDirection(self.me, destination);

        if(distX < rDist)
            dx%=rDist;
        if(distY < rDist)
            dy%=rDist;

        dx *= direction.x;
        dy *= direction.y;
    }

    var deque = new Deque([{x, y, c:0}])



    //Check possible passable paths towards destination, return location of a point C tile which has the shortest distance to destination
    //Might exceed chess clock, need to check after implementing, if so, replace with simpler pathfinding
    return {x, y};
}

export default movement