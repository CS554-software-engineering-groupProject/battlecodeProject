import {BCAbstractRobot, SPECS} from 'battlecode';
import movement from './movement.js';
import combat from './combat.js';
import communication from './communication.js';

const church = {};

church.doAction = (self) => {

    self.log("church" + self.id + "taking turn.");

}

church.buildFromQueue = (self) => {
    
}

export default church;