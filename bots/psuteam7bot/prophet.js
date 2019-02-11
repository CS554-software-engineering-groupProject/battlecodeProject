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
            self.log("UNASSIGNED prophet didn't receive signal from base, using getAttackerPatrolRoute");
            self.potentialEnemyCastleLocation = movement.getAttackerPatrolRoute(self.base, self.map);
        }

        const nearbyDefenders = self.getVisibleRobots().filter((robotElement) => {
            if(robotElement.team === self.me.team && robotElement.unit === self.me.unit)
            {
                const distance = movement.getDistance(self.base, robotElement);
                return distance <= 16;
            }
        });

        //2 defenders towards mirror castle
        if(nearbyDefenders.length < 3)
        {
            self.log("Base defenders = " + JSON.stringify(nearbyDefenders.length) + ", Assigned as a defender");
            self.role = "DEFENDER";

        }
        else
        {
            self.log("Base defenders = " + JSON.stringify(nearbyDefenders.length) + ", Assigned as an attacker");
            self.squadSize = 4;
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

//DEFENDER Behavior
prophet.takeDefenderAction = (self) =>  {
    self.log("DEFENDER prophet " + self.id + " taking turn");
    
    //Limited movement towards enemy castle
    if(self.me.turn < 5)
    {
        if(self.path.length === 0)
        {
            if(movement.aStarPathfinding(self, self.me, self.potentialEnemyCastleLocation[0], false)) {
                self.log(self.path)
            } else {
                self.log('Cannot get path to guard post')
                return;
            }
        }

        self.log('DEFENDER prophet ' + self.id + ' moving towards guard post, Current: [' + self.me.x + ',' + self.me.y + ']')
        return movement.moveAlongPath(self);
    }

    //Guarding behavior, doesn't flee, doesn't check fuel before attempting to attack
    const attackable = combat.getAttackableEnemies(self);

    if(attackable.length > 0)
    {
        let attacking = attackable[0];
        self.log("Attacking " + combat.UNITTYPE[attacking.unit] + " at " + attacking.x + ", " +  attacking.y);
        return self.attack(attacking.x - self.me.x, attacking.y - self.me.y);
    }
    
    self.log("DEFENDER prophet guarding at x: " + self.me.x + ", y: " + self.me.y);
    return;
}


//ATTACKER Behavior
prophet.takeAttackerAction = (self) => {
    self.log("ATTACKER prophet " + self.id + " taking turn");

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

    if(prophet.fleeBehavior(self, visibleRobots))
    {
        return movement.moveAlongPath(self);
    }

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

    //TODO No more patrol waypoint, do nothing
    if(self.potentialEnemyCastleLocation.length === 0)
    {
        return;
    }

    //Move towards a patrol waypoint as a squad
    let squad = combat.filterByTeam(self, visibleRobots, self.me.team);
    squad = combat.filterByRange(squad, self.me, 0, 64);

    if(squad.length >= self.squadSize) 
    {
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
        self.log('ATTACKER prophet ' + self.id + ' moving towards enemy base, Current: [' + self.me.x + ',' + self.me.y + ']')
        return movement.moveAlongPath(self);
    }
    //Should not fall through unless attacker with no nearby teammates/ squad
    self.log('prophet ' + self.role + ' ' + self.me.id + ' doing nothing')
    return;
}


prophet.fleeBehavior = (self, visibleRobots) => {
    let minUnattackable = combat.filterByTeam(self, visibleRobots, -1);
    minUnattackable = combat.filterByRange(minUnattackable, self.me, 0, SPECS.UNITS[self.me.unit].ATTACK_RADIUS[0]-1);

    
    //Set 'fleeing behavior?' (whenattack target < min attack range)
    if(minUnattackable.length > 0)
    {
        const attacker = minUnattackable[0];
        const direction = movement.getRelativeDirection(self.me, attacker);
        const directionIndex = movement.getDirectionIndex(direction);
        const moveablePositions = movement.getMoveablePositions(self);

        //TODO check for other potential tile at dirIndex+1, dirIndex-1
        moveablePositions.filter((location) => {
            if(directionIndex === location.dirIndex && location.r2 === SPECS.UNITS[self.me.unit].SPEED)
                return true;

            return false;
        });

        if(moveablePositions.length > 0)
        {
            //There is a fleeing coord
            //Store retreat position and current position in path (for backtrack after fleeing behavior is done)
            self.path.unshift(moveablePositions[0], self.me);
            self.log("Prophet " + self.id + "Fleeing from attacker" + attacker.unit + " " + attacker.id + " to x: " + moveablePositions[0].x + ", y: " + moveablePositions[0].y);
            return true;
        }
        return false;
    }
    return false;
}


export default prophet;