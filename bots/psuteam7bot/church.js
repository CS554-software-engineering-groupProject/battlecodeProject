import {BCAbstractRobot, SPECS} from 'battlecode';
import movement from './movement.js';
import combat from './combat.js';
import communication from './communication.js';
//import { setFlagsFromString } from 'v8';

const church = {};

church.UNITTYPE = ["CASTLE", "CHURCH", "PILGRIM", "CRUSADER", "PROPHET" , "PREACHER"]

church.maxKarbonite = SPECS.UNITS[SPECS.CHURCH].KARBONITE_CAPACITY;
church.maxFuel = SPECS.UNITS[SPECS.CHURCH].FUEL_CAPACITY;

church.doAction = (self) => {
     self.log("church" + self.id + "taking turn.");

    if(self.me.turn == 1){
        const karboniteDepots = movement.getResourcesInRange(self.me, 36, self.karbonite_map);
        karboniteDepots.forEach(depot => {
            self.castleBuildQueue.push({unit: "PILGRIM", x: depot.x, y: depot.y});
        })

        const fuelDepots = movement.getResourcesInRange(self.me, 16, self.fuel_map)
        fuelDepots.forEach(depot => {
            self.castleBuildQueue.push({unit: "PILGRIM", x: depot.x, y: depot.y});
        })

        const mirrorCastle = movement.getMirrorCastle(self.me, self.map)
        self.target = mirrorCastle;
        self.log(self.castleBuildQueue);

        return church.castle.buildFromQueue(self);
    }  
    else if (self.me.turn <= 4) {
        self.log("BUILD QUEUE NON-EMPTY")
        self.log(self.castleBuildQueue)
        const botsInQueue = self.castleBuildQueue.length;
        //Keep queue at reasonable size, adding another crusader as necessary so crusaders are continually build
        if (botsInQueue <= 5) {
            self.castleBuildQueue.push({unit: "PROPHETS", x: self.target.x, y: self.target.y});
        }
        return church.castle.buildFromQueue(self);
    }
}


/** Method to detect and evaluate nearby visible resource depots 
 */
church.getResourcesInRange = (location, maxDistance, resourceMap) =>{
    const targets = [];
    let currentDist;

    for(let y = 0; y < resourceMap.length; ++y){
        for (let x = 0; x < resourceMap.length; ++x) {
            if(resourceMap[x][y]){
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

/** Each church will try to locate and record the positions of the friendly church at the start of the game
 * Input: self = this is the reference to the object to the calling method. 
 * Output: returnPosition = return value containing the positions of the friendly castle       
 *  */
church.recordPosition = (self) => {
    let turn = self.me.turn;
    if(turn <= 2){
        self.signal(self.me.x);
    }
    else if(turn <= 4){
        self.signal(self.me.y);
    }
}

export default church;
