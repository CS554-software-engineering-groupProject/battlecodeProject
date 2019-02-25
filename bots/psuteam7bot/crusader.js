import {BCAbstractRobot, SPECS} from 'battlecode';
import combat from './combat.js';
import movement from './movement.js';
import communication from './communication.js';

const crusader = {};

crusader.doAction = (self) => {
    
    if (self.role === 'UNASSIGNED') {
        self.log("UNASSIGNED crusader " + self.id + " taking turn");
        self.base = movement.findAdjacentBase(self);
        self.log("Set base as " + JSON.stringify(self.base));

        //If for some unknown reason can't find base (e.g. created by base, but then base is destroyed on enemy turn before this bot's turn)
        if(self.base == null)
        {
            self.squadSize = 0;
            self.role = "ATTACKER";
            return;
        }

        //Receive location of enemy base from Castle, if they are signaling to its adjacent square
        self.baseID = self.getVisibleRobotMap()[self.base.y][self.base.x];   //Get ID of the base Castle robot
        const baseRobot = self.getRobot(self.baseID);    //Get robot reference of the base castle robot

        //Receive signal just in case
        if(self.isRadioing(baseRobot))  //Check if base has broadcasted a signal on it's turn
        {
            //Get the message using baseRobot.signal and translate to position using helper function
            self.target = communication.signalToPosition(baseRobot.signal, self.map);
        }
        else
        {
            self.log("UNASSIGNED crusader didn't receive signal from base, getting mirror coord");
            self.target = movement.getMirrorCastle(self.me, self.map);
        }

        self.squadSize = 4; //-1 trigger crusader, need to change squad detection if trigger crusader is to be part of squad
        self.role = "ATTACKER";
    }

    if(self.role === "ATTACKER")
        return crusader.takeAttackerAction(self);

    //Should not fall through unless still UNASSIGNED or something horrible happened
    self.log('crusader ' + self.role + ' ' + self.me.id + ' still UNASSIGNED!!!')
    return;
}

//ATTACKER Behavior
crusader.takeAttackerAction = (self) => {
    self.log("ATTACKER crusader " + self.id + " taking turn");

    //If no base
    if(self.base === null)
    {
        //Set opposite of current coord as target
        self.target = movement.getMirrorCastle(self.me, self.map);
    }

    //If no target, check for update from base
    if(self.target === null)
    {     
        communication.checkBaseSignalAndUpdateTarget(self);
    }

    const visibleRobots = self.getVisibleRobots();
    const attackable = combat.filterByAttackable(self, visibleRobots);

    //Attack visible enemies
    if(attackable.length > 0)
    {
        let attacking = attackable[0];
        self.log("Attacking " + combat.UNITTYPE[attacking.unit] + " at " + attacking.x + ", " +  attacking.y);
        return self.attack(attacking.x - self.me.x, attacking.y - self.me.y);
    }

    //Still no target, and no update from base, do nothing
    if(self.target === null)
    {
        self.log("No target, waiting for signal from base...")
        return;
    }

    //If target is not enemy castle, report to team castles
    if(communication.checkAndReportEnemyCastleDestruction(self))
    {
        //Enemy castle destroyed, waiting for next order
        self.log("Enemy castle destroyed and reported, waiting for next order")
        self.target = null;
        return;
    }

    //If no path yet
    if(self.path.length === 0)
    {
        if(movement.aStarPathfinding(self, self.me, self.target, false)) 
        {
            self.log(self.path);
        } 
        else 
        {
            self.log('Cannot get path to enemy base');
            return;
        }
    }

    //If first seven turns, move away from allied base towards enemy base, else check if squadSize threshold is met and is 0
    if(self.attackerMoves < 6)
    {
        if(movement.hasFuelToMove(self, self.path[self.path.length-1])) {
            self.attackerMoves++;
        } else {
            self.log('ATTACKER crusader ' + self.id + ' waiting for more fuel to move to rally point');
            return;
        }
        self.log('ATTACKER crusader ' + self.id + ' moving to rally point, Current: [' + self.me.x + ',' + self.me.y + ']')
        return movement.moveAlongPath(self);
    }
    else if(self.squadSize === 0)
    {
        if(self.fuel < 100)
        {
            self.log('Low Fuel, Global fuel < 100, ATTACKER crusader ' + self.id + ' Standing by.')
            return;
        }
        self.log('ATTACKER crusader ' + self.id + ' moving towards enemy base, Current: [' + self.me.x + ',' + self.me.y + ']')
        return movement.moveAlongPath(self);
    }
    

    let squad = combat.filterByRange(visibleRobots, self.me, 0, 49);
    squad = combat.filterByUnitType(squad, "CRUSADER");

    //Check if threshold is reached, then just move towards enemy base
    if(squad.length >= self.squadSize) 
    {
        self.log('ATTACKER crusader ' + self.id + ' squad threshold reached! Deathballing')
        self.squadSize = 0;

        return;
    }
    //Should not fall through unless attacker with squadSize threshold not reached yet
    self.log('crusader ' + self.role + ' ' + self.me.id + ' doing nothing')
    return;
}

export default crusader;