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
        const baseID = self.getVisibleRobotMap()[self.base.y][self.base.x];   //Get ID of the base Castle robot
        const baseRobot = self.getRobot(baseID);    //Get robot reference of the base castle robot

        //Receive signal just in case
        if(self.isRadioing(baseRobot))  //Check if base has broadcasted a signal on it's turn
        {
            //Get the message using baseRobot.signal and translate to position using helper function
            self.potentialEnemyCastleLocation = [communication.signalToPosition(baseRobot.signal)];
            self.potentialEnemyCastleLocation.push(movement.getDiagonalPatrolPosition(self.base, self.map));
        }
        else
        {
            self.log("UNASSIGNED crusader didn't receive signal from base, using getAttackerPatrolRoute");
            self.potentialEnemyCastleLocation = movement.getAttackerPatrolRoute(self.base, self.map);
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
    if(self.base == null)
    {
        //Set opposite of current coord as target
        self.potentialEnemyCastleLocation = movement.getAttackerPatrolRoute(self.me, self.map);
    }


    //If no target
    if(self.potentialEnemyCastleLocation === null)
    {
        //Get potential enemy castle locations if Castle didn't send signal
        self.potentialEnemyCastleLocation = movement.getAttackerPatrolRoute(self.base, self.map);
    }

    if(self.target === null)
    {     
        self.target = self.potentialEnemyCastleLocation[0];
    }

    const visibleRobots = self.getVisibleRobots();
    const attackable = combat.filterByAttackable(self, visibleRobots);

    //Attack visible enemies
    if(attackable.length > 0)
    {
        --self.me.turn;
        let attacking = attackable[0];
        self.log("Attacking " + combat.UNITTYPE[attacking.unit] + " at " + attacking.x + ", " +  attacking.y);
        return self.attack(attacking.x - self.me.x, attacking.y - self.me.y);
    }

    //No enemy castle at target and there are more waypoint to check
    if(self.potentialEnemyCastleLocation.length > 0 && movement.getDistance(self.me, self.target) <= 49)
    {
        //Assign new target waypoint
        self.potentialEnemyCastleLocation.shift();
        self.target = self.potentialEnemyCastleLocation[0];
    }

    //TODO No more patrol waypoint, do nothing
    if(self.potentialEnemyCastleLocation.length === 0)
    {
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
    if(self.me.turn < 6)
    {
        self.log('ATTACKER crusader ' + self.id + ' moving to rally point, Current: [' + self.me.x + ',' + self.me.y + ']')
        return movement.moveAlongPath(self);
    }
    else if(self.squadSize === 0)
    {
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