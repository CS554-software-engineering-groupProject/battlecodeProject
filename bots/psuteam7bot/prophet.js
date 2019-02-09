import {BCAbstractRobot, SPECS} from 'battlecode';
import combat from './combat.js';
import movement from './movement.js';

const prophet = {};

prophet.doAction = (self) => {
    
    if (self.role === 'UNASSIGNED') {
        self.log("UNASSIGNED prophet " + self.id + " taking turn");
        self.base = movement.findAdjacentBase(self);
        self.log("Set base as " + JSON.stringify(self.base));

        //TODO Check message from base and record enemy castle location

        if(self.base == null)
        {
            self.role = "ATTACKER";
            return;
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

        //2 defenders per side, assigned as defender if it's less
        if(nearbyDefenders.length < 0)
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
        self.log("DEFENDER prophet " + self.id + " taking turn");
        if(self.target === null)
        {
            self.log("prophet finding local defenders")
            //TODO Change with addition of communication maybe have base record the number of defenders it built and have the prophet receive message from castle
            //Naive method of just filtering nearby prophets from base location, if passing by ATTACKER strays inside, messes with it
            const nearbyDefenders = self.getVisibleRobots().filter((robotElement) => {
                if(robotElement.team === self.me.team && robotElement.unit === self.me.unit && self.me.id != robotElement.id)
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
            const compass = nearbyDefenders.length % 4;

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
    else if(self.role === "ATTACKER")
    {
        self.log("ATTACKER prophet " + self.id + " taking turn");
        if(self.potentialEnemyCastleLocation === null)
        {
            //TODO Set 'Potential enemy castle coordinates' for prophets that spawned/ created at a Church
            //Maybe need pioneer to 'hold' enemy castle locations and have Churches they built store the value and communicate it to ATTACKER?
            //Requires communication and modifying other units

            //Get potential enemy castle locations
            self.potentialEnemyCastleLocation = movement.getAttackerPatrolRoute(self.base, self.map);
            self.target = self.potentialEnemyCastleLocation[0];


            //TODO Set 'Rally point?'? (For amassing friendly forces before attacking as a group  [future sprint obj])
        }
        //TODO Set 'Potential enemy castle coordinates if allied group threshold is reached' [future sprint obj]

        //Get visible robots seems expensive in performance, seems to use a lot of chess timer, especially when there are lots of robots nearby
        //Possibly main cause of script timeout as the game goes on
        //get it once and use filtered value
        const visibleRobots = self.getVisibleRobots();
        const attackable = combat.filterByAttackable(self, visibleRobots);

        /* TODO Possible bug x of undefined inside the fleeing behavior conditional below
        let minUnattackable = combat.filterByTeam(self, visibleRobots, -1);
        minUnattackable = combat.filterByRange(minUnattackable, self.me, 0, SPECS.UNITS[self.me.unit].ATTACK_RADIUS[0]-1);

        
        //Set 'fleeing behavior?' (when not enough fuel to attack/ attack target < min attack range)
        if(minUnattackable.length > 0 || !combat.hasFuelToAttack(self))
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

        //No more patrol waypoint, 
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
    }
    //Should not fall through unless attacker with no army
    self.log('prophet ' + self.role + ' ' + self.me.id + ' doing nothing')
    return;
}


export default prophet;