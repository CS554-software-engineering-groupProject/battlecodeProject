import {BCAbstractRobot, SPECS} from 'battlecode';
import movement from './movement.js';
import combat from './combat.js';

const castle = {};


castle.doAction = (self) => {

    self.log("castle" + self.id + "taking turn.");
    //Assume that there are enough resources to produce unit 'Pilgrim'
    if(self.me.turn < 3)
    {
        return castle.findUnitPlace(self, 'PILGRIM');
    }
    else
    {
        //Check if there are enough resources to produce this unit.
       if(self.fuel >= SPECS.UNITS[SPECS.CRUSADER].CONSTRUCTION_FUEL && self.karbonite >= SPECS.UNITS[SPECS.CRUSADER].CONSTRUCTION_KARBONITE) {
           return castle.findUnitPlace(self, 'CRUSADER');
       }
       return;
    }
}

castle.findUnitPlace = (self, unitType) => {
    //Check if any of the adjacent tile is available. Place the unit if true.
    for(let i=-1; i<= 1; i++){   
        for(let j = -1; j<= 1; j++){
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
