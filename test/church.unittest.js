const mocha = require('mocha');
const chai = require('chai');
const mockBC19 = require('../projectUtils/mockGame.js');
const MyRobot = require('../projectUtils/psuteam7botCompiled.js').MyRobot;
const church = require('../projectUtils/psuteam7botCompiled.js').church;
const movement = require('../projectUtils/psuteam7botCompiled.js').movement;
const expect = chai.expect;

describe('Church unit test')