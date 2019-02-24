import {BCAbstractRobot, SPECS} from 'battlecode';
import movement from './movement.js';
import combat from './combat.js';
import communication from './communication.js';
import { setFlagsFromString } from 'v8';

const church = {};

church.doAction = (self) => {

    self.log("church" + self.id + "taking turn.");

}

church.buildFromQueue = (self) => {
    const buildNextUnit = self.churchBuildQueue[0];
    if(self.fuel >= SPECS.UNITS[SPECS[nextBuild.unit]].CONSTRUCTION_FUEL && 
        self.karbonite >= SPECS.UNITS[SPECS[nextBuild.unit]].CONSTRUCTION_KARBONITE){
            
        }
}

export default church;