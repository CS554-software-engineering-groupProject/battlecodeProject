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
            self.churchBuildQueue.shift();
            self.signal(communication.positionToSignal(nextBuild, self.map), 2);
            return church.findUnitPlace(self, buildNextUnit);
    }
    else{
        self.log('cannnot build unit'+ buildNextUnit.unit +'- not enough resources');
        return;
    }
}

church.findUnitPlace() = (self, unitType) => {
    for(let i = -1; i<= 1; i++){
        for(let j = -1; j<= 1; j++){
            
        }
    }
}

export default church;