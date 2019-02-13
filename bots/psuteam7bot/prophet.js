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
                //30, assuming defender moved at max speed (r^2= 4) for 5 turns (4*5 = 20), + 10 to account for the possibility of prophet spawning in different starting tiles
                return distance < 49;
            }
        });

        //2 defenders towards mirror castle, should be enough to kill a crusader in 2 turns before it gets to attack range
        if(nearbyDefenders.length < 2)
        {
            self.log("Base defenders = " + JSON.stringify(nearbyDefenders.length) + ", Assigned as a defender");
            self.role = "DEFENDER";

        }
        else
        {
            self.log("Base defenders = " + JSON.stringify(nearbyDefenders.length) + ", Assigned as an attacker");
            self.squadSize = 10;
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
    
    //Guarding behavior, doesn't flee, doesn't check fuel before attempting to attack
    const attackable = combat.getAttackableEnemies(self);

    if(attackable.length > 0)
    {
        //Compensate guard post movement turn loss due to attacking
        if(self.me.turn < 5)
        {
            --self.me.turn;
        }

        let attacking = attackable[0];
        self.log("Attacking " + combat.UNITTYPE[attacking.unit] + " at " + attacking.x + ", " +  attacking.y);
        return self.attack(attacking.x - self.me.x, attacking.y - self.me.y);
    }


    //Limited movement towards enemy castle (movement towards guard post)
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

    //If first four turns, move away from allied base towards enemy base, else check if squadSize threshold is met and is 0
    if(self.me.turn < 5)
    {
        self.log('ATTACKER prophet ' + self.id + ' moving to rally point, Current: [' + self.me.x + ',' + self.me.y + ']')
        return movement.moveAlongPath(self);
    }
    else if(self.squadSize === 0)
    {
        self.log('ATTACKER prophet ' + self.id + ' moving towards enemy base, Current: [' + self.me.x + ',' + self.me.y + ']')
        return movement.moveAlongPath(self);
    }
    

    let squad = combat.filterByRange(visibleRobots, self.me, 0, 64);
    squad = combat.filterByUnitType(squad, "PROPHET");

    //Check if threshold is reached, then just move towards enemy base
    if(squad.length >= self.squadSize) 
    {
        self.log('ATTACKER prophet ' + self.id + ' squad threshold reached! Deathballing')
        self.squadSize = 0;

        self.log('ATTACKER prophet ' + self.id + ' moving towards enemy base, Current: [' + self.me.x + ',' + self.me.y + ']')
        return movement.moveAlongPath(self);
    }
    //Should not fall through unless attacker with squadSize threshold not reached yet
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

        //Filter for opposite directions perpendicular/ away potential moveable position and is passable
        moveablePositions.filter((location) => {
            if((directionIndex <= location.dirIndex + 2 && directionIndex >= location.dirIndex - 2) 
                && location.r2 <= SPECS.UNITS[self.me.unit].SPEED
                && movement.isPassable(location))
                return true;

            return false;
        });

        //No possible location to flee to, return false
        if(moveablePositions.length === 0)
        {
            return false;
        }

        let minDiffDir = 3;
        let maxDist = 0;
        let bestLoc = null;

        //Get moveable position with lower than minDiffDir and greater than maxDist
        for(let i = 0; i < moveablePositions.length; ++i)
        {
            const current = moveablePositions[i];
            const diffDir = Math.abs(current.dirIndex-directionIndex);
            if(diffDir <= minDiffDir && current.r2 >= maxDist)
            {
                bestLoc = {x: current.x, y: current.y};
                minDiffDir = diffDir;
                maxDist = current.r2;
            }
        }

        if(bestLoc != null)
        {
            //There is a fleeing coord
            //Store retreat position and current position in path (for backtrack after fleeing behavior is done)
            self.path.unshift(bestLoc, self.me);
            self.log("Prophet " + self.id + "Fleeing from attacker" + attacker.unit + " " + attacker.id + " to x: " + bestLoc.x + ", y: " + bestLoc[0].y);
            return true;
        }
        return false;
    }
    return false;
}


export default prophet;