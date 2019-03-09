import {BCAbstractRobot, SPECS} from 'battlecode';
import movement from './movement.js';
import combat from './combat.js';
import communication from './communication.js';
import { setFlagsFromString } from 'v8';

const church = {};

church.UNITTYPE = ["CASTLE", "CHURCH", "PILGRIM", "CRUSADER", "PROPHET" , "PREACHER"]

church.maxKarbonite = SPECS.UNITS[SPECS.CHURCH].KARBONITE_CAPACITY;
church.maxFuel = SPECS.UNITS[SPECS.CHURCH].FUEL_CAPACITY;

church.doAction = (self) => {
     self.log("church" + self.id + "taking turn.");
}


/** Method to detect and evaluate nearby visible resource depots 
 */
church.detectClosestResources = (position, depotMap, occupiedResources) => {
    const mapSize = depotMap.length;
    let minDist = 2*Math.pow(mapSize, 2);
    let closest = { x: -1, y: -1}
    for(let y = 0; y < mapSize; y++){
        for(let x = 0; x<mapSize; x++){
            const currDist = movement.getDistance(position, {x: x, y: y});
            if(depotMap[x][y] == true && (currDist < minDist)){
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

/** Method to build miners for each visible resource depot 
 */

church.mine =(self) =>{
    
}

export default church;