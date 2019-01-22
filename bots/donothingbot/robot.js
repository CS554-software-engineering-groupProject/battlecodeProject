import {BCAbstractRobot, SPECS} from "battlecode";

var step = -1;

class MyRobot extends BCAbstractRobot {
    turn() {
        step++;
    }
}

/* eslint-disable no-unused-vars */
var robot = new MyRobot();
/* eslint-enable no-unused-vars */