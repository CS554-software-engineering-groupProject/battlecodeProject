const mocha = require('mocha');
const chai = require('chai');
const MyRobot = require('../projectUtils/psuteam7botCompiled.js').MyRobot;
const mockBC19 = require('../projectUtils/mockGame.js');
const expect = chai.expect;


describe('MyRobot Unit Tests', function() {
    let myBot;
    let mockGame;
    let output;
    beforeEach(function() {
        myBot = new MyRobot();
        mockGame = new mockBC19('../projectUtils/psuteam7botCompiled.js');
        mockGame.initEmptyMaps(10);
    });

    afterEach(function() {
        mockGame.undoSinonMethods();
    });

    it('should doAction of bot type', function(done) {
        let stubMessages = [
            "castle action taken",
            "church action taken",
            "pilgrim action taken",
            "crusader action taken",
            "prophet action taken"
        ]
        mockGame.replaceMethod("castle", "doAction").returns(stubMessages[0]);
        mockGame.replaceMethod("church", "doAction").returns(stubMessages[1]);
        mockGame.replaceMethod("pilgrim", "doAction").returns(stubMessages[2]);
        mockGame.replaceMethod("crusader", "doAction").returns(stubMessages[3]);
        mockGame.replaceMethod("prophet", "doAction").returns(stubMessages[4]);

        for(let i = 0; i < 5; i++) {
            myBot = new MyRobot();
            mockGame.createNewRobot(myBot, i, i, 0, i);
            output = myBot.turn();
            expect(output).to.equal(stubMessages[i]);
        }

        done();
    });
});