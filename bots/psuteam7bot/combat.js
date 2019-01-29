import {SPECS} from "battlecode";
import{movement} from "./movement.js";

const combat = {};

combat.UNITTYPE = ["CASTLE", "CHURCH", "PILGRIM", "CRUSADER", "PROPHET" , "PREACHER"]

/**
 * Method to filter a list of robot elements (attackable, visible, etc.) by unit type
 * 
 * @param units List of robots to filter
 * @param type String like "PILGRIM", "CASTLE", etc
 * @return Returns a list of robot information that are all bots of the input type
 */
combat.filterByUnitType = (units, type) => {
    const index = combat.UNITTYPE.indexOf(type);
    return units.filter(robotElement => {
        return robotElement.unit === index;
    });
}

/*Function to get a list of robots in a certain distance range from calling robot
*Input: self        -   reference to the object of the calling robot, should be the value of self.me
*       minRange    -   minimum distance of the range, should be in r^2
*       maxRange    -   maximum distance of the range, should be in r^2
*Output:    RetVal  -   array containing visible robots with distance in the range specified
*/
combat.getRobotsInRange = (self, minRange, maxRange) => {
    return self.getVisibleRobots().filter((robotElement) => {
        const distance = movement.getDistance(self.me, robotElement);
        return distance >= minRange && distance <= maxRange;
    });
}

/*Function to get a list of visible enemy robots
*Input: self        -   reference to the object of the calling robot, should be the value of self.me
*       minRange    -   minimum distance of the range, should be in r^2
*       maxRange    -   maximum distance of the range, should be in r^2
*Output:    RetVal  -   array containing visible enemy robots
*/
combat.getVisibleEnemies = (self) => {
    return self.getVisibleRobots().filter((robotElement) => {
        return robotElement.team !== self.me.team;
    });
}

/*Function to get a list of visible allied robots
*Input: self        -   reference to the object of the calling robot, should be the value of self.me
*Output:    RetVal  -   array containing visible allied robots
*/
combat.getVisibleAllies = (self) => {
    return self.getVisibleRobots().filter((robotElement) => {
        return robotElement.team === self.me.team;
    });
}

/*Function to get a list of robots in a certain distance range from calling robot
*Input: self        -   reference to the object of the calling robot, should be the value of self.me
*Output:    RetVal  -   array containing enemy robots in the calling robot's attack radius
*/
combat.getAttackableEnemies = (self) => {
    return self.getVisibleRobots().filter((robotElement) => {
        const distance = movement.getDistance(self.me, robotElement);

        //Filter for only enemies && distance >= robot's minimum attack radius && distance <= robot's maximum attack radius
        return robotElement.team !== self.me.team && distance >= SPECS.UNITS[self.me.unit].ATTACK_RADIUS[0] && distance <= SPECS.UNITS[self.me.unit].ATTACK_RADIUS[1];
    });
}

/**
 * Method to return information on a single robot of input type (if it exists) closest to current position
 * 
 * @param self MyRobot object
 */
combat.getClosestAttackableEnemy = (self) => {
    let minDist = 100; //Something beyond max range for all units
    let closestBot = null;
    const allEnemies = combat.getAttackableEnemies(self);
    allEnemies.forEach(robotElement => {
        const dist = movement.getDistance(robotElement, self.me);
        if(dist < minDist) {
            minDist = dist;
            closestBot = robotElement;
        }
    });
    return closestBot;
}

/*Function to check whether passed robot have enough fuel to attack
*Input: self        -   reference to the object of the calling robot, should be the value of self.me
*Output:    RetVal  -   true if it can attack, OR false otherwise
*/
combat.hasFuelToAttack = (self) => {
    return self.fuel >= SPECS.UNITS[self.me.unit].ATTACK_FUEL_COST;
}

export default combat;
