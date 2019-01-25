import {BCAbstractRobot, SPECS} from 'battlecode';

const castle = {};

castle.doAction = (self) => {
    self.log("castle " + self.id + " taking turn.");
    return;
}


export default castle;