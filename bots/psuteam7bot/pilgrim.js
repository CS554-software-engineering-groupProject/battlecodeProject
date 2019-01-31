import {BCAbstractRobot, SPECS} from 'battlecode';
import movement from './movement.js';

const pilgrim = {};
pilgrim.maxKarbonite = SPECS.UNITS[SPECS.PILGRIM].KARBONITE_CAPACITY;
pilgrim.maxFuel = SPECS.UNITS[SPECS.PILGRIM].FUEL_CAPACITY;

/**
 * Main action page for a pilgrim unit. Makes decisions and calls helper functions to take action 
 */
pilgrim.doAction = (self) => {
    self.log("pilgrim " + self.id + " taking turn - occupied depots: " + JSON.stringify(self.occupiedResources));
    const onMap = (self, x, y) => {
        const mapSize = self.map.length;
        return (x < mapSize) && (x >= 0) && (y < mapSize) && (y >= 0)
    }
    
    if (self.role === 'UNASSIGNED') {
        self.base = movement.findAdjacentBase(self);
        self.log("Set base as " + JSON.stringify(self.base));
        //Gets nearby base, checks turn
        self.role = 'PIONEER'
    }

    if(self.role === 'MINER') {
        return pilgrim.takeMinerAction(self);
    } else if (self.role === 'PIONEER') {
        return pilgrim.takePioneerAction(self);
    }

    return;
}

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
        }
        const {x, y} = movement.moveTowards(self, self.base);
        self.log('pilgrim MINER ' + self.id + ' moving towards base, Current: [' + self.me.x + ',' + self.me.y + ']  Target: ['+ x + ',' + y + ']')
        return self.move(x-self.me.x, y-self.me.y);
    } else {
        if(self.me.x === self.target.x && self.me.y === self.target.y) {
            self.log("pilgrim MINER " + self.id + " mining resources at [" + self.me.x + "," + self.me.y + "]");
            return self.mine();
        } else {
            //Check if there is a visible bot at target
            self.log('Not on target: ' + JSON.stringify(self.target));
            const possibleId = self.getVisibleRobotMap()[self.target.y][self.target.x];
            if(possibleId > 0) {
                self.log('Bot on target: ' + possibleId);
                //If bot exists on target, check if it's a pilgrim from your team (probbaly mining)
                const botOnTarget = self.getRobot(possibleId);
                self.log(botOnTarget)
                if(botOnTarget.team === self.me.team && botOnTarget.unit === self.me.unit) {
                    self.log('Pilgrim teammate on target');
                    //If teammate pilgrim already there mining, add target to occupiedResources and find new resource to target
                    const depotMap = self.karbonite_map[self.target.y][self.target.x] == true ? self.karbonite_map : self.fuel_map;
                    self.occupiedResources.push(self.target);
                    self.log('new occupied resources: ' + JSON.stringify(self.occupiedResources));
                    self.target = pilgrim.findClosestResource(self.me, depotMap, self.occupiedResources);
                    self.log('resource depot at ' + JSON.stringify({x: botOnTarget.x, y: botOnTarget.y}) + ' occupied; switching target to ' + JSON.stringify(self.target));
                    return self.takeMinerAction(self);
                }
            }
            const {x, y} = movement.moveTowards(self, self.target);
            self.log('pilgrim MINER ' + self.id + ' moving towards target, Current: [' + self.me.x + ',' + self.me.y + ']  Target: ['+ x + ',' + y + ']');
            return self.move(x-self.me.x, y-self.me.y);
        }
    }
}

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
    }
    //Target set - if not at target, move towards
    if (self.target.x !== self.me.x || self.target.y !== self.me.y) {
        const {x, y} = movement.moveTowards(self, self.target);
        self.log('pilgrim PIONEER ' + self.id + ' moving, Current: [' + self.me.x + ',' + self.me.y + ']  Target: ['+ x + ',' + y + ']')
        return self.move(x-self.me.x, y-self.me.y);
    //If at target, become miner
    } else {
        self.role = 'MINER';
        self.log('pilgrim PIONEER ' + self.id + ' becoming MINER')
        return pilgrim.takeMinerAction(self);
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


export default pilgrim;