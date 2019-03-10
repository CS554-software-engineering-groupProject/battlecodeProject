import {BCAbstractRobot, SPECS} from 'battlecode';
import movement from './movement.js';
import castle from './castle.js';
import communication from './communication.js';

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
        if(self.base === null) {
            self.base = {x: self.me.x, y: self.me.y};
        }
        self.log("Set base as " + JSON.stringify(self.base));
        self.role = 'PIONEER'
        communication.initTeamCastleInformation(self);
        //Set target base on castle signal
        const {x, y} = communication.signalToPosition(self.getRobot(self.teamCastles[0].id).signal, self.map)
        self.target = {x: x, y: y};
        self.log("pilgrim PIONEER " + self.id + " targeting depot at [" + self.target.x + "," + self.target.y + "]")
    }

    if(self.role === 'MINER') {
        return pilgrim.takeMinerAction(self);
    } else if (self.role === 'PIONEER') {
        return pilgrim.takePioneerAction(self);
    }

    return;
}

/**
 * Method to dictate strategy for MINER pilgrims
 */
pilgrim.takeMinerAction = (self) => {
    if(self.target === null) {
        if(self.karbonite*5 <= self.fuel) {
            self.target = pilgrim.findClosestResource(self.me, self.karbonite_map, self.occupiedResources);
            self.log("pilgrim MINER " + self.id + " targeting karbonite depot at [" + self.target.x + "," + self.target.y + "]")
        } else {
            self.target = pilgrim.findClosestResource(self.me, self.fuel_map, self.occupiedResources);
            self.log("pilgrim MINER " + self.id + " targeting fuel depot at [" + self.target.x + "," + self.target.y + "]")
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
                self.log(self.path)
            } else {
                self.log('Cannot get path back to base')
            }
        }
        self.log('pilgrim MINER ' + self.id + ' moving towards base, Current: [' + self.me.x + ',' + self.me.y + ']')
        return movement.moveAlongPath(self);
    } else {
        //If at target, mine
        if(self.me.x === self.target.x && self.me.y === self.target.y) {
            self.log("pilgrim MINER " + self.id + " mining resources at [" + self.me.x + "," + self.me.y + "]");
            return self.mine();
        //If not at target, make sure you aren't going to an occupied depot, then move towards target
        } else {
            pilgrim.updateResourceTarget(self);
            self.log('pilgrim MINER ' + self.id + ' moving towards target, Current: [' + self.me.x + ',' + self.me.y + ']')
            return movement.moveAlongPath(self);
        }
    }
}

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
            self.log("pilgrim PIONEER " + self.id + " targeting karbonite depot at [" + self.target.x + "," + self.target.y + "]")
        } else {
            self.target = pilgrim.findClosestResource(self.me, self.fuel_map, self.occupiedResources);
            self.log("pilgrim PIONEER " + self.id + " targeting fuel depot at [" + self.target.x + "," + self.target.y + "]")
        }
        if(movement.aStarPathfinding(self, self.me, self.target, false)) {
            self.log(self.me);
            self.log(self.path)
        }
    }
    //Target set, if not at target make sure you aren't going to an occupied depot, then move towards target
    if (self.target.x !== self.me.x || self.target.y !== self.me.y) {
        pilgrim.updateResourceTarget(self);
        self.log('pilgrim PIONEER ' + self.id + ' moving towards target, Current: [' + self.me.x + ',' + self.me.y + ']')
        return movement.moveAlongPath(self);
    //If at target, become miner
    } else {
        const localBases = self.getVisibleRobots().filter(bot => {
            return bot.team === self.me.team && bot.unit <= 1 && movement.getDistance(self.me, bot) <= 49;
        });
        localBases.sort((a,b) => {
            return movement.getDistance(self.me, b) - movement.getDistance(self.me, a);
        });
        //If nothing around, assume it should be a church-builder
        if(localBases.length === 0) {
            //Build church if you can
            if(self.fuel >= SPECS.UNITS[SPECS.CHURCH].CONSTRUCTION_FUEL && self.karbonite >= SPECS.UNITS[SPECS.CHURCH].CONSTRUCTION_KARBONITE) {
                return pilgrim.buildChurch(self);
            //Otherwise, tell base that you want to build, and at least try to mine so you can deposit once church build. 
            } else {
                self.castleTalk(121);
                return self.mine();
            }
        } else {
            self.base = {x: localBases[0].x, y: localBases[0].y};
            self.role = 'MINER';
            self.log('pilgrim PIONEER ' + self.id + ' becoming MINER')
            return pilgrim.takeMinerAction(self);
        }
    }
}

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
}

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
    let closest = { x: -1, y: -1}
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
}

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
}

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
}

/**
 * Function to for a pilgrim to build a church. Assumes pilgrim is at best local depot, so 
 */
pilgrim.buildChurch = (self) => {
    let bestCount = 0;
    let bestDist = 0;
    let bestLoc = null;
    for(let i = -1; i<= 1; i++) {   
        for(let j = -1; j<= 1; j++) {
            const loc = {x: (self.me.x + i), y: (self.me.y+j)} 
            if(!movement.isPassable(loc, self.map, self.getVisibleRobotMap()) 
                || self.karbonite_map[loc.y][loc.x] || self.fuel_map[loc.y][loc.x]) {
                continue;
            }
            const locInfo = castle.processLocalDepots(self, loc);
            if(locInfo.count > bestCount) {
                bestCount = locInfo.count;
                bestDist = locInfo.dist;
                bestLoc = {x: loc.x, y: loc.y, dx: i, dy: j};
            } else if (locInfo.count === bestCount && bestDist > locInfo.dist) {
                bestCount = locInfo.count;
                bestDist = locInfo.dist;
                bestLoc = {x: loc.x, y: loc.y, dx: i, dy: j};
            }
        }
    }
    if (bestLoc != null) {
        self.base = {x: bestLoc.x, y: bestLoc.y}
        self.log('pilgrim ' + self.id + ' building a church at [' + bestLoc.x + ',' + bestLoc.y +']'); 
        return self.buildUnit(1, bestLoc.dx, bestLoc.dy); 
    } else {
        self.log("No viable church positions - no taking action");
        return;
    }
}


export default pilgrim;