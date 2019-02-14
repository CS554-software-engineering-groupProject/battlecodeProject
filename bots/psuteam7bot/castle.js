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
    for(i = -1; i<= 1; i++){   
        for(j = -1; j<= 1; j++){
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

/** Each castle will try to locate and record the positions of the friendly castles at the start of the game
 * Input: self = this is the reference to the object to the calling method. 
 * Output: returnPosition = return value containing the positions of the friendly castle       
 *  */

castle.recordPosition = (self, position) => {
   if(this.unit === 0 && bots.team === self.me.team){
       let turn = self.me.turn;
       if(turn == 1){
           self.castle_talk(position.x);
        }
        if(turn == 2){
            self.castle_talk(position.y);
        }
    }
}

/**Find positions of the friendly castles. 
 * Input: self, this is the reference to the object to the calling method.
 * Output: positions of other friendly castles.
 */
castle.findPosition = (self) => {
    const bots = self.getVisibleRobotMap().filter(bots =>{
        return bots.team === self.me.team && bots.units === 0;
    })
    let turn = self.me.turn;
    //let storeFriendlyCastles;

    bots.forEach(foundCaslte => {
        self.teamCastles.forEach(teamCastle =>{
            if(foundCaslte.id == teamCastle.id){
                if(turn == 2){
                    teamCastle.x = foundCaslte.castle_talk;
                }
                if(turn == 3){
                    teamCastle.y = foundCaslte.castle_talk;
                }
            }
        })
    });
}
/** Castle should calculate the locations of the enemy castles using the recorded postions. Use mirror castle method. 
 * Input : the location of the friendly castles
 * Output: mirrored images of the enemy castles
 */
castle.mirrorCastle = (myLocation, fullMap) => {
    const {x, y} = myLocation;
    const Ax = fullMap.length - x - 1;
    const Ay = fullMap.length - y - 1;
    const isHorizontal = movement.isHorizontalReflection(fullMap);
    
    if(isHorizontal)
    {
        return {x: x, y: Ay}
    }
    else
    {
        return {x: Ax, y: y};
    }
}

/** Each castle should be able to check for messages from their friendly castles 
 * Use of this.getVisibleRobots() to see the robots in the vicinity 
 * 
 * Input: self, this is the reference to the object to the calling method.
 * Output: message from other castles
 * castle.checkMessage = (self) => {
    const visibleRobots = this.getVisibleRobotMap().filter(bots =>{
        return bots.team === self.me.team && bots.unit === 0;
    })
    const filterdCastle;
    for(i = 0; i< filterdCastle ; i ++)
    {  
        const id = 0;
        this.castle_talk(id);
        return castle.checkMessage(self)
    }
    return;
}
 */


export default castle;
