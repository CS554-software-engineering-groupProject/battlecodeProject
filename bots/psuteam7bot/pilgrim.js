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
        /*
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
        return null;*/
    }
    if (self.role === 'UNASSIGNED') {
        //temporary
        //@todo Flesh out what to do if unassigned
        //self.role = 'PIONEER';
        self.role = 'MINER';
        self.base = findAdjacentBase(self);
        self.log("Set base as " + JSON.stringify(self.base));
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
                self.log("pilgrim MINER " + self.id + " targeting karbonite depot at [" + self.target.x + "," + self.target.y + "]")
            } else {
                self.target = pilgrim.findClosestResource(self.me, self.fuel_map);
                self.log("pilgrim MINER " + self.id + " targeting fuel depot at [" + self.target.x + "," + self.target.y + "]")
            }
        }
        self.log('Miner target: ' + JSON.stringify(self.target))
        if(self.me.karbonite === pilgrim.maxKarbonite || self.me.fuel === pilgrim.maxFuel) {
            let adjacentBase = findAdjacentBase(self);
            if(adjacentBase != null) {
                self.target === null;
                self.log("pilgrim MINER " + self.id + " depositing resources with base at [" + adjacentBase.x + "," + adjacentBase.y + "]");
                return self.give(adjacentBase.x-self.me.x, adjacentBase.y-self.me.y, self.me.karbonite, self.me.fuel)
            }
            self.target = self.base;
            const distX = self.target.x - self.me.x;
            const distY = self.target.y - self.me.y;
            if (Math.pow(distX, 2) + Math.pow(distY,2) <= SPECS.UNITS[SPECS.PILGRIM].SPEED) {
                return self.move(distX, distY);
            }
            if(Math.abs(distX) >= Math.abs(distY)) {
                return self.move(2,0);
            } else {
                return self.move(0,2);
            }
        } else {
            if(self.me.x === self.target.x && self.me.y === self.target.y) {
                self.log("pilgrim MINER " + self.id + " mining resources at [" + self.me.x + "," + self.me.y + "]");
                return self.mine();
            } else {
                const distX = self.target.x - self.me.x;
                const distY = self.target.y - self.me.y;
                if (Math.pow(distX, 2) + Math.pow(distY,2) <= SPECS.UNITS[SPECS.PILGRIM].SPEED) {
                    return self.move(distX, distY);
                }
                if(Math.abs(distX) >= Math.abs(distY)) {
                    return self.move(2,0);
                } else {
                    return self.move(0,2);
                }
            }
        }
    } else if (self.role === 'PIONEER') {
        if(self.target === null) {
            const localPilgrims = self.getVisibleRobots().filter(bots => {
                return bots.team === self.me.team && bots.unit === 2;
            });
            if(localPilgrims.length%1 === 1) {
                self.target = pilgrim.findClosestResource(self.me, self.karbonite_map);
            } else {
                self.target = pilgrim.findClosestResource(self.me, self.fuel_map);
            }
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