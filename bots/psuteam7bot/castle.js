import {BCAbstractRobot, SPECS} from 'battlecode';
import nav from './nav.js';
import util from './util.js';

const castle = {};

castle.doAction = (self) => {
    self.log("castle" + self.id + "taking turn.");
    if(self.me.turn < 3)
    {
        return castle.findUnitPlace(self, 'PILGRIM');
    }
    elseif(self.me.turn<100)
    {
       if(self.fuel >= SPECS['PROPHET'].CONSTRUCTION_FUEL && self.karbonite >= SPECS['PROPHET'].CONSTRUCTION_KARBONITE){
           return findUnitPlace(self, 'PROPHET');
       }
       return;
    }

}

castle.findUnitPlace = (self, unitType) => {
    for(i= -1; i<= +1; i++){   
        for(j = -1; j<= +1; j++){
            const location = {x: (self.me.x + i), y: (self.me.y +j)} 
           if(movement.isPassable(location, self.map, self.getVisibleRobotMap()))
           {
            self.log('castle ' + self.id + ' building pilgrim at [' + (self.me.x+i) + ',' + (self.me.y+j) +']'); 
            return self.buildUnit(SPECS[unitType], i, j);       
           }
        }
    }
    return;
}
export default castle;
