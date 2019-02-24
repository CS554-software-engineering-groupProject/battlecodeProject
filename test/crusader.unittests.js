const mocha = require('mocha');
const chai = require('chai');
const mockBC19 = require('../projectUtils/mockGame.js');
const MyRobot = require('../projectUtils/psuteam7botCompiled.js').MyRobot;
const crusader = require('../projectUtils/psuteam7botCompiled.js').crusader;
const combat = require('../projectUtils/psuteam7botCompiled.js').combat;
const movement = require('../projectUtils/psuteam7botCompiled.js').movement;
const communication = require('../projectUtils/psuteam7botCompiled.js').communication;
const expect = chai.expect;

describe.only('Combat Unit Tests', function() {
    let mockGame;
    let myBot;
    let localCastle
    let mapLength;
    let output;

    beforeEach(function() {
        mapLength = 10;
        myBot = new MyRobot();
        localCastle = new MyRobot();
        mockGame = new mockBC19('../projectUtils/psuteam7botCompiled.js');
        mockGame.initEmptyMaps(mapLength);
        //Alter so map is viewed as horizontally symmetric
        mockGame.alterMap("map", [{x: 0, y: 0, value: false}, {x: 9, y: 0, value: false}])
        mockGame.createNewRobot(localCastle, 0, 3, 0, 0);
        mockGame.createNewRobot(myBot, 1, 3, 0, 3);
    });

    afterEach(function() {
        mockGame.undoSinonMethods();
    })

    describe('doAction() tests', function() {
        it("UNASSIGNED bots should become ATTACKERS if they can't find a base", function(done) {
            const noBaseBot = new MyRobot();
            mockGame.createNewRobot(noBaseBot, 0, 9, 9, 3);
            output = crusader.doAction(noBaseBot);

            expect(noBaseBot.base).to.be.null;
            expect(noBaseBot.role).equals("ATTACKER");
            expect(output).to.be.undefined;

            done();
        });

        it("UNASSIGNED bots should use the radio signal from the base if one exists", function(done) {
            let stubAttackerAction = mockGame.replaceMethod("crusader", "takeAttackerAction").returns('skipping attacker action');
            let signalPos = communication.signalToPosition(17, mockGame.game.map);
            localCastle.me.signal = 17;
            localCastle.me.signal_radius = 2;
            mockGame._setCommunication(localCastle);

            output = crusader.doAction(myBot);

            expect(myBot.base).to.eql({x: 0, y: 3});
            expect(myBot.role).equals("ATTACKER");
            expect(myBot.potentialEnemyCastleLocation).to.deep.include.members([
                signalPos,    //Castle signal (could be anything)
                {x: 9, y: 6}  //Diagonal patrol (relative to localCastle)
            ]);
            expect(output).equals('skipping attacker action');

            done();
        });

        it("UNASSIGNED bots should use getAttackerPatrolPosition if radio signal from the base DNE", function(done) {
            let stubAttackerAction = mockGame.replaceMethod("crusader", "takeAttackerAction").returns('skipping attacker action');

            output = crusader.doAction(myBot);

            expect(myBot.base).to.eql({x: 0, y: 3});
            expect(myBot.role).equals("ATTACKER");
            expect(myBot.potentialEnemyCastleLocation).to.deep.include.members([
                {x: 9, y: 3}, //Mirror castle location (relative to localCastle)
                {x: 9, y: 6}  //Diagonal patrol (relative to localCastle)
            ]);
            expect(output).equals('skipping attacker action');

            done();
        });
    });

    describe('takeAttackerAction() tests', function() {
        it('should do things', function(done) {
            done();
        });
    });
});