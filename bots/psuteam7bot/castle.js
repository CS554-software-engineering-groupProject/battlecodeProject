import {BCAbstractRobot, SPECS} from 'battlecode';
import movement from './movement.js';
import combat from './combat.js';
import communication from './communication.js';

const castle = {};


castle.doAction = (self) => {

    self.log("castle" + self.id + "taking turn.");
  
    castle.recordPosition(self);
    castle.findPosition(self);
    //On first turn:
    //  1. add to castleBuildQueue with pilgrims for each local karbonite depot
    //  2. add to castleBuildQueue with pilgrims for each local fuel depot
    //  3. add to castleBuildQueue a single prophet targeting the mirror castle.
    //This ensures that all local depots are filled and a prophet will be built after
    if(self.me.turn === 1)
    {
        const karboniteDepots = movement.getResourcesInRange(self.me, 16, self.karbonite_map);
        karboniteDepots.forEach(depot => {
            self.castleBuildQueue.push({unit: "PILGRIM", x: depot.x, y: depot.y, buildCounter:buildCounter});
        })

        const fuelDepots = movement.getResourcesInRange(self.me, 16, self.fuel_map)
        fuelDepots.forEach(depot => {
            self.castleBuildQueue.push({unit: "PILGRIM", x: depot.x, y: depot.y, buildCounter:buildCounter});
        })
        
        const mirrorCastle = movement.getMirrorCastle(self.me, self.map)
        self.castleBuildQueue.push({unit: "PROPHET", x: mirrorCastle.x, y: mirrorCastle.y, buildCounter:buildCounter});
        self.log(self.castleBuildQueue)
        return castle.buildFromQueue(self);
    }
    else if (self.castleBuildQueue.length > 0) 
    {
        self.log("BUILD QUEUE NON-EMPTY")
        self.log(self.castleBuildQueue)
        const botsInQueue = self.castleBuildQueue.length;
        //Keep queue at reasonable size, adding another prophet as necessary so prophets are continually build
        if (botsInQueue <= 5) {
            self.castleBuildQueue.push(self.castleBuildQueue[botsInQueue-1]);
        }
        return castle.buildFromQueue(self);
    }
    else 
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
    for(let i = -1; i<= 1; i++){   
        for(let j = -1; j<= 1; j++){
            const location = {x: (self.me.x + i), y: (self.me.y +j)} 
            if(movement.isPassable(location, self.map, self.getVisibleRobotMap()))
            {
                //Send signal starting at turn 3 so you don't overrride location communication at start
                if(self.me.turn > 4) {
                    self.castleTalk(SPECS[unitType]);
                }

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
    if(turn <= 2){
        self.castleTalk(self.me.x);
    }
    else if(turn <= 4){
        self.castleTalk(self.me.y);
    }
}

/**Find positions of the friendly castles. 
 * Input: self, this is the reference to the object to the calling method.
 * Output: positions of other friendly castles.
 */
castle.findPosition = (self) => {
    //Filter by those that have a castle talk, since apparently unit does not appear if not in vision radius
    const bots = self.getVisibleRobotMap().filter(bots =>{
        return bots.team === self.me.team && bots.castle_talk > 0;
    })
    let turn = self.me.turn;
    const buildCounter = {
        pilgrims:0,
        crusader:0,
        prophet:0,
        total:0
    }
    const maxDist = -2*Math.pow(self.map.length, 2)-1


    bots.forEach(foundCastle => {
        //Init an item in teamCastles for each on turn 2 once signals being sent
        if (turn == 2) {
            teamCastles.push({id: foundCastle.id, x: maxDist, y: maxDist, buildCounter: buildCounter, signalBuilding:false})
        }

        self.teamCastles.forEach(teamCastle =>{
            if(foundCastle.id == teamCastle.id){
                if(turn == 2){
                    teamCastle.x = foundCastle.castle_talk;
                }
                if(turn == 4){
                    teamCastle.y = foundCastle.castle_talk;
                }  
                if(turn >= 5){
                    if(foundCastle.castle_talk >= 1){
                        teamCastle.buildCounter[combat.UNITTYPE[foundCastle.castle_talk]]++;
                        teamCastle.buildCounter.total++;
                    }
                }
            }
        });
    });
    self.teamCastles.sort((a,b) => {
        if(movement.getDistance(self.me, a) > movement.getDistance(self.me, b)) {
            return -1;
        } else {
            return 1;
        }
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

castle.makeDecision = (self, otherCastles) => {

    const visibleEnemies= combat.getVisibleEnemies(self);
    const attackableEnemies = combat.filterByAttackable(self, visibleEnemies);
    
    if(attackableEnemies > 0){
        const dx = attackableEnemies[0].x - self.me.x;
        const dy = attackableEnemies[0].y - self.me.y;
        return self.attack(dx, dy);
    }

    if(visibleEnemies.length > 0){
        return castle.findUnitPlace(self, 'PHOPHETS');
    }
    
    const checkSignal = otherCastles.indexOf(castle =>{
                            return castle.signalBuilding
                        });
    if(checkSignal < 0){
        otherCastles(0).signalBuilding = true
        self.castleTalk(100);
        return self.buildFromQueue(self)
        
    }
    else{
        otherCastles(0).signalBuilding = false
        self.castleTalk(101);
        return
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
