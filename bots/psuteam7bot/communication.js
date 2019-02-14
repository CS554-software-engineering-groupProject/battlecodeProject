import {SPECS} from "battlecode";
import combat from './combat.js';
import movement from "./movement.js";
const communication = {};

/*Translate position object x and y to signal value
*Input:     position    -   An {x, y} position object, self.me or other stuff like self.base, enemy castle location etc.
*           fullMap     -   the full map, Should be self.map or or self.getPassableMap()
*Output:    RetVal  -   signal value, in the range between 0 to maplength^2 - 1
*/
communication.positionToSignal = (position, fullMap) => {
    const {x, y} = position;
    const signalValue = (y)*fullMap.length + x;

    return signalValue;
}

/*Translate signal value to an {x, y} position object
*Input:     signalValue -   A signal value, in the range between 0 to maplength^2 - 1
*           fullMap     -   the full map, Should be self.map or or self.getPassableMap()
*Output:    RetVal      -   An {x, y} position object
*/
communication.signalToPosition = (signalValue, fullMap) => {
    //Case for when signalValue is 0, since Math.floor doesn't work nicely with 0
    const y = Math.floor(signalValue/fullMap.length);
    const x = signalValue % fullMap.length;

    return {x, y};
}

/**
 * Method to get information on all castles and pass it into `self.teamCastles` array
 */
communication.initTeamCastleInformation = (self) => {
    if (self.teamCastles.length > 0) {
        self.log('Team castle locations already initialized - aborting method');
        return false;
    } else {
        const maxDist = -2*Math.pow(self.map.length, 2)-1
        const castles = combat.filterByTeam(self, combat.filterByUnitType(self.getVisibleRobots(), "CASTLE"), self.me.team);
        //Initialize some basic information
        castles.forEach(castle => {
            if(castle.hasOwnProperty("x") && castle.hasOwnProperty("y")) {
                self.teamCastles.push({id: castle.id, x: castle.x, y: castle.y});
            } else {
                self.teamCastles.push({id: castle.id, x: maxDist, y: maxDist});
            }
        });
        //Sort so nearest castle is self.teamCastles[0]
        self.teamCastles.sort((a,b) => {
            if(movement.getDistance(self.me, a) > movement.getDistance(self.me, b)) {
                return -1;
            } else {
                return 1;
            }
        });
        return true;
    }
}



export default communication;