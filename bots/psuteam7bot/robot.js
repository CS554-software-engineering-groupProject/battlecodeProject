import {BCAbstractRobot, SPECS} from "battlecode";
import pilgrim from './pilgrim.js';
import prophet from './prophet.js';
import castle from './castle.js';
import church from './church.js';

var step = -1;

class MyRobot extends BCAbstractRobot {
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