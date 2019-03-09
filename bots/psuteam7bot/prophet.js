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
            self.log("UNASSIGNED prophet didn't receive signal from base, getting mirror coord");
            self.target = movement.getMirrorCastle(self.me, self.map);
        }

        const {x, y} = self.target;
        //If target is a resource depot, set role as destroyer
        if(self.karbonite_map[y][x] || self.fuel_map[y][x])
        {
            self.log("Target is a resource depot, Assigned as a destroyer");
            self.role = "DESTROYER";
            return prophet.takeDestroyerAction(self);
        }

        const nearbyDefenders = self.getVisibleRobots().filter((robotElement) => {
            if(robotElement.team === self.me.team && robotElement.unit === self.me.unit)
            {
                const distance = movement.getDistance(self.base, robotElement);
                return distance <= 64;
            }
        });

        //2 defenders towards mirror castle, should be enough to kill a crusader in 2 turns before it gets to attack range
        if(nearbyDefenders.length < 3)
        {
            self.log("Base defenders = " + JSON.stringify(nearbyDefenders.length) + ", Assigned as a defender");
            self.role = "DEFENDER";

        }
        else
        {
            self.log("Base defenders = " + JSON.stringify(nearbyDefenders.length) + ", Assigned as an attacker");
            self.squadSize = 7; 
            self.role = "ATTACKER";
        }
    }

    if(self.role === "DEFENDER")
        return prophet.takeDefenderAction(self);

    if(self.role === "ATTACKER")
        return prophet.takeAttackerAction(self);

    if(self.role === "DESTROYER")
        return prophet.takeDestroyerAction(self);

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
        let attacking = attackable[0];
        self.log("Attacking " + combat.UNITTYPE[attacking.unit] + " at " + attacking.x + ", " +  attacking.y);
        return self.attack(attacking.x - self.me.x, attacking.y - self.me.y);
    }

    //Limited movement towards enemy castle (movement towards guard post)
    if(self.attackerMoves < 3)
    {
        //Reusing attacker move naming convention
        self.attackerMoves++;
        if(self.path.length === 0)
        {
            if(movement.aStarPathfinding(self, self.me, self.target, false)) {
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
    if(self.base === null)
    {
        //Set opposite of current coord as target
        self.base = {x:-1, y:-1};
        self.target = movement.getMirrorCastle(self.me, self.map);
    }

    //Checks for target update from base
    communication.checkBaseSignalAndUpdateTarget(self);
    communication.sendCastleTalkMessage(self);

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
        self.log("Enemy castle destroyed, message stored")
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
            self.log('ATTACKER prophet ' + self.id + ' moving to rally point, Current: [' + self.me.x + ',' + self.me.y + ']')
            return movement.moveAlongPath(self);
        } else {
            self.log('ATTACKER prophet ' + self.id + ' waiting for more fuel to move to rally point');
            return;
        }
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

        return;
    }
    //Should not fall through unless attacker with squadSize threshold not reached yet
    self.log('prophet ' + self.role + ' ' + self.me.id + ' doing nothing')
    return;
}

/**
 * Method for prophets to flee from enemies in their blindspot (0-15 R^2).
 * 
 * @param self MyRobot prophet doing fleeing
 * @param visibleRobots Visible bots for prophet
 * @return Boolean indicating whether the bot should flee due to an enemy in the blindspot
 */
prophet.fleeBehavior = (self, visibleRobots) => {
    let minUnattackable = combat.filterByTeam(self, visibleRobots, -1);
    minUnattackable = combat.filterByRange(minUnattackable, self.me, 0, SPECS.UNITS[self.me.unit].ATTACK_RADIUS[0]-1);
    
    //Set 'fleeing behavior?' (whenattack target < min attack range)
    if(minUnattackable.length > 0)
    {
        const attacker = minUnattackable[0];
        const direction = movement.getRelativeDirection(attacker, self.me);
        const directionIndex = movement.getDirectionIndex(direction);
        const fleeDirections = movement.getDirectionsBetween(directionIndex, 2, 2);

        //Filter for opposite directions perpendicular/ away potential moveable position and is passable
        const fleeMoves = movement.getMoveablePositions(self.me.unit).filter((location) => {
            const locDirection = movement.directions[location.dirIndex];
            const move = {x: location.x+self.me.x, y: location.y+self.me.y};
            if(fleeDirections.indexOf(locDirection) >= 0
                && movement.isPassable(move, self.map, self.getVisibleRobotMap())) {
                    return true;
                } else {
                    return false;
                }
        });

        //No possible location to flee to, return false
        if(fleeMoves.length === 0)
        {
            return false;
        }        

        let minDiffDir = 3;
        let maxDist = 0;
        let bestLoc = fleeMoves[0];

        //Get moveable position with lower than minDiffDir and greater than maxDist
        for(let i = 0; i < fleeMoves.length; ++i)
        {
            const current = fleeMoves[i];
            const diffDir = Math.min(Math.abs(current.dirIndex-directionIndex), (current.dirIndex+8-directionIndex));
            if(diffDir <= minDiffDir && current.r2 >= maxDist)
            {
                bestLoc = {x: current.x, y: current.y};
                minDiffDir = diffDir;
                maxDist = current.r2;
            }
        }
        //Store retreat position and current position in path (for backtrack after fleeing behavior is done)
        self.path.push({x: self.me.x, y: self.me.y});
        self.path.push({x: bestLoc.x+self.me.x, y: bestLoc.y+self.me.y});
        self.log("Prophet " + self.id + "Fleeing from attacker" + attacker.unit + " " + attacker.id + " to x: " + bestLoc.x + ", y: " + bestLoc.y);
        return true;
    } else {
        return false;
    }
}

//Destroyer Behavior
prophet.takeDestroyerAction = (self) =>  {
    self.log("DESTROYER prophet " + self.id + " taking turn");

    const visibleRobots = self.getVisibleRobots();
    const attackable = combat.filterByAttackable(self, visibleRobots);

    //Flee from enemies
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

    if(movement.positionsAreEqual(self.target, self.me))
    {
        //Check there is a pilgrim trying to get to this target depot
        const nearbyPilgrims = self.getVisibleRobots().filter(bot => {
            return bot.team === self.me.team && bot.unit === 2 && movement.getDistance(self.me, bot) <= 2;
        })
        //If not, just wait
        if(nearbyPilgrims.length === 0) {
            self.log('At target, Waiting...');
            return;
        //If pilgrim wants spot, change target to somewhere else and move off depot for them
        } else {
            self.log("CHANGING TARGET SO PILGRIM CAN MINE/BUILD A CHURCH");
            self.target = movement.findNearestLocation(self, self.me);
        }
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
            self.log('Cannot get path to position');
            return;
        }
    }

    self.log('DESTROYER prophet ' + self.id + ' moving towards target, Current: [' + self.me.x + ',' + self.me.y + ']')
    return movement.moveAlongPath(self);
}

export default prophet;