import {BCAbstractRobot, SPECS} from 'battlecode';
import movement from './movement.js';
import combat from './combat.js';
import communication from './communication.js';

const castle = {};


castle.doAction = (self) => {

    self.log("castle" + self.id + "taking turn.");
  
    castle.recordPosition(self);
    castle.findPosition(self);
    if(self.me.turn === 5)
    {
        self.enemyCastles = movement.getEnemyCastleLocations(self.teamCastles, self.map);
        self.log("Enemy castles: ");
        self.log(self.enemyCastles);
    }

    //On first turn:
    //  1. add to castleBuildQueue with pilgrims for each local karbonite depot
    //  2. add to castleBuildQueue with pilgrims for each local fuel depot
    //  3. add to castleBuildQueue a single crusader targeting the mirror castle.
    //This ensures that all local depots are filled and a crusader will be built after
    if(self.me.turn === 1)
    {
        const karboniteDepots = movement.getResourcesInRange(self.me, 16, self.karbonite_map);
        karboniteDepots.forEach(depot => {
            self.castleBuildQueue.push({unit: "PILGRIM", x: depot.x, y: depot.y});
        })
        const fuelDepots = movement.getResourcesInRange(self.me, 16, self.fuel_map)
        fuelDepots.forEach(depot => {
            self.castleBuildQueue.push({unit: "PILGRIM", x: depot.x, y: depot.y});
        })
        const mirrorCastle = movement.getMirrorCastle(self.me, self.map)
        self.target = mirrorCastle;
        self.log(self.castleBuildQueue)
        return castle.buildFromQueue(self);
    }
    else if (self.castleBuildQueue.length > 0) 
    {
        if(self.me.turn > 5)
        {
            castle.checkUnitCastleTalk(self);
            castle.signalNewUnitTarget(self);
        }
        self.log("BUILD QUEUE NON-EMPTY")
        self.log(self.castleBuildQueue)
        const botsInQueue = self.castleBuildQueue.length;
        //Keep queue at reasonable size, adding another crusader as necessary so crusaders are continually build
        if (botsInQueue <= 5) {
            self.castleBuildQueue.push({unit: "CRUSADER", x: self.target.x, y: self.target.y});
        }
        return castle.buildFromQueue(self);
    }
    else 
    {
        castle.checkUnitCastleTalk(self);
        castle.signalNewUnitTarget(self);
        self.log("BUILD QUEUE EMPTY, ATTEMPTING TO BUILD CRUSADER")
        //Check if there are enough resources to produce this unit.
       if(self.fuel >= SPECS.UNITS[SPECS.CRUSADER].CONSTRUCTION_FUEL && self.karbonite >= SPECS.UNITS[SPECS.CRUSADER].CONSTRUCTION_KARBONITE) {
            self.castleBuildQueue.push({unit: "CRUSADER", x: self.target.x, y: self.target.y});
            return castle.buildFromQueue(self);
       }
       self.log("NOT ENOUGH RESOURCE")
       return;
    }

}

castle.findUnitPlace = (self, unitType) => {
    //Check if any of the adjacent tile is available. Place the unit if true.
    for(let i = -1; i<= 1; i++){   
        for(let j = -1; j<= 1; j++){
            const location = {x: (self.me.x + i), y: (self.me.y +j)} 
            if(movement.isPassable(location, self.map, self.getVisibleRobotMap()))
            {
                self.log('castle ' + self.id + ' building unit ' + unitType + ' at [' + (self.me.x+i) + ',' + (self.me.y+j) +']'); 
                return self.buildUnit(SPECS[unitType], i, j);       
            }
        }
    }
    return;
}


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
}


/** Each castle will try to locate and record the positions of the friendly castles at the start of the game
 * Input: self = this is the reference to the object to the calling method. 
 * Output: returnPosition = return value containing the positions of the friendly castle       
 *  */

castle.recordPosition = (self) => {
    let turn = self.me.turn;
    if(turn === 1|| turn === 2){
        //self.log("Sent x-coord: " + self.me.x);
        self.castleTalk(self.me.x);
    }
    if(turn === 3|| turn === 4){
        //self.log("Sent y-coord: " + self.me.x);
        self.castleTalk(self.me.y);
    }
    
}

/**Find positions of the friendly castles. 
 * Input: self, this is the reference to the object to the calling method.
 * Output: positions of other friendly castles.
 */
