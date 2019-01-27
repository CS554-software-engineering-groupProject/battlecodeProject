import {BCAbstractRobot, SPECS} from 'battlecode';

const pilgrim = {};
pilgrim.maxKarbonite = SPECS.UNITS[SPECS.PILGRIM].KARBONITE_CAPACITY;
pilgrim.maxFuel = SPECS.UNITS[SPECS.PILGRIM].FUEL_CAPACITY;


/**
 * Main action page for a pilgrim unit. Makes decisions and calls helper functions to take action 
 */
pilgrim.doAction = (self) => {
    self.log("pilgrim " + self.id + " taking turn");
    const onMap = (self, x, y) => {
        const mapSize = self.map.length;
        return (x < mapSize) && (x >= 0) && (y < mapSize) && (y >= 0)
    }
    const findAdjacentBase = (self) => {
        for(let y=self.me.y-1; y <= self.me.y+1; y++) {
            for(let x=self.me.x-1; x <= self.me.y+1; x++) {
                if (onMap(self, x, y)) {
                    const id = self.getVisibleRobotMap()[y][x]
                    //robot.unit = 0 for castle, 1 for church
                    if(id > 0 && self.getRobot(id).unit <= 1) {
                        return {x: x, y: y};
                    }
                }
            }
        }
        return null;
    }
    if (self.role === 'UNASSIGNED') {
        //temporary
        //@todo Flesh out what to do if unassigned
        self.role = 'MINER';
    }
    //Since base (castle or church) will be close upon creation, check adjacent tiles for a base
    //Currently skipping due to complications with testing
    /* 
    if(self.base === null) {
        self.base = findAdjacentBase(self);
    }*/
    if(self.role === 'MINER') {
        if(self.target === null) {
            if(self.karbonite*5 <= self.fuel) {
                self.target = pilgrim.findClosestResource(self.me, self.karbonite_map);
                self.log("pilgrim " + self.id + " targeting karbonite depot at [" + self.target.x + "," + self.target.y + "]")
            } else {
                self.target = pilgrim.findClosestResource(self.me, self.fuel_map);
                self.log("pilgrim " + self.id + " targeting karbonite depot at [" + self.target.x + "," + self.target.y + "]")
            }
        }
        
        if(self.me.karbonite === pilgrim.maxKarbonite || self.me.fuel === pilgrim.maxFuel) {
            let adjacentBase = findAdjacentBase(self);
            if(adjacentBase != null) {
                self.target === null;
                self.log("pilgrim " + self.id + " depositing resources with base at [" + adjacentBase.x + "," + adjacentBase.y + "]");
                return self.give(adjacentBase.x-self.me.x, adjacentBase.y-self.me.y, self.me.karbonite, self.me.fuel)
            }
            self.target = self.base;
            //Move towards base
        }
    }
    return;
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
 * @return Returns an object with the x and y position of the closet resource
 */
pilgrim.findClosestResource = (position, depotMap) => {
    const mapSize = depotMap.length;
    let minDist = 2*Math.pow(mapSize, 2);
    let closest = { x: -1, y: -1}
    const getR2 = (from, to) => {
        return Math.pow(from.x-to.x, 2) + Math.pow(from.y-to.y, 2);
    }
    for(let y = 0; y < mapSize; y++) {
        for(let x = 0; x < mapSize; x++) {
            const currDist = getR2(position, {x: x, y: y});
            if (depotMap[y][x] && (currDist<minDist)) {
                closest.x = x;
                closest.y = y;
                minDist = currDist;
            }
        }
    }
    return closest;
}


export default pilgrim;