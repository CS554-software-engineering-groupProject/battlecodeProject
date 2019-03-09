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
        self.base = {x:-1, y:-1};
        self.target = movement.getMirrorCastle(self.me, self.map);
    }

    //Checks for target update from base
    communication.checkBaseSignalAndUpdateTarget(self);
    communication.sendCastleTalkMessage(self);

    const visibleRobots = self.getVisibleRobots();
    const attackable = combat.filterByAttackable(self, visibleRobots);
    const unattackable = combat.filterByUnattackable(self, visibleRobots);

    //Crusader-vs-Prophet micro, single prophet, 1 enemy prophet in attackable range and no other enemy units in vision
    if((attackable.length === 1 && attackable[0].unit === 4) && unattackable.length === 0 && movement.getDistance(self.me, attackable[0]) >= SPECS.UNITS[attackable[0].unit].ATTACK_RADIUS[0])
    {
        const location = movement.getNearestLocationInRadius(self, attackable[0], SPECS.UNITS[attackable[0].unit].ATTACK_RADIUS[0]-1)
        if(!movement.positionsAreEqual(location, attackable[0]))
        {
            movement.aStarPathfinding(self, self.me, location, false);
            self.log('Enemy prophet detected, Crusader-vs-Prophet micro executed');
            return movement.moveAlongPath(self);
        }

    }

    //single prophet, 1 enemy prophet in unattackable range and no other enemy units
    if(unattackable.length === 1  && attackable[0].unit === 4 && movement.getDistance(self.me, attackable[0]) >= SPECS.UNITS[attackable[0].unit].ATTACK_RADIUS[0])
    {
        const location = movement.getNearestLocationInRadius(self, unattackable[0], SPECS.UNITS[attackable[0].unit].ATTACK_RADIUS[0]-1)
        if(!movement.positionsAreEqual(location, unattackable[0]))
        {
            movement.aStarPathfinding(self, self.me, location, false);
            self.log('Enemy prophet detected, Crusader-vs-Prophet micro executed');
            return movement.moveAlongPath(self);
        }
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
            self.log('ATTACKER crusader ' + self.id + ' moving to rally point, Current: [' + self.me.x + ',' + self.me.y + ']')
            return movement.moveAlongPath(self);
        } else {
            self.log('ATTACKER crusader ' + self.id + ' waiting for more fuel to move to rally point');
            return;
        }
    }
    else if(self.squadSize === 0)
    {
        
        //Crusader micro, Crusader-vs-Crusader,
        if(unattackable.length > 0)
        {
            const opforCrusaders = combat.filterByUnitType(unattackable, "CRUSADER");

            if(opforCrusaders.length > 0)
            {
                const botmap = self.getVisibleRobotMap();
                const crusaderAttackRadiusMax = SPECS.UNITS[self.me.unit].ATTACK_RADIUS[1];
                const closestOpfor = movement.getNearestPositionFromList(self.me, self.map, botmap, opforCrusaders, false);
                const moveableList = movement.getMoveablePositions(self).forEach((pos) =>{
                    pos.x += self.me.x;
                    pos.y += self.me.y;
                });
                const notInAttackRadius = moveableList.filter((pos) => {
                    if(movement.getDistance(closestOpfor, pos) > crusaderAttackRadiusMax)
                        return true;
                    return false;
                });

                if(notInAttackRadius.length === 0)
                {
                    self.log("No position not in attack radius for CvC micro found\n");
                    return;
                }

                const bestMoveablePos = movement.getNearestPositionFromList(closestOpfor, self.me.map, botmap, notInAttackRadius, true);
                if(movement.positionsAreEqual(closestOpfor, bestMoveablePos))
                {
                    self.log("No moveable position for CvC micro found\n");
                    return;
                }
                
                self.log('Enemy Crusader in visible range, Crusader-vs-Crusader micro executed');
                self.path.pop();
                movement.adjustPath(self, bestMoveablePos);
                self.log('ATTACKER crusader ' + self.id + ' executing micro movement, Current: [' + self.me.x + ',' + self.me.y + ']')
                return movement.moveAlongPath(self);
            }

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