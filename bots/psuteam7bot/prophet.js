import {BCAbstractRobot, SPECS} from 'battlecode';
import {combat} from "./combat.js";
const prophet = {};

prophet.doAction = (self) => {
    self.log("prophet " + self.id + " taking turn");

    if (self.role === 'UNASSIGNED') {
        //TODO Change with addition of communication maybe have base record the number of defenders it built and have the prophet receive message from castle
        //Naive method of just filtering nearby prophets from base location, if passing by ATTACKER strays inside, messes with it
        const nearbyDefenders = self.getVisibleRobots().filter((robotElement) => {
            if(robotElement.team === self.me.team && robotElement.unit === self.me.unit)
            {
                const distance = movement.getDistance(self.base, robotElement);
                return distance <= 16;
            }
        });

        self.base = movement.getAdjacentBase(self);
        self.log("Set base as " + JSON.stringify(self.base));

        //2 defenders per side, assigned as defender if it's less
        if(nearbyDefenders.length < 8)
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

    //Main behavior of Prophet units
    if(self.role === "DEFENDER")
    {
        if(self.target === null)
        {
            //TODO Change with addition of communication maybe have base record the number of defenders it built and have the prophet receive message from castle
            //Naive method of just filtering nearby prophets from base location, if passing by ATTACKER strays inside, messes with it
            const nearbyDefenders = self.getVisibleRobots().filter((robotElement) => {
                if(robotElement.team === self.me.team && robotElement.unit === self.me.unit)
                {
                    const distance = movement.getDistance(self.base, robotElement);
                    return distance <= 16;
                }
            });

            //general North/East/South/West guard post direction for checking for horizontal/ vertical movement
            //N = 0
            //E = 1
            //S = 2
            //W = 3
            const compass = nearbyDefenders % 4;

            //Get the direction value from directions array
            let direction = movement.directions[compass*2];

            let x = 1;  //movement amount for North East
            let y = 3;

            //If first four rotate left, otherwise rotate right
            if(nearbyDefenders < 4)
                direction = movement.rotateDirection(direction, -1);
            else
                direction = movement.rotateDirection(direction, 1);

            x *= direction.x;
            y *= direction.y;

            //Case for vertical movement
            if(compass === 0 || compass === 2)
                self.target = {x: self.base.x + x, y: self.base.y + y};
            else
                self.target = {x: self.base.x + y, y: self.base.y + x};

            self.log("Assigned " + JSON.stringify(self.target) + " as guard post");
        }
        
        //Movement to guard post should only take 3 turns
        if(self.turnAlive < 3)
        {
            const moveLocation = movement.moveTowards(self, self.target);

            self.log("Moving to guard post " + JSON.stringify(self.target));
            self.turnAlive++;
            return self.move(moveLocation.x, moveLocation.y);
        }

        //Guarding behavior, doesn't flee, doesn't check fuel before attempting to attack
        const attackable = combat.getAttackableEnemies(self.me);

        if(attackable.length > 0)
        {
            let attacking = attackable[0];
            self.log("Attacking " + combat.UNITTYPE[attacking.unit] + " at " + attacking.x + ", " +  attacking.y);
            self.turnAlive++;
            return self.attack(attacking.x - self.me.x, attacking.y - self.me.y);
        }
        
        //TODO store 'reclaimed' resources if capacity full and no enemies [future sprint obj]
        //Otherwise, idle.
    }
    else if(self.role === "ATTACKER")
    {
        if(self.target === null)
        {
            //TODO Set 'Potential enemy castle coordinates' for prophets that spawned/ created at a Church
            //Maybe need pioneer to 'hold' enemy castle locations and have Churches they built store the value and communicate it to ATTACKER?
            //Requires communication and modifying other units

            if(self.target === null)
            {
                //Choose randomly from 2 potential enemy castle location
                self.target = movement.getPotentialEnemyCastleLocation(self.base, self.map)[Math.floor(Math.random()*choices.length)];
            }

            //TODO Set 'Rally point?'? (For amassing friendly forces before attacking as a group  [future sprint obj])
        }
        //TODO Set 'Potential enemy castle coordinates if allied group threshold is reached' [future sprint obj]

        const attackable = combat.getAttackableEnemies(self.me);
        let minUnattackable = combat.getRobotsInRange(self.me, 0, SPECS.UNITS[self.me.unit].ATTACK_RADIUS[0]-1);
        minUnattackable = combat.getVisibleEnemies(self.me);

        //Set 'fleeing behavior?' (when not enough fuel to attack/ attack target < min attack range)
        if(minUnattackable.length > 0 || !combat.hasFuelToAttack(self.me))
        {
            const attacker = minUnattackable[0];
            const direction = movement.getRelativeDirection(self.me, attacker);
            const rDist =  Math.sqrt(SPECS.UNITS[self.me.unit].SPEED);
            let moveLocation = {x: self.me.x+rDist*direction.x, y: self.me.y+rDist*direction.y};
            moveLocation = movement.moveTowards(self.me, moveLocation);
            self.log("Fleeing from " + combat.UNITTYPE[attacker.unit] + " at " + attacker.x + ", " +  attacker.y);
            self.turnAlive++;
            return self.move(moveLocation);
        }

        //Attack visible enemies
        if(attackable.length > 0)
        {
            let attacking = attackable[0];
            self.log("Attacking " + combat.UNITTYPE[attacking.unit] + " at " + attacking.x + ", " +  attacking.y);
            self.turnAlive++;
            return self.attack(attacking.x - self.me.x, attacking.y - self.me.y);
        }

        //Move towards potential enemy castle location
        const moveLocation = movement.moveTowards(self.me, self.target);
        self.move(moveLocation.x, moveLocation.y);
    }
    //Should not fall through
    self.turnAlive++;
    return;
}


export default prophet;