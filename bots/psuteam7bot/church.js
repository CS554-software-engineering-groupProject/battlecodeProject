import {BCAbstractRobot, SPECS} from 'battlecode';

const church = {};
//Initial starting health of 100 and vision radius of 100

//are we explicitely assigning the unique 32 bit integer id?
//this unit always occupies single tile
//what about if the health reduces to zero and the unit is removed? how do we write it here?

church.doAction = (self) => {
    self.log("church " + self.id + " taking turn.");
    return;
}

church.doAction = (self)=> {
    self.log("producing" + r.id + "robot");
    //Churches produce robots, and provide a depot for Pilgrims to deposit resources into the global economy.
    //produce robots with their karbonite and fuel cost. 
    //the robots can be spawned in any adjacent square including diagonals. Robots have to be added to the end of the turn queue.

}

church.doAction = (self)=> {
    self.log("depositing fuel to"+ this.karbonite +" global storage.");
    self.log("depositing fuel to"+ this.fuel +" global storage.")
    //
}


export default church;