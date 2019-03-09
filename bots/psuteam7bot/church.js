import {BCAbstractRobot, SPECS} from 'battlecode';
import movement from './movement.js';
import combat from './combat.js';
import communication from './communication.js';
import { setFlagsFromString } from 'v8';

const church = {};

church.UNITTYPE = ["CASTLE", "CHURCH", "PILGRIM", "CRUSADER", "PROPHET" , "PREACHER"]

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

church.findUnitPlace = (self, unitType) => {
    for(let i = -1; i<= 1; i++){
        for(let j = -1; j<= 1; j++){
            const location = {x: (self.me.x + i), y: (self.me.y +j)} 
            if(movement.isPassable(location, self.map, self.getVisibleRobotMap())){
                //Send signal starting at turn 3 so you don't overrride location communication at start
                if(self.me.turn > 2) {
                    self.castleTalk(SPECS[unitType]);
                }

                self.log('church ' + self.id + ' building unit ' + unitType + ' at [' + (self.me.x+i) + ',' + (self.me.y+j) +']'); 
                return self.buildUnit(SPECS[unitType], i, j);    
            }
        }
    }
}

export default church;