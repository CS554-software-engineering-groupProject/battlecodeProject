import {BCAbstractRobot, SPECS} from 'battlecode';
import movement from './movement.js';
import combat from './combat.js';
import communication from './communication.js';

const castle = {};


castle.doAction = (self) => {

    self.log("castle" + self.id + "taking turn.");
  
    castle.recordPosition(self);
    castle.findPosition(self);
    if(self.me.turn === 4)
    {
        for(let i = 0; i < self.teamCastles.length; ++i)
        {
            self.enemyCastles.push(movement.getEnemyCastleLocations(self.teamCastles[i], self.map));
        }
    }

    //On first turn:
    //  1. add to castleBuildQueue with pilgrims for each local karbonite depot
    //  2. add to castleBuildQueue with pilgrims for each local fuel depot
    //  3. add to castleBuildQueue a single crusader targeting the mirror castle.
    //This ensures that all local depots are filled and a crusader will be built after
    if(self.me.turn === 1)
    {
        const karboniteDepots = movement.getResourcesInRange(self.me, 16, self.karbonite_map);
        karboniteDepots.forEach(depot => {
            self.castleBuildQueue.push({unit: "PILGRIM", x: depot.x, y: depot.y});
        })
        const fuelDepots = movement.getResourcesInRange(self.me, 16, self.fuel_map)
        fuelDepots.forEach(depot => {
            self.castleBuildQueue.push({unit: "PILGRIM", x: depot.x, y: depot.y});
        })
        const mirrorCastle = movement.getMirrorCastle(self.me, self.map)
        self.target = mirrorCastle;

        self.castleBuildQueue.push({unit: "CRUSADER", x: self.target.x, y: self.target.y});
        self.log(self.castleBuildQueue)
        return castle.buildFromQueue(self);
    }
    else if (self.castleBuildQueue.length > 0) 
    {
        castle.checkUnitCastleTalk(self);
        if(self.target === null)
            self.target = enemyCastles[0];
        self.log("BUILD QUEUE NON-EMPTY")
        self.log(self.castleBuildQueue)
        const botsInQueue = self.castleBuildQueue.length;
        //Keep queue at reasonable size, adding another crusader as necessary so crusaders are continually build
        if (botsInQueue <= 5) {
            self.castleBuildQueue.push({unit: "CRUSADER", x: self.target.x, y: self.target.y});
        }
        return castle.buildFromQueue(self);
    }
    else 
    {
        castle.checkUnitCastleTalk(self);
        if(self.target === null)
            self.target = enemyCastles[0];
        self.log("BUILD QUEUE EMPTY, ATTEMPTING TO BUILD CRUSADER")
        //Check if there are enough resources to produce this unit.
       if(self.fuel >= SPECS.UNITS[SPECS.CRUSADER].CONSTRUCTION_FUEL && self.karbonite >= SPECS.UNITS[SPECS.CRUSADER].CONSTRUCTION_KARBONITE) {
            self.castleBuildQueue.push({unit: "CRUSADER", x: self.target.x, y: self.target.y});
            return castle.buildFromQueue(self);
       }
       self.log("NOT ENOUGH RESOURCE")
       return;
    }

}

castle.findUnitPlace = (self, unitType) => {
    //Check if any of the adjacent tile is available. Place the unit if true.
    for(let i = -1; i<= 1; i++){   
        for(let j = -1; j<= 1; j++){
            const location = {x: (self.me.x + i), y: (self.me.y +j)} 
            if(movement.isPassable(location, self.map, self.getVisibleRobotMap()))
            {
                self.log('castle ' + self.id + ' building unit ' + unitType + ' at [' + (self.me.x+i) + ',' + (self.me.y+j) +']'); 
                return self.buildUnit(SPECS[unitType], i, j);       
            }
        }
    }
    return;
}


/**
 * Method to build next unit pushed on `castleBuildQueue`. Currently no checks that should be implemented
 */
castle.buildFromQueue = (self) => {
    const nextBuild = self.castleBuildQueue[0];
    //If you are able to build next unit, signal coordinates so it knows where to go and build it
    if(self.fuel >= SPECS.UNITS[SPECS[nextBuild.unit]].CONSTRUCTION_FUEL && 
       self.karbonite >= SPECS.UNITS[SPECS[nextBuild.unit]].CONSTRUCTION_KARBONITE) {
        self.castleBuildQueue.shift();
        self.signal(communication.positionToSignal(nextBuild, self.map), 2);
        return castle.findUnitPlace(self, nextBuild.unit);
    } else {
        self.log('cannot build unit ' + nextBuild.unit + '- not enough resources');
        return;
    }
}


/** Each castle will try to locate and record the positions of the friendly castles at the start of the game
 * Input: self = this is the reference to the object to the calling method. 
 * Output: returnPosition = return value containing the positions of the friendly castle       
 *  */

castle.recordPosition = (self) => {
    let turn = self.me.turn;
    if(turn == 1){
        self.castleTalk(self.me.x);
    }
    if(turn == 2){
        self.castleTalk(self.me.y);
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

    bots.forEach(foundCastle => {
        self.teamCastles.forEach(teamCastle =>{
            if(foundCastle.id == teamCastle.id){
                if(turn == 2){
                    teamCastle.x = foundCastle.castle_talk;
                }
                if(turn == 3){
                    teamCastle.y = foundCastle.castle_talk;
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


 /**
  * Check castle talk message from units other than castles, if found, treat it as the x-coord or y-coord of a destroyed enemy castle
  * remove the destroyed enemy castle from the array of enemy castles, and set self.target to null
  */
 castle.checkUnitCastleTalk = (self) => {
    const alliedUnits = self.getVisibleRobotMap().filter(bot =>{
        return bot.team === self.me.team && bot.unit !== 0 && bot.castleTalk;
    })
    const length = alliedUnits.length;
    const enemyCastlesLength = self.enemyCastles.length
    for(let i = 0; i < length; ++i)
    {  
        for(let j = 0; j < enemyCastlesLength; ++j)
        {
            if(movement.isHorizontalReflection(self.map))
            {
                if(alliedUnits[i].castleTalk === self.enemyCastles[j].x)
                {
                    if(self.target === self.enemyCastles[j])
                        self.target = null;
                    self.enemyCastles.splice(j,1);
                    enemyCastlesLength = self.enemyCastles.length;
                    // TODO Account for fuel, maybe add a pending message property, push message onto it and check every turn if there is one not 'sent' yet
                    self.signal(self.target, self.map.length);
                    break;
                }
            }
            else
            {
                if(alliedUnits[i].castleTalk === self.enemyCastles[j].y)
                {
                    if(self.target === self.enemyCastles[j])
                        self.target = null;
                    self.enemyCastles.splice(j,1);
                    enemyCastlesLength = self.enemyCastles.length;
                    // TODO Account for fuel, maybe add a pending message property, push message onto it and check every turn if there is one not 'sent' yet
                    self.signal(self.target, self.map.length);
                    break;
                }
            }
        }
    }
    return;
 }


castle.signalTargetChange = (self) => {

}

export default castle;
