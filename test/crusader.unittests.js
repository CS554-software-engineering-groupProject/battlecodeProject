const mocha = require('mocha');
const chai = require('chai');
const mockBC19 = require('../projectUtils/mockGame.js');
const MyRobot = require('../projectUtils/psuteam7botCompiled.js').MyRobot;
const crusader = require('../projectUtils/psuteam7botCompiled.js').crusader;
const combat = require('../projectUtils/psuteam7botCompiled.js').combat;
const movement = require('../projectUtils/psuteam7botCompiled.js').movement;
const communication = require('../projectUtils/psuteam7botCompiled.js').communication;
const expect = chai.expect;

describe('Crusader Unit Tests', function() {
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
        it("Bots in unspecified roles should do nothing", function(done) {
            myBot.role = "TESTROLE";
            output = crusader.doAction(myBot);

            expect(output).to.be.undefined;

            done();
        });

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
            expect(myBot.target).to.eql(signalPos);
            expect(output).equals('skipping attacker action');

            done();
        });

        it("UNASSIGNED bots should use getMirrorCastle if radio signal from the base DNE", function(done) {
            let stubAttackerAction = mockGame.replaceMethod("crusader", "takeAttackerAction").returns('skipping attacker action');

            output = crusader.doAction(myBot);

            expect(myBot.base).to.eql({x: 0, y: 3});
            expect(myBot.role).equals("ATTACKER");
            expect(myBot.target).to.eql({x: 8, y: 3});
            expect(output).equals('skipping attacker action');

            done();
        });
    });

    describe('takeAttackerAction() tests', function() {
        it('ATTACKERS with no base should identify enemy castles', function(done) {
            let stubCheckEnemyCastle = mockGame.replaceMethod("communication", "checkAndReportEnemyCastleDestruction").returns(false);
            myBot.base = null;
            myBot.target = {x: 9, y: 3};

            //Unknown, get mirror castle returns null?
            output = crusader.takeAttackerAction(myBot);
            expect(myBot.base).to.eql({x:-1, y:-1});
            expect(myBot.target).to.eql({x: 8, y: 3});
            expect(output['action']).equals('move');

            done();
        });

        it('ATTACKERS with no target should wait for signal from base and do nothing', function(done) {
            myBot.base = {x: localCastle.me.x, y: localCastle.me.y};

            output = crusader.takeAttackerAction(myBot);

            expect(output).to.be.undefined;

            done();
        });

        it('ATTACKERS with enemies in attackable range should just attack enemies', function(done) {
            myBot.base = {x: localCastle.me.x, y: localCastle.me.y};
            myBot.path = [{x: 3, y: 3}];
            myBot.target = {x: 9, y: 3};

            //Teammate in attackable range
            mockGame.createNewRobot(new MyRobot(), 1, 7, 0, 2);
            output = crusader.takeAttackerAction(myBot);

            expect(output['action']).equals('move');

            //Enemy out of attackable range
            mockGame.createNewRobot(new MyRobot(), 5, 4, 1, 2);
            output = crusader.takeAttackerAction(myBot);

            expect(output['action']).equals('move');

            //Enemy in attackable range
            mockGame.createNewRobot(new MyRobot(), 5, 3, 1, 2); 
            output = crusader.takeAttackerAction(myBot);

            expect(output['action']).equals('attack');
            expect(output['dx']).equals(4);
            expect(output['dy']).equals(0);            

            done();
        });

        it("ATTACKERS with an empty path should create a path to target", function(done) {
            let stubMoveAlongPath = mockGame.replaceMethod("movement", "moveAlongPath").returns("moved successfully");
            myBot.base = {x: localCastle.me.x, y: localCastle.me.y};
            myBot.target = {x: 9, y: 3};
            myBot.attackerMoves = 6;
            myBot.squadSize = 0;

            output = crusader.takeAttackerAction(myBot);

            expect(myBot.path[0]).to.eql(myBot.target);
            expect(output).equals("moved successfully");
            

            done();
        });

        it("ATTACKERS with a path should move for 6 turns iff they have fuel to move", function(done) {
            let stubMoveAlongPath = mockGame.replaceMethod("movement", "moveAlongPath").returns("moved successfully");
            myBot.base = {x: localCastle.me.x, y: localCastle.me.y};
            myBot.path = [{x: 3, y: 3}];
            myBot.target = {x: 9, y: 3};

            //Enough fuel, still turns to move
            myBot.attackerMoves = 5;
            myBot.fuel = 4;
            output = crusader.takeAttackerAction(myBot);

            expect(myBot.attackerMoves).equals(6);
            expect(output).equals("moved successfully");

            //Not enough fuel, still turns to move
            myBot.attackerMoves = 5;
            myBot.fuel = 3;
            output = crusader.takeAttackerAction(myBot);

            expect(myBot.attackerMoves).equals(5);
            expect(output).to.be.undefined;
            

            done();
        });

        it("ATTACKERS after 6 turns should wait for squad and adjust squadSize accordingly", function(done) {
            myBot.base = {x: localCastle.me.x, y: localCastle.me.y};
            myBot.path = [{x: 3, y: 3}];
            myBot.target = {x: 9, y: 3};
            myBot.attackerMoves = 6;
            myBot.squadSize = 2;

            //Squad not big enough
            output = crusader.takeAttackerAction(myBot);

            expect(myBot.attackerMoves).equals(6);
            expect(output).to.be.undefined;

            //Squad not big enough because bot of wrong type
            mockGame.createNewRobot(new MyRobot(), 5, 3, 0, 4);
            output = crusader.takeAttackerAction(myBot);

            expect(myBot.attackerMoves).equals(6);
            expect(myBot.squadSize).equals(2);
            expect(output).to.be.undefined;

            //Squad not big enough friendly crusader out of range
            mockGame.createNewRobot(new MyRobot(), 8, 4, 0, 3);
            output = crusader.takeAttackerAction(myBot);

            expect(myBot.attackerMoves).equals(6);
            expect(myBot.squadSize).equals(2);
            expect(output).to.be.undefined;

            //Squad big enough
            mockGame.createNewRobot(new MyRobot(), 8, 3, 0, 3);
            output = crusader.takeAttackerAction(myBot);

            expect(myBot.attackerMoves).equals(6);
            expect(myBot.squadSize).equals(0);
            expect(output).to.be.undefined;
            

            done();
        });

        it("ATTACKERS with squadSize set to 0 should rush towards target", function(done) {
            let stubMoveAlongPath = mockGame.replaceMethod("movement", "moveAlongPath").returns("moved successfully");
            myBot.base = {x: localCastle.me.x, y: localCastle.me.y};
            myBot.path = [{x: 1, y: 6}];
            myBot.target = {x: 9, y: 3};
            myBot.attackerMoves = 6;
            myBot.squadSize = 0;

            output = crusader.takeAttackerAction(myBot);

            expect(myBot.attackerMoves).equals(6);
            expect(myBot.squadSize).equals(0);
            expect(output).equals("moved successfully");

            done();
        });


    });

    describe('Micro Tests', function() {
        it("ATTACKERS should perform CvP micro if there is a visible attackable enemy prophet and ATTACKER is in its attack radius", function(done) {
            let stubMoveAlongPath = mockGame.replaceMethod("movement", "moveAlongPath").returns("moved successfully");
            myBot.base = {x: localCastle.me.x, y: localCastle.me.y};
            myBot.path = [{x: 1, y: 5}];
            myBot.target = {x: 9, y: 3};
            mockGame.createNewRobot(new MyRobot(), 5, 3, 1, 4 );

            output = crusader.takeAttackerAction(myBot);

            expect(output).equals("moved successfully");
            expect(myBot.path[1]).to.eql({x: 4, y: 3});

            myBot.path = [];
            output = crusader.takeAttackerAction(myBot);

            expect(output).equals("moved successfully");
            expect(myBot.path[0]).to.eql({x: 4, y: 3});
            done();
        });

        it("ATTACKERS should attack if no better moveable position under enemy min attack radius is found", function(done) {
            let stubMoveAlongPath = mockGame.replaceMethod("movement", "moveAlongPath").returns("moved successfully");
            myBot.base = {x: localCastle.me.x, y: localCastle.me.y};
            myBot.path = [{x: 1, y: 5}];
            myBot.target = {x: 9, y: 3};
            mockGame.createNewRobot(new MyRobot(), 5, 3, 1, 4);
            const mapAlterations = [ 
                { x: 2, y: 1, value: false},
                { x: 2, y: 2, value: false},
                { x: 2, y: 3, value: false},
                { x: 2, y: 4, value: false},
                { x: 2, y: 5, value: false},
                { x: 3, y: 1, value: false},
                { x: 3, y: 2, value: false},
                { x: 3, y: 3, value: false},
                { x: 3, y: 4, value: false},
                { x: 3, y: 5, value: false},
                { x: 4, y: 3, value: false}
            ];
            mockGame.alterMap("map", mapAlterations);
            output = crusader.takeAttackerAction(myBot);

            expect(myBot.path[0]).to.eql({x: 1, y: 5});
            expect(myBot.path[1]).to.be.undefined;
            expect(output['action']).equals('attack');
            expect(output['dx']).equals(4);
            expect(output['dy']).equals(0);            

            done();
        });

        it("ATTACKERS should perform CvP micro if there is a visible unattackable enemy prophet and ATTACKER is in its attack radius", function(done) {
            let stubMoveAlongPath = mockGame.replaceMethod("movement", "moveAlongPath").returns("moved successfully");
            myBot.base = {x: localCastle.me.x, y: localCastle.me.y};
            myBot.path = [{x: 1, y: 5}];
            myBot.target = {x: 9, y: 3};
            mockGame.createNewRobot(new MyRobot(), 7, 3, 1, 4 );

            output = crusader.takeAttackerAction(myBot);

            expect(myBot.path[1]).to.eql({x: 4, y: 3});
            expect(output).equals("moved successfully");

            myBot.path = [];
            output = crusader.takeAttackerAction(myBot);

            expect(myBot.path[0]).to.eql({x: 4, y: 3});
            expect(myBot.path[1]).to.be.undefined;
            expect(output).equals("moved successfully");
            done();

        });

        it("ATTACKERS should do the default takeAttackerAction branch of code if no better moveable position is found", function(done) {
            let stubMoveAlongPath = mockGame.replaceMethod("movement", "moveAlongPath").returns("moved successfully");
            myBot.base = {x: localCastle.me.x, y: localCastle.me.y};
            myBot.path = [{x: 1, y: 5}];
            myBot.target = {x: 9, y: 3};
            myBot.attackerMoves = 6;
            myBot.squadSize = 0;
            mockGame.createNewRobot(new MyRobot(), 6, 3, 1, 4);

            output = crusader.takeAttackerAction(myBot);

            expect(myBot.path[0]).to.eql({x: 1, y: 5});
            expect(output).equals("moved successfully");
            done();
        });


        it("ATTACKERS should perform CvC micro and move to closest tile outside of attack range of enemy Crusader", function(done) {
            let stubMoveAlongPath = mockGame.replaceMethod("movement", "moveAlongPath").returns("moved successfully");
            myBot.base = {x: localCastle.me.x, y: localCastle.me.y};
            myBot.path = [{x: 3, y: 3}];
            myBot.target = {x: 9, y: 3};
            myBot.attackerMoves = 6;
            myBot.squadSize = 0;
            mockGame.createNewRobot(new MyRobot(), 8, 3, 1, 3);

            output = crusader.takeAttackerAction(myBot);

            expect(myBot.path[0]).to.eql({x: 2, y: 3});
            expect(myBot.attackerMoves).equals(6);
            expect(myBot.squadSize).equals(0);
            expect(output).equals("moved successfully");

            done();
        });

        it("ATTACKERS should perform CvC micro and not move if current location is the best location outside the enemy Crusader attack range", function(done) {
            let stubMoveAlongPath = mockGame.replaceMethod("movement", "moveAlongPath").returns("moved successfully");
            myBot.base = {x: localCastle.me.x, y: localCastle.me.y};
            myBot.path = [{x: 3, y: 3}];
            myBot.target = {x: 9, y: 3};
            myBot.attackerMoves = 6;
            myBot.squadSize = 0;
            mockGame.createNewRobot(new MyRobot(), 6, 3, 1, 3);
            output = crusader.takeAttackerAction(myBot);

            expect(myBot.path[0]).to.eql({x: 3, y: 3});
            expect(myBot.attackerMoves).equals(6);
            expect(myBot.squadSize).equals(0);
            expect(output).to.be.undefined;

            const mapAlterations = [ 
                { x: 2, y: 1, value: false},
                { x: 2, y: 2, value: false},
                { x: 2, y: 3, value: false},
                { x: 2, y: 4, value: false},
                { x: 2, y: 5, value: false},
                { x: 3, y: 1, value: false},
                { x: 3, y: 2, value: false},
                { x: 3, y: 3, value: false},
                { x: 3, y: 4, value: false},
                { x: 3, y: 5, value: false},
                { x: 4, y: 3, value: false}
            ];
            mockGame.alterMap("map", mapAlterations);

            output = crusader.takeAttackerAction(myBot);

            expect(myBot.path[0]).to.eql({x: 3, y: 3});
            expect(myBot.attackerMoves).equals(6);
            expect(myBot.squadSize).equals(0);
            expect(output).to.be.undefined;

            done();
        });
    })
});