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

/**
 * Checks whether target tile is visible and is empty OR occupied and not a castle and report to allied castles if so
 * Returns the x-coord or y-coord value of the target tile depending on the map reflection
 *
 */
communication.checkAndReportEnemyCastleDestruction = (self) => {
    const {x, y} = self.target;
    const robotID = self.getVisibleRobotMap()[y][x];

    //Case, empty target, castle is destroyed
    if(robotID === 0)
    {
        if(movement.isHorizontalReflection(self.map))
        {
            self.castleTalk(x);
        }
        else    
        {
            self.castleTalk(y);
        }
        return true;
    }
    else //Case target occupied or not in visible radius, -1 or there is a robotID > 0
    {
        //Check if robot is not a castle, if so, report castle destruction
        if(robotID > 0 && self.getRobot(robotID).unit !== 0)
        {
            if(movement.isHorizontalReflection(self.map))
            {
                self.castleTalk(x);
            }
            else    
            {
                self.castleTalk(y);
            }
            return true;
        }
    }
    return false;
}

communication.checkBaseSignalAndUpdateTarget = (self) => {
    const baseRobot = self.getVisibleRobots().filter((bot) => {
        //Filter signalling base robot
        return bot.id === self.baseID && bot.signal > 0;
    });
    if(baseRobot.length > 0)
    {
        //self.log("Found base bot");
        //self.log(baseRobot[0].id);
        if(baseRobot[0].signal > 0)
        {
            self.log("Received signal from base, updated target")
            //self.log(baseRobot[0].signal)
            //Reset target, path and set squadsize to 0, for all existing units of a base
            self.target = communication.signalToPosition(baseRobot[0].signal, self.map);
            self.path = [];
            if(self.attackerMoves > 1)
                self.squadSize = 0;
        }
    }

}

export default communication;