castle.findPosition = (self) => {
    const bots = self.getVisibleRobots().filter(bots =>{
        return bots.team === self.me.team && bots.castle_talk;
    })
    let turn = self.me.turn;
    self.log("turn: " + turn);
    //let storeFriendlyCastles;

    bots.forEach(foundCastle => {
        if(turn === 2){
            //self.log("Received id: " + foundCastle.id + ", x-coord: " + foundCastle.castle_talk);
            self.teamCastles.push({id: foundCastle.id, x: foundCastle.castle_talk})
        }
        if(turn === 4){
            self.teamCastles.forEach(teamCastle => {
                if(foundCastle.id === teamCastle.id)
                {
                    //self.log("Received y-coord: " + foundCastle.castle_talk);
                    teamCastle.y = foundCastle.castle_talk;
                }
            })
            //self.log("Team castles: ");
            //self.log(self.teamCastles);
        }
    });
}
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
}

/** Each castle should be able to check for messages from their friendly castles 
 * Use of this.getVisibleRobots() to see the robots in the vicinity 
 * 
 * Input: self, this is the reference to the object to the calling method.
 * Output: message from other castles
 * castle.checkMessage = (self) => {
    const visibleRobots = this.getVisibleRobotMap().filter(bots =>{
        return bots.team === self.me.team && bots.unit === 0;
    })
    const filterdCastle;
    for(i = 0; i< filterdCastle ; i ++)
    {  
        const id = 0;
        this.castle_talk(id);
        return castle.checkMessage(self)
    }
    return;
}
 */


 /**
  * Check castle talk message from units other than castles, if found, treat it as the x-coord or y-coord of a destroyed enemy castle
  * remove the destroyed enemy castle from the array of enemy castles, and set self.target to null
  */
 castle.checkUnitCastleTalk = (self) => {
    const alliedUnits = self.getVisibleRobots().filter(bot =>{
        return bot.team === self.me.team && bot.castle_talk;
    })
    const length = alliedUnits.length;
    let enemyCastlesLength = self.enemyCastles.length
    

    for(let i = 0; i < length; ++i)
    {  
        self.log("Castle talk received: " + alliedUnits[i].castle_talk);
        //self.log("Enemy castles: ");
        //self.log(self.enemyCastles);
        let messageValue = alliedUnits[i].castle_talk;
        
        //Castle talk is in the range 0-63 inclusive, reserved for coords - assume as destroyed enemy castle loc
        if(messageValue >= 0 && messageValue < 64)
        {
            //Look for a partial message from the bot in receivedMessages
            for(let j = 0; j < self.receivedMessages.length; ++j)
            {
                if(alliedUnits[i].id === self.receivedMessages[j].id)
                {
                    self.receivedMessages[j].y = messageValue;
                    const enemyCastle = self.receivedMessages.splice(j, 1)[0];
                    j -= 1;
                    //Remove from enemy Castles array if match coords and store in pending message
                    for(let k = 0; k < enemyCastlesLength; ++k)
                    {
                        if(movement.positionsAreEqual(enemyCastle, self.enemyCastles[k]))
                        {
                            const removedCastle = self.enemyCastles.splice(k,1)[0];
                            enemyCastlesLength = self.enemyCastles.length;
                            //self.log("Enemy castle removed from array----------------------------------------------------------------------------------------")
                            //self.log(self.target);
                            //self.log(removedCastle);
                            if(movement.positionsAreEqual(self.target, removedCastle) && enemyCastlesLength > 0)
                            {
                                self.target = self.enemyCastles[0];
                                self.pendingMessages.push(communication.positionToSignal(self.target, self.map));
                                //self.log("Signal stored-------------------------------------------------------------------------------------------");
                                //self.log(self.pendingMessages);
                                return;
                            }
                        }
                    }
                }
            }
            //No partial message yet, add partial message to receivedMessages
            self.receivedMessages.push({id: alliedUnits[i].id, x: messageValue});
        }
    }
    return;
 }

 /**
  * Checks whether there are pending messages to broadcast, pop it from the list and broadcast it if there is enough fuel
  */
castle.signalNewUnitTarget = (self) =>{
    if(self.pendingMessages.length > 0)
    {
        if(self.fuel > self.map.length)
        {
            const newTarget = self.pendingMessages.pop();
            self.signal(newTarget, self.map.length*self.map.length);
            //self.log("Signal sent to units, " + newTarget + "---------------------------------------------------------------------------------------------------------");
        }
        else
        {
            self.log("Not enough fuel to send signal");
        }
    }
}

/**
 * Method t
 */
