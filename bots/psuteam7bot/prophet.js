import {BCAbstractRobot, SPECS} from 'battlecode';
import combat from './combat.js';
import movement from './movement.js';
import communication from './communication.js';

const prophet = {};

prophet.doAction = (self) => {
    
    if (self.role === 'UNASSIGNED') {
        self.log("UNASSIGNED prophet " + self.id + " taking turn");
        self.base = movement.findAdjacentBase(self);
        self.log("Set base as " + JSON.stringify(self.base));

        if(self.base == null)
        {
            self.role = "ATTACKER";
            return;
        }

        //Receive location of enemy base from Castle, if they are signaling to its adjacent square
        const baseID = self.getVisibleRobotMap()[self.base[y]][self.base[x]];   //Get ID of the base Castle robot
        const baseRobot = self.getRobot(baseID);    //Get robot reference of the base castle robot

        //Receive signal just in case
        if(self.isRadioing(baseRobot))  //Check if base has broadcasted a signal on it's turn
        {
            //Get the message using baseRobot.signal and translate to position using helper function
            self.potentialEnemyCastleLocation = [communication.signalToPosition(baseRobot.signal)]; 
        }
        else
        {
            self.potentialEnemyCastleLocation = [movement.getAttackerPatrolRoute(self.base, self.map)];
        }

        //TODO Change with addition of communication maybe have base record the number of defenders it built and have the prophet receive message from castle
        //Naive method of just filtering nearby prophets from base location, if passing by ATTACKER strays inside, messes with it
        const nearbyDefenders = self.getVisibleRobots().filter((robotElement) => {
            if(robotElement.team === self.me.team && robotElement.unit === self.me.unit)
            {
                const distance = movement.getDistance(self.base, robotElement);
                return distance <= 16;
            }
        });

        //2 defenders towards mirror castle
        if(nearbyDefenders.length < 2)
        {
            self.log("Base defenders = " + JSON.stringify(nearbyDefenders.length) + ", Assigned as a defender");
            self.role = "DEFENDER";

        }
        else
        {
            self.log("Base defenders = " + JSON.stringify(nearbyDefenders.length) + ", Assigned as an attacker");
            self.role = "ATTACKER";
        }
    }

    if(self.role === "DEFENDER")
        return prophet.takeDefenderAction(self);

    if(self.role === "ATTACKER")
        return prophet.takeAttackerAction(self);

    //Should not fall through unless still UNASSIGNED or something horrible happened
    self.log('prophet ' + self.role + ' ' + self.me.id + ' still UNASSIGNED!!!')
    return;
}

   //Main behavior of Prophet units
prophet.takeDefenderAction = (self) =>  {
    self.log("DEFENDER prophet " + self.id + " taking turn");
    if(self.target === null)
    {
        self.log("DEFENDER prophet calculating target")

        //Get the direction towards enemy castle
        const direction = movement.getRelativeDirection(self.base, self.potentialEnemyCastleLocation[0]);
        const compass = movement.getDirectionIndex(direction)/2;

        let x = 1;  //movement amount for North East
        let y = 3;

        x *= direction.x;
        y *= direction.y;
        self.log('x: ' + x + ' y: ' + y)

        //Case for vertical movement
        if(compass === 0 || compass === 2)
            self.target = {x: self.base.x + x, y: self.base.y + y};
        else
            self.target = {x: self.base.x + y, y: self.base.y + x};

        self.log("Assigned " + JSON.stringify(self.target) + " as guard post");
    }
    
    //Movement to guard post should only take 5 turns (gave it a little more time to settle)
    if(self.me.turn < 5)
    {
        const moveLocation = movement.moveTowards(self, self.target);

        self.log("Moving towards guard post, targeting " + JSON.stringify(moveLocation));
        return self.move(moveLocation.x-self.me.x, moveLocation.y-self.me.y);
    }

    //Guarding behavior, doesn't flee, doesn't check fuel before attempting to attack
    const attackable = combat.getAttackableEnemies(self);

    if(attackable.length > 0)
    {
        let attacking = attackable[0];
        self.log("Attacking " + combat.UNITTYPE[attacking.unit] + " at " + attacking.x + ", " +  attacking.y);
        return self.attack(attacking.x - self.me.x, attacking.y - self.me.y);
    }
    
    //TODO store 'reclaimed' resources if capacity full and no enemies [future sprint obj]
    //Otherwise, idle.
    return;
}

prophet.takeAttackerAction = (self) => {
    self.log("ATTACKER prophet " + self.id + " taking turn");
    if(self.potentialEnemyCastleLocation === null)
    {
        //Get potential enemy castle locations if Castle didn't send signal
        self.potentialEnemyCastleLocation = movement.getAttackerPatrolRoute(self.base, self.map);
        self.target = self.potentialEnemyCastleLocation[0];
    }

    const visibleRobots = self.getVisibleRobots();
    const attackable = combat.filterByAttackable(self, visibleRobots);

    /*TODO Possible bug x of undefined inside the fleeing behavior conditional below
    let minUnattackable = combat.filterByTeam(self, visibleRobots, -1);
    minUnattackable = combat.filterByRange(minUnattackable, self.me, 0, SPECS.UNITS[self.me.unit].ATTACK_RADIUS[0]-1);

    
    //Set 'fleeing behavior?' (whenattack target < min attack range)
    if(minUnattackable.length > 0)
    {
        const attacker = minUnattackable[0];
        const direction = movement.getRelativeDirection(self.me, attacker);
        const rDist =  Math.sqrt(SPECS.UNITS[self.me.unit].SPEED);
        let moveLocation = {x: self.me.x+rDist*direction.x, y: self.me.y+rDist*direction.y};
        moveLocation = movement.moveTowards(self, moveLocation);

        self.log("Fleeing from " + combat.UNITTYPE[attacker.unit] + " at " + attacker.x + ", " +  attacker.y);

        return self.move(moveLocation);
    }
    */

    //Attack visible enemies
    if(attackable.length > 0)
    {
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

    //No more patrol waypoint, do nothing
    if(self.potentialEnemyCastleLocation.length === 0)
    {
        return;
    }

    //Move towards a patrol waypoint as a squad
    let squad = combat.filterByTeam(self, visibleRobots, self.me.team);
    squad = combat.filterByRange(squad, self.me, 0, 64);

    if(squad.length >= 4) 
    {
        const moveLocation = movement.moveTowards(self, self.target);
        self.log("Moving towards potential enemy castle, targeting " + JSON.stringify(moveLocation));
        return self.move(moveLocation.x-self.me.x, moveLocation.y-self.me.y);
    }
    //Should not fall through unless attacker with no army
    self.log('prophet ' + self.role + ' ' + self.me.id + ' doing nothing')
    return;
}

export default prophet;