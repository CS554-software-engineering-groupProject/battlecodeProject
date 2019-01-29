import {BCAbstractRobot, SPECS} from 'battlecode';
import {combat} from "./combat.js";
const prophet = {};

prophet.doAction = (self) => {
    self.log("prophet " + self.id + " taking turn");
    if (self.role === 'UNASSIGNED') {
        self.base = combat.getAdjacentBase(self);
        self.log("Set base as " + JSON.stringify(self.base));

        const nearbyDefenders = self.getVisibleRobots().filter((robotElement) => {
            const distance = movement.getDistance(self.me, robotElement);

            //Filters for nearby defenders
            //TODO CHECK WHETHER robotElement.role is ILLEGAL/ INVALID
            return distance <= 16 && robotElement.team === self.me.team && robotElement.unit === self.me.unit && robotElement.role === "DEFENDER";
        });

        //2 defenders per side, assigned as defender if it's less
        if(nearbyDefenders.length < 8)
        {
            self.log("Base defenders = " + JSON.stringify(nearbyDefenders.length) + ", Assigned as a defender.");
            self.role = "DEFENDER";

        }
        else
        {
            self.log("Base defenders = " + JSON.stringify(nearbyDefenders.length) + ", Assigned as an attacker.");
            self.role = "ATTACKER";
        }
    }

    //Main behavior of Prophets
    if(self.role === "DEFENDER")
    {
        if(self.target === null)
        {
            //TODO Set 'guard post'
            
        }

        {
            //TODO Travel to 'guard post' if not at guard post

            //TODO else, Guarding behavior
        }
    }
    else if(self.role === "ATTACKER")
    {
        if(self.target === null)
        {
            //TODO Set 'Potential enemy castle coordinates'

            //TODO Set 'Rally point' ? (For amassing friendly forces before attacking as a group)
        }
    }
    return;
}


export default prophet;