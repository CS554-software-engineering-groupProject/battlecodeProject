import {BCAbstractRobot, SPECS} from "battlecode";
import pilgrim from './pilgrim.js';
import prophet from './prophet.js';
import castle from './castle.js';
import church from './church.js';

var step = -1;

class MyRobot extends BCAbstractRobot {
    constructor() {
        super();
        this.role = "UNASSIGNED";                        //Role for unit (for strategy purposes)
        this.target = null;                              //Target destionation like {x: _, y: _}  
        this.base = null;                                //Closest (or original) castle/church like {x: _, y: _} 
        this.previous = {x: this.me.x, y: this.me.y};    //Previous tile traversed by unit like {x: _, y: _}, initialized to the spawning/ starting location
        this.turnsAlive = 0;                             //Record the number of turns the robot has been alive for (Used in 'DEFENDER' prophets for naive guard behavior)
    }
    turn() {
        if (this.myType === undefined){
            switch(this.me.unit) {
                case SPECS.CASTLE:
                    this.myType = castle;
                    break;
                case SPECS.CHURCH:
                    this.myType = church;
                    break;
                case SPECS.PILGRIM:
                    this.myType = pilgrim;
                    break;
                case SPECS.PROPHET:
                    this.myType = prophet;
                    break;
            }
        }
        return this.myType.doAction(this);
    }
}

/* eslint-disable no-unused-vars */
var robot = new MyRobot();
/* eslint-enable no-unused-vars */