import {BCAbstractRobot, SPECS} from 'battlecode';
import movement from './movement.js';
import combat from './combat.js';
import communication from './communication.js';
import { setFlagsFromString } from 'v8';

const church = {};

church.UNITTYPE = ["CASTLE", "CHURCH", "PILGRIM", "CRUSADER", "PROPHET" , "PREACHER"]
max

church.doAction = (self) => {
     self.log("church" + self.id + "taking turn.");
}

/** Method to detect global resources values
 */
church.checkGlobalResources = () =>{
    
}

/** Method to detect and evaluate nearby visible resource depots 
 */
church.detectClosestResources = (position, depotMap, occupiedResources) => {

}


export default church;