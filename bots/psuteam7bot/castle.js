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
        castle.makeMacroDecisions(self);
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
        self.macro.localPilgrims = karboniteDepots.length + fuelDepots.length;
        
        const mirrorCastle = movement.getMirrorCastle(self.me, self.map)
        self.target = mirrorCastle;
        self.log(self.castleBuildQueue);
        return castle.buildFromQueue(self);
    }
    else if (self.me.turn <= 4) 
    {
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
        const hasSignalToSend = castle.signalNewUnitTarget(self);
        const botsInQueue = self.castleBuildQueue.length;
        //Keep queue at reasonable size, adding another prophet as necessary so prophets are continually build
        if (botsInQueue <= 5) {
            self.castleBuildQueue.push({unit: "CRUSADER", x: self.target.x, y: self.target.y});
        }
        return castle.makeDecision(self, self.teamCastles, hasSignalToSend);
    }
}

/**
 * Method that sets properties of the `macro` object. Used to determine certain
 * strategies throughout the game
 */
castle.makeMacroDecisions = (self) => {
    const castleCount = self.teamCastles.length;
    const castleDistances = [];
    self.teamCastles.forEach(tc => {
        castleDistances.push(movement.getDistance(tc, movement.getMirrorCastle(tc, self.map)));
    });
    const competitionDepots = castle.findDepotClusters(self, 3, 0.7, true);
    const churchDepots = castle.findDepotClusters(self, 3, 0.7, false);
    const extraUnitArray = []

    if(castleCount === 1) {
        if(castleDistances[0] > 18) {
            self.macro.defenders = 0;
            self.macro.buildChurch = false;
            self.macro.turtle = false;
        } else {
            self.macro.defenders = 8;
            self.macro.turtle = true;
            self.macro.buildChurch = churchDepots.length > 0;
            self.macro.considerChurchTurn = 50;
        }
        competitionDepots.forEach(depot => {
            extraUnitArray.push({unit: "PROPHET", x: depot.x, y: depot.y});
        })
        self.castleBuildQueue = extraUnitArray.concat(self.castleBuildQueue);
    } else {
        self.macro.defenders = 3;
        self.macro.turtle = false;
        self.macro.buildChurch = churchDepots.length > 0;
        competitionDepots.forEach(depot => {
            extraUnitArray.push({unit: "PROPHET", x: depot.x, y: depot.y});
        })
    }

}


/**
 *  Method to check if any of the adjacent tile is available. Place the unit if true.
 */
castle.findUnitPlace = (self, unitType) => {
    for(let i = -1; i<= 1; i++){   
        for(let j = -1; j<= 1; j++){
            const location = {x: (self.me.x + i), y: (self.me.y +j)} 
            if(movement.isPassable(location, self.map, self.getVisibleRobotMap()))
            {
                //Send signal starting at turn 3 so you don't overrride location communication at start
                /*if(self.me.turn > 4) {
                    self.castleTalk(SPECS[unitType]);
                }*/

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
    const botsOnMap = combat.getVisibleAllies(self).length;
    let buildCount = 0  
    let fuelCap = 0 
    let karbCap = 0;
    if(self.me.turn > 20) {
        /*Take lesser of 1. bots built and 2. bots on map
          1. Case for when castle destroyed and new one starts building - ensures it starts sooner rather than when 
             bots at destroyed castle eventually eliminated
          2. Case for when you've built a lot but bots keep getting destroyed - ensures that you don't stop building
             if you need more on the map
        */
        buildCount = Math.min(self.teamCastles[0].buildCounter.total, botsOnMap);
        fuelCap = 50+5*buildCount; //25+25*self.teamCastles.length;
        karbCap = 20*self.teamCastles.length;
    }
    //If past very start of game and fuel amount low, don't build a unit
    if(self.fuel < fuelCap || self.karbonite < karbCap) {
        self.log('not building unit to conserve resources');
        return;
    //If you are able to build next unit, signal coordinates so it knows where to go and build it
    } else if(self.fuel >= SPECS.UNITS[SPECS[nextBuild.unit]].CONSTRUCTION_FUEL && 
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
    if(turn <= 2){
        self.castleTalk(self.me.x);
    }
    else if(turn <= 4){
        self.castleTalk(self.me.y);
    }
}

/**Find positions of the friendly castles. 
 * Input: self, this is the reference to the object to the calling method.
 * Output: positions of other friendly castles.
 */
castle.findPosition = (self) => {
    //Filter by those that have a castle talk, since apparently unit does not appear if not in vision radius
    const bots = self.getVisibleRobots().filter(bot =>{
        return bot.team === self.me.team && bot.castle_talk > 0;
    });
    let turn = self.me.turn;
    const buildCounter = {
        pilgrims:0,
        crusader:0,
        prophet:0,
        total:0
    }
    const maxDist = -2*Math.pow(self.map.length, 2)-1

    bots.forEach(foundCastle => {
        const addedToTeamCastles = self.teamCastles.findIndex(c => {
            return c.id === foundCastle.id;
        })
        //Init an item in teamCastles if not already in teamCastles for initial turns
        if (addedToTeamCastles < 0 && turn < 5) {
            self.teamCastles.push({
                id: foundCastle.id,
                x: 0, 
                y: 0, 
                buildCounter: buildCounter, 
                signalBuilding: false,
                mirrorCastleDestroyed: false,
                silentCount: 0
            })
        }

        self.teamCastles.forEach(teamCastle =>{
            if(foundCastle.id == teamCastle.id){
                if(turn == 2){
                    teamCastle.x = foundCastle.castle_talk;
                }
                if(turn == 4){
                    teamCastle.y = foundCastle.castle_talk;
                }  
                if(turn >= 5){
                    self.log("castle_talk: " + foundCastle.castle_talk)
                    if(foundCastle.castle_talk == 100){
                        teamCastle.buildCounter.total++;
                        teamCastle.signalBuilding = true;
                        teamCastle.silentCount = 0;
                    }
                    else if(foundCastle.castle_talk == 101){
                        teamCastle.signalBuilding = false;
                        teamCastle.silentCount = 0;
                    } else {
                        //If no castle_talk visible, start checking. After certain amout of time, assume destroyed
                        teamCastle.silentCount++;
                        if(teamCastle.silentCount >= 10) {
                            teamCastle.signalBuilding = false; 
                        }
                    }
                    /*else if(foundCastle.castle_talk >= 1){
                        self.log("Castle talk: " + foundCastle.castle_talk);
                        self.log("Output: " + combat.UNITTYPE[foundCastle.castle_talk]);
                        teamCastle.buildCounter[combat.UNITTYPE[foundCastle.castle_talk].toLowerCase()]++;
                        teamCastle.buildCounter.total++;
                        self.log(teamCastle.buildCounter);
                    }*/
                }
            }
        });
    });
    self.teamCastles.sort((a,b) => {
        /*if(movement.getDistance(self.me, a) > movement.getDistance(self.me, b)) {
            return -1;
        } else {
            return 1;
        }*/
        if(a.id == self.me.id) {
            return -1;
        } else if (b.id == self.me.id) {
            return 1;
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

/** Method to make decision about attacking the enemy units
 * 1. if attackable anemies around, start attacking on your own
 * 2. if enemies in visible range, create prophets and attack
 * 3. otherwise signal other friendly castles about status on the units build
 */
castle.makeDecision = (self, otherCastles, hasSignalToSend) => {

    const visibleEnemies= combat.getVisibleEnemies(self);
    const attackableEnemies = combat.filterByAttackable(self, visibleEnemies);

    
    //if there are any attackable enemies nearby, castle will start attacking instead of building any other units
    if(attackableEnemies.length > 0){
        const dx = attackableEnemies[0].x - self.me.x;
        const dy = attackableEnemies[0].y - self.me.y;

        self.log('Attackable enemies attacking');
        return self.attack(dx, dy);
    //if there are any enemies in a visible range, castle will start building PHROPHETS
    } else if(visibleEnemies.length > 0){
        self.log('Enemies in the visible range, building phrophets');
        return castle.findUnitPlace(self, 'PROPHET');
    }

    const nearbyDefenders = self.getVisibleRobots().filter((robotElement) => {
        if(robotElement.team === self.me.team && robotElement.unit === 4)
        {
            const distance = movement.getDistance(self.me, robotElement);
            return distance <= 64;
        }
    });

    //Add defenders to front of queue if needed
    if(nearbyDefenders.length < self.macro.defenders) {
        self.log("LESS DEFENDERS: " + nearbyDefenders.length)
        let needToAdd = self.macro.defenders;
        self.castleBuildQueue.forEach(bot => {
            if(bot.unit === "PROPHET") {
                needToAdd--;
            }
        })
        for(let i = 0; i < needToAdd; i++) {
            self.castleBuildQueue.unshift({unit: "PROPHET", x: self.target.x, y: self.target.y});
        }
    }   

    //Check if more pilgrims are needed and add to front of queue if so
    castle.assessLocalPilgrims(self);

    //otherwise castles will signal which castle has done building the units and will take decisions accordingly
    const checkSignal = otherCastles.findIndex(castle =>{
        return castle.signalBuilding
    });

    self.log("Signal: " +  checkSignal);

    if(checkSignal <= 0 && !otherCastles[0].mirrorCastleDestroyed) {
        otherCastles[0].signalBuilding = true
        self.castleTalk(100);
        //If there is a signal to send, forgo building unit for one turn and ensure signal sent
        if (hasSignalToSend) {
            self.log("Attempting to send signal.....")
            return;
        } else {
            return castle.buildFromQueue(self)
        }
    }
    else {
        otherCastles[0].signalBuilding = false
        self.castleTalk(101);
        const botsInQueue = self.castleBuildQueue.length;
        //If there are still pilgrims of prophets to build, prioritize those unique units over deferring to rushing castle
        if(botsInQueue > 0 && ((self.castleBuildQueue[0].unit == "PILGRIM") || (self.castleBuildQueue[0].unit == "PROPHET"))) {
            return castle.buildFromQueue(self);
        } else {
            self.log('Not building units, differeing to other castles')
            return;
        }
    }  

}


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
                            self.teamCastles.forEach(tc => {
                                if(movement.positionsAreEqual(enemyCastle, movement.getMirrorCastle(tc, self.map))) {
                                    tc.mirrorCastleDestroyed = true;
                                }
                            })
                            //self.log("Enemy castle removed from array----------------------------------------------------------------------------------------")
                            //self.log(self.target);
                            //self.log(removedCastle);
                            if(movement.positionsAreEqual(self.target, removedCastle) && enemyCastlesLength > 0)
                            {
                                self.target = self.enemyCastles[0];
                                self.pendingMessages.push(communication.positionToSignal(self.target, self.map));
                                self.log("Signal stored-------------------------------------------------------------------------------------------");
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
            self.log("Signal sent to units, " + newTarget + "---------------------------------------------------------------------------------------------------------");
            return true;
        }
        else
        {
            self.log("Not enough fuel to send signal");
        }
    }
    return false;
}

/**
 * Function that gets an array of locations representing positions close to a number of resource depots. Prioritizes bigger clusters
 * and filters by locations that are between from a range limit (dictated by the `competitionIndex` param in the function) and roughly 
 * the midpoint is `searchAggressively` is set to true or filters by locations roughly on the castle's side of the map if `searchAggressively`
 * is false. NOTE: All sorting places higher priority locations lower in the list (i.e. `clusters[0]` will be highest priority)
 * 
 * @param self Castle calling method
 * @param minClusterSize Filters out any clusters with less local depots than this value
 * @param searchAggressively Boolean indicating whether to filter for depots that the enemy might be targeting. If true, filters for
 * locations that are past the midpoint between calling castle and it's mirror castle but before the range limit. If false, filters for
 * locations just past the midpoint or closer to the castle
 * @param competitionIndex Value from 0 to 1 indicating how far between the calling castle and the enemy castle we should set our rangeLimit
 * for how far we are willing to compete for resource. E.g. if competitionIndex=0.5, we will only search for resources that are at most halfway
 * between castle and mirror castle. In all practicality this value should be greater than 0.5 as the "searchAggressive" case assumes this index
 * is greater than the midpoint (i.e. 0.5)
 * @return Returns an array of objects that include a location and other information about a tile close to other resource depots
 */
castle.findDepotClusters = (self, minClusterSize, competitionIndex, searchAggressively) => {
    //Internal helper function that is self-explanatory. Needed because we are often searching for coordiantes in a range
    const valueIsBetween = (value, a, b) => {
        return value <= Math.max(a,b) && value >= Math.min(a,b);
    }

    let clusters = [];
    
    const mapHorizonal = movement.isHorizontalReflection(self.map);
    const castleDistXY = movement.getDistanceXY(self.me, movement.getMirrorCastle(self.me, self.map));
    const castleDistance = castleDistXY.x + castleDistXY.y;
    //Following four objects are numerous locations to determine range between with to search
    const midPoint = {x: self.map.length/2, y: self.map.length/2}; //Midpoint
    const rangeLimit = { //Max coordinate in x or y direction - only use one!
        x: (midPoint.x > self.me.x) ? self.me.x+(castleDistance*competitionIndex) : self.me.x-(castleDistance*competitionIndex), 
        y: (midPoint.y > self.me.y) ? self.me.y+(castleDistance*competitionIndex) : self.me.y-(castleDistance*competitionIndex)
    }; 
    const conservativeMid = { //Something just before midPoint - allows us to account for things in middle better
        x: (midPoint.x > self.me.x) ? midPoint.x-2 : midPoint.x+2,
        y: (midPoint.y > self.me.y) ? midPoint.y-2 : midPoint.y+2
    }
    const generousMid = { //Something just after midPoint - allows us to account for things in middle better
        x: (midPoint.x > self.me.x) ? midPoint.x+2 : midPoint.x-2,
        y: (midPoint.y > self.me.y) ? midPoint.y+2 : midPoint.y-2
    }
    const castleBorder = { //End of map on castle's side of map - allows us to account for everything else on our side of midpoint
        x: (midPoint.x > self.me.x) ? 0 : self.map.length-1,
        y: (midPoint.y > self.me.y) ? 0 : self.map.length-1
    }

    for(let y = 0; y < self.map.length; y++) {
        for(let x = 0; x < self.map.length; x++) {
            if(self.karbonite_map[y][x] || self.fuel_map[y][x]) {
                let currentCheck = {x: x, y: y, count: -1, dist: -1};
                currentCheck = castle.processLocalDepots(self, currentCheck);
                if(currentCheck.count < minClusterSize) {
                    continue;
                }
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
    self.log("IN CLUSTER SEARCH")
    self.log(clusters.length);
    //Filter for those within reasonable range for which we can compete and aren't closer to another friendly castle
    clusters = clusters.filter(target => {
        let closerTeamCastle = false;
        self.teamCastles.forEach(castle => {
            if(castle.id != self.me.id) {
                //Filter out if another castle is closer to target
                if(movement.getDistance(self.me, target) > movement.getDistance(castle, target)) {
                    closerTeamCastle = true;
                }
            } else {
                //Filter out if this castle is close enough to target to have created initial pilgrims for it
                if(movement.getDistance(castle, target) <= 16) {
                    closerTeamCastle = true;
                }
            }
        });
        return !closerTeamCastle;
    });

    //If search aggressively, filter for targets just before midpoint to compete with opponent
    if(searchAggressively) {
        clusters = clusters.filter(cluster => {
            if(mapHorizonal) {
                return valueIsBetween(cluster.y, rangeLimit.y, conservativeMid.y);
            } else {
                //Check if between rangeLimit and slightly before midpoint
                return valueIsBetween(cluster.x, rangeLimit.x, conservativeMid.x);
            }
        })
    //Otherwise, filter for things just pst midpoint or closer 
    } else {
        clusters = clusters.filter(cluster => {
            if(mapHorizonal) {
                return valueIsBetween(cluster.y, castleBorder.y, generousMid.y);
            } else {
                return valueIsBetween(cluster.x, castleBorder.x, generousMid.x);
            }
        })
    }
    //Handling edge cases where spots are close and can watched by a single prophet
    let i = 0;
    while(i < clusters.length) {
        let nearby = clusters.findIndex(c => {
            return !movement.positionsAreEqual(clusters[i], c) && movement.getDistance(clusters[i], c) <= 32;
        });
        //Find anything nearby, remove if nearby has smaller count or is farther from base. If nearby has higher count
        //or is closer to base, filter out current cluster instead. Repeat until all nearby or this cluster removed
        while(nearby >= 0) {
            if(clusters[nearby].count > clusters[i].count) {
                clusters.splice(i, 1);
            } else if (clusters[nearby].count < clusters[i].count) {
                clusters.splice(nearby, 1);
            } else {
                if(clusters[nearby].dist < clusters[i].dist) {
                    clusters.splice(i, 1);
                } else if(clusters[nearby].dist > clusters[i].dist) {
                    clusters.splice(nearby, 1);
                } else {
                    if(movement.getDistance(self.me, clusters[i]) > movement.getDistance(self.me, clusters[nearby])) {
                        clusters.splice(i, 1);
                    } else {
                        clusters.splice(nearby, 1);
                    }
                }
            }
            nearby = clusters.findIndex(c => {
                return !movement.positionsAreEqual(clusters[i], c) && movement.getDistance(clusters[i], c) <= 32;
            })
        }
        i++;
    }

    self.log("END CLUSTER SEARCH...RESULTS:")
    self.log(clusters);
    //Return sorted by count size
    return clusters.sort((a,b) => { return b.count - a.count; });
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
    return { x: location.x, y: location.y, count: count, dist: dist};
}

/**
 * Method that checks number of local pilgrims. If less than expected, considers depot locations to build a pilgrim for 
 * an unoccupied position
 */
castle.assessLocalPilgrims = (self) => {
    const currentLocal = self.getVisibleRobots().filter(bot => {
        return bot.team === self.me.team && bot.unit === 2 && movement.getDistance(self.me, bot) <= 16;
    });

    //If some pilgrims missing, do work to replenish local pilgrim count
    if(currentLocal.length < self.macro.localPilgrims) {
        const depots = movement.getResourcesInRange(self.me, 16, self.karbonite_map).concat(movement.getResourcesInRange(self.me, 16, self.fuel_map));
        depots.filter(d => {
            let occupied = false;
            currentLocal.forEach(bot => {
                if(movement.positionsAreEqual(bot, d)) {
                    occupied = true;
                }
            });
            return !occupied;
        });
        //If the number of remaining, unoccupied depots plus those that are occupied equals expected count, 
        //build pilgrims for unoccupied depots since we trust these are actually unoccupied 
        //Otherwise, don't do anything because some pilgrim is moving around and we aren't sure which depots
        //are actually unoccupied.
        if((depots.length + currentLocal.length) === self.macro.localPilgrims) {
            depots.forEach(d => {
                const alreadyBuilt = self.castleBuildQueue.findIndex(buildInfo => {
                    return buildInfo.unit === "PILGRIM" && movement.positionsAreEqual(d, buildInfo);
                });
                if(alreadyBuilt < 0) {
                    self.castleBuildQueue.unshift({unit: "PILGRIM", x: d.x, y: d.y});
                }
            })
        }
    }
}

export default castle;
