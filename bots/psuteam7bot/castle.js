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
    else if(self.me.turn<100)
    {
        //Check if there are enough resources to produce this unit.
       if(self.fuel >= SPECS['PROPHET'].CONSTRUCTION_FUEL && self.karbonite >= SPECS['PROPHET'].CONSTRUCTION_KARBONITE){
           return castle.findUnitPlace(self, 'PROPHET');
       }
       return;
    }

}

castle.findUnitPlace = (self, unitType) => {
    //Check if any of the adjacent tile is available. Place the unit if true.
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

castle.findPosition = (self, friendlyCastle) => {
    //each castle will try to locate and record the positions of the friendly castles at the start of the game
    
}

castle.checkMessage = (self, robots) => {
    // each castle should be able to check for messages from their friendly castles
    for(i= -1; i<=+1; i++){
        for(j = -1; j<=+1;j++){
            //use of this.getVisibleRobots() to see the robots in the vicinity 
            const visibleRobots = this.getVisibleRobotMap();
            const value = 0;
            self.castle_talk(value);
            return castle.checkMessage(self, visibleRobots)
        }
    }
}
export default castle;