castle.findBestDepots = (self, searchAggressively) => {
    let clusters = [];
    
    const mapHorizonal = movement.isHorizontalReflection(self.map);
    const castleDistXY = movement.getDistanceXY(self.me, movement.getMirrorCastle(self.me, self.map));
    const castleDistance = castleDistXY.x + castleDistXY.y;
    const competitionIndex = 2/3; //Alter this value from 0 to 1 to affect how far we search for clusters
    const rangeLimit = Math.ceil(castleDistance*competitionIndex);
    const midPoint = {x: self.me.x+castleDistXY.x, y: self.me.y+castleDistXY.y};

    for(let y = 0; y < self.map.length; y++) {
        for(let x = 0; x < self.map.length; x++) {
            if(self.karbonite_map[y][x] || self.fuel_map[y][x]) {
                let currentCheck = {x: x, y: y, count: -1, dist: -1};
                currentCheck = castle.processLocalDepots(self, currentCheck);
                let nearbyIndex = clusters.findIndex(depot => {
                    return movement.getDistance(currentCheck, depot) <= 9 && depot.count >= currentCheck.count;
                });
                //If nothing nearby, add to clusters
                if(nearbyIndex < 0) {
                    clusters.push(currentCheck)
                //If nearby cluster but current better, add to cluster
                } else if (clusters[nearbyIndex].count > currentCheck.count || clusters[nearbyIndex].dist > currentCheck.count) {
                    clusters[nearbyIndex] = currentCheck;
                }
            }
        }
    }
    //Filter for those within reasonable range for which we can compete
    clusters = clusters.filter(target => {
        const {x, y} = movement.getDistanceXY(self.me, target);
        //If equal horizontally, compete for anything semi-near to midline in y-direction
        if(mapHorizonal) {
            return x <= rangeLimit;
        //If equal vertically, compete for anything semi-near to midline in x-direction
        } else {
            return y <= rangeLimit;
        }
    });
    //Sort by prioritizing more concentrated clusters
    clusters.sort((a,b) => {
        if(a.count > b.count) {
            return -1;
        } else if (a.count < b.count) {
            return 1;
        } else {
            return 0;
        }
    })

    //If search aggressively, prioritze targets just past midpoint to compete with oppoenent
    if(searchAggressively) {
        clusters.sort((a,b) => {
            let aNearMidpoint;
            let bNearMidpoint;
            if(mapHorizonal) {
                aNearMidpoint = a.x <= rangeLimit && a.x >= midPoint.x;
                bNearMidpoint = b.x <= rangeLimit && b.x >= midPoint.x;
            } else {
                aNearMidpoint = a.y <= rangeLimit && a.y >= midPoint.y;
                bNearMidpoint = b.y <= rangeLimit && b.y >= midPoint.y;
            }
            if (aNearMidpoint && !bNearMidpoint) {
                return -1;
            } else if (!aNearMidpoint && bNearMidpoint) {
                return 1;
            } else {
                return b.count - a.count;
            }
        })
    //Otherwise, prioritize things closer to you
    } else {
        clusters.sort((a,b) => {
            let aBeforeMidpoint;
            let bBeforeMidpoint;
            if(mapHorizonal) {
                aBeforeMidpoint = a.x <= midPoint.x+2;
                bBeforeMidpoint = b.x <= midPoint.x+2;
            } else {
                aBeforeMidpoint = a.y <= midPoint.y+2;
                bBeforeMidpoint = b.y <= midPoint.y+2;
            }
            if (aBeforeMidpoint && !bBeforeMidpoint) {
                return -1;
            } else if (!aBeforeMidpoint && bBeforeMidpoint) {
                return 1;
            } else {
                return b.count - a.count;
            }
        })
    }
    return clusters;
}

/**
 * Method to determine how many resource depots are around a given location.
 * @param self MyRobot object to access map
 * @param location Location to evaluate
 * @return Object contain location coordinates, count of number of depots within +/- 3 tiles in
 * x and y direction, plus sum of all R^2 distances to depots (smaller number means closer to all tiles)
 */
castle.processLocalDepots = (self, location) => {
    let count = 0;
    let dist = 0;
    for(let y = location.y-3; y <= location.y+3; y++) {
        for(let x = location.x-3; x <= location.x+3; x++) {
            if(self._bc_check_on_map(x, y)) {
                if(self.karbonite_map[y][x] || self.fuel_map[y][x]) {
                    ++count;
                    dist += movement.getDistance(location, {x: x, y: y});
                }
            }
        }
    }
    return { x: location.x, y: location. y, count: count, dist: dist};
}

export default castle;
