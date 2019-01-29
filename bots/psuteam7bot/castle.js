import {BCAbstractRobot, SPECS} from 'battlecode';

const castle = {};

castle.doAction = (self) => {
    self.log("castle " + self.id + " taking turn.");
    if(self.me.turn < 3) {
        const place = movement.directions[(3*self.me.turn)%8];
        self.log('castle ' + self.id + ' building pilgrim at [' + (self.me.x+place.x) + ',' + (self.me.y+place.y) +']');
        return self.buildUnit(2, place.x, place.y);
    }
    return;
}


export default castle;