import {SPECS} from "battlecode";
import{movement} from "./movement.js";

const combat = {};

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


/*Function to get a list of adjacent friendly castle/ church
*Input: self        -   reference to the object of the calling robot, should be the value of self.me
*Output:    RetVal  -   array containing adjacent friendly castle/ church
*/
combat.getAdjacentBase = (self) => {
    const adjacentBases = self.getVisibleRobots().filter((robotElement) => {
        const distance = movement.getDistance(self.me, robotElement);

        //Filter for only allied && castle || church && adjacent
        return robotElement.team === self.me.team && (robotElement.unit === 0 || robotElement.unit === 1) && distance <= 1;
    });
    if(adjacentBases.length > 0)
        return adjacentBases[0];
    else
        return null;
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

export default combat;
