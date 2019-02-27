const mocha = require('mocha');
const chai = require('chai');
const mockBC19 = require('../projectUtils/mockGame.js');
const MyRobot = require('../projectUtils/psuteam7botCompiled.js').MyRobot;
const prophet = require('../projectUtils/psuteam7botCompiled.js').prophet;
const combat = require('../projectUtils/psuteam7botCompiled.js').combat;
const movement = require('../projectUtils/psuteam7botCompiled.js').movement;
const communication = require('../projectUtils/psuteam7botCompiled.js').communication;
const expect = chai.expect;

describe.only('Prophet Unit Tests', function() {
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
        mockGame.createNewRobot(myBot, 1, 3, 0, 4);
    });

    afterEach(function() {
        mockGame.undoSinonMethods();
    })

    describe('doAction() tests', function() {
        it("Bots in unspecified roles should do nothing", function(done) {
            myBot.role = "TESTROLE";
            output = prophet.doAction(myBot);

            expect(output).to.be.undefined;

            done();
        });

        it("UNASSIGNED bots should become ATTACKERS if they can't find a base", function(done) {
            const noBaseBot = new MyRobot();
            mockGame.createNewRobot(noBaseBot, 0, 9, 9, 4);
            output = prophet.doAction(noBaseBot);

            expect(noBaseBot.base).to.be.null;
            expect(noBaseBot.role).equals("ATTACKER");
            expect(output).to.be.undefined;

            done();
        });

        it("UNASSIGNED bots should use the radio signal from the base if one exists", function(done) {
            let stubDefenderAction = mockGame.replaceMethod("prophet", "takeDefenderAction").returns('skipping defender action');
            let signalPos = communication.signalToPosition(17, mockGame.game.map);
            localCastle.me.signal = 17;
            localCastle.me.signal_radius = 2;
            mockGame._setCommunication(localCastle);

            output = prophet.doAction(myBot);

            expect(myBot.base).to.eql({x: 0, y: 3});
            expect(myBot.role).equals("DEFENDER");
            expect(myBot.potentialEnemyCastleLocation).to.deep.include.members([
                signalPos,    //Castle signal (could be anything)
                {x: 9, y: 6}  //Diagonal patrol (relative to localCastle)
            ]);
            expect(output).equals('skipping defender action');

            done();
        });

        it("UNASSIGNED bots should use getAttackerPatrolPosition if radio signal from the base DNE", function(done) {
            let stubDefenderAction = mockGame.replaceMethod("prophet", "takeDefenderAction").returns('skipping defender action');

            output = prophet.doAction(myBot);

            expect(myBot.base).to.eql({x: 0, y: 3});
            expect(myBot.role).equals("DEFENDER");
            expect(myBot.potentialEnemyCastleLocation).to.deep.include.members([
                {x: 9, y: 3}, //Mirror curent position (relative to prophet)
                {x: 9, y: 6}  //Diagonal patrol (relative to localCastle)
            ]);
            expect(output).equals('skipping defender action');

            done();
        });

        it("UNASSIGNED bots should become DEFENDERS if 2 or less local prophets, ATTACKERS otherwise", function(done) {
            let stubDefenderAction = mockGame.replaceMethod("prophet", "takeDefenderAction").returns('skipping defender action');
            let stubAttackerAction = mockGame.replaceMethod("prophet", "takeAttackerAction").returns('skipping attacker action');
            myBot.base = {x: localCastle.me.x, y: localCastle.me.y};
            
            //Only defender
            output = prophet.doAction(myBot);

            expect(myBot.role).equals("DEFENDER");
            expect(output).equals('skipping defender action');

            //Two defenders in range of base, one out of range
            myBot.role = "UNASSIGNED";
            mockGame.createNewRobot(new MyRobot(), 8, 3, 0, 4);
            mockGame.createNewRobot(new MyRobot(), 8, 4, 0, 4);

            output = prophet.doAction(myBot);
            
            expect(myBot.role).equals("DEFENDER");
            expect(output).equals('skipping defender action');

            //Two defenders in range of base, one non-prophet also in range
            myBot.role = "UNASSIGNED";
            mockGame.createNewRobot(new MyRobot(), 3, 3, 0, 3);

            output = prophet.doAction(myBot);

            expect(myBot.role).equals("DEFENDER");
            expect(output).equals('skipping defender action');

            //Three defenders in range of base
            myBot.role = "UNASSIGNED";
            mockGame.createNewRobot(new MyRobot(), 4, 4, 0, 4);

            output = prophet.doAction(myBot);

            expect(myBot.role).equals("ATTACKER");
            expect(output).equals('skipping attacker action');

            done();
        });

    });

    describe('takeAttackerAction() tests', function() {
        it('ATTACKERS with no base should identify enemy castles', function(done) {
            myBot.path = [{x: 3, y: 3}];
            myBot.target = {x: 9, y: 3};

            output = prophet.takeAttackerAction(myBot);

            expect(myBot.potentialEnemyCastleLocation).to.deep.include.members([
                {x: 8, y: 3}, //Mirror location (relative to myBot)
                {x: 8, y: 6}  //Diagonal patrol (relative to myBot)
            ]);
            expect(output['action']).equals('move');

            done();
        });

        it('ATTACKERS with base but no potential castles should identify potential locations', function(done) {
            myBot.base = {x: localCastle.me.x, y: localCastle.me.y};
            myBot.path = [{x: 3, y: 3}];
            myBot.target = {x: 9, y: 3};

            output = prophet.takeAttackerAction(myBot);

            expect(myBot.potentialEnemyCastleLocation).to.deep.include.members([
                {x: 9, y: 3}, //Mirror location (relative to localCastle)
                {x: 9, y: 6}  //Diagonal patrol (relative to localCastle)
            ]);
            expect(output['action']).equals('move');

            done();
        });

        it('ATTACKERS with no target should update based on potentialEnemyCastleLocations', function(done) {
            myBot.base = {x: localCastle.me.x, y: localCastle.me.y};
            myBot.path = [{x: 3, y: 3}];

            output = prophet.takeAttackerAction(myBot);

            expect(myBot.potentialEnemyCastleLocation).to.deep.include.members([
                {x: 9, y: 3}, //Mirror location (relative to localCastle)
                {x: 9, y: 6}  //Diagonal patrol (relative to localCastle)
            ]);
            expect(myBot.target).to.eql({x: 9, y: 3});
            expect(output['action']).equals('move');

            done();
        });

        it('ATTACKERS with enemies in attackable range should just attack enemies', function(done) {
            myBot.base = {x: localCastle.me.x, y: localCastle.me.y};
            myBot.path = [{x: 3, y: 3}];
            myBot.target = {x: 9, y: 3};

            //Teammate in attackable range
            mockGame.createNewRobot(new MyRobot(), 1, 7, 0, 2);
            output = prophet.takeAttackerAction(myBot);

            expect(output['action']).equals('move');

            //Enemy out of attackable range
            mockGame.createNewRobot(new MyRobot(), 9, 4, 1, 2);
            output = prophet.takeAttackerAction(myBot);

            expect(output['action']).equals('move');

            //Enemy in attackable range
            mockGame.createNewRobot(new MyRobot(), 9, 3, 1, 2); 
            output = prophet.takeAttackerAction(myBot);

            expect(output['action']).equals('attack');
            expect(output['dx']).equals(8);
            expect(output['dy']).equals(0);            

            done();
        });

        it("ATTACKERS in attack range of castle but who didn't attack should get next potential castle", function(done) {
            myBot.base = {x: localCastle.me.x, y: localCastle.me.y};
            myBot.path = [{x: 3, y: 3}];

            //If only one target left, should stop and do nothing
            myBot.potentialEnemyCastleLocation = [{x: 9, y: 9}];
            myBot.target = {x: 5, y: 3};

            output = prophet.takeAttackerAction(myBot);

            expect(myBot.potentialEnemyCastleLocation.length).equals(0);
            expect(myBot.target).eql({x: 5, y: 3});
            expect(output).to.be.undefined;  
            
            //If more than one target left, should alter potentialEnemyCastleLocation and set new target
            myBot.potentialEnemyCastleLocation = [{x: 5, y: 3}, {x: 9, y: 9}];
            myBot.target = {x: 5, y: 3};

            output = prophet.takeAttackerAction(myBot);

            expect(myBot.potentialEnemyCastleLocation).to.deep.include({x: 9, y: 9});
            expect(myBot.target).eql({x: 9, y: 9});
            expect(output['action']).equals('move');

            done();
        });

        it("ATTACKERS with an empty path should create a path to target", function(done) {
            let stubMoveAlongPath = mockGame.replaceMethod("movement", "moveAlongPath").returns("moved successfully");
            myBot.base = {x: localCastle.me.x, y: localCastle.me.y};
            myBot.target = {x: 9, y: 3};
            myBot.attackerMoves = 6;
            myBot.squadSize = 0;

            output = prophet.takeAttackerAction(myBot);

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
            myBot.fuel = 8;
            output = prophet.takeAttackerAction(myBot);

            expect(myBot.attackerMoves).equals(6);
            expect(output).equals("moved successfully");

            //Not enough fuel, still turns to move
            myBot.attackerMoves = 5;
            myBot.fuel = 7;
            output = prophet.takeAttackerAction(myBot);

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
            output = prophet.takeAttackerAction(myBot);

            expect(myBot.attackerMoves).equals(6);
            expect(output).to.be.undefined;

            //Squad not big enough because bot of wrong type
            mockGame.createNewRobot(new MyRobot(), 5, 3, 0, 3);
            output = prophet.takeAttackerAction(myBot);

            expect(myBot.attackerMoves).equals(6);
            expect(myBot.squadSize).equals(2);
            expect(output).to.be.undefined;

            //Squad not big enough friendly prophet out of range
            mockGame.createNewRobot(new MyRobot(), 9, 4, 0, 4);
            output = prophet.takeAttackerAction(myBot);

            expect(myBot.attackerMoves).equals(6);
            expect(myBot.squadSize).equals(2);
            expect(output).to.be.undefined;

            //Squad big enough
            mockGame.createNewRobot(new MyRobot(), 9, 3, 0, 4);
            output = prophet.takeAttackerAction(myBot);

            expect(myBot.attackerMoves).equals(6);
            expect(myBot.squadSize).equals(0);
            expect(output).to.be.undefined;
            

            done();
        });

        it("ATTACKERS with squadSize set to 0 should rush towards target", function(done) {
            let stubMoveAlongPath = mockGame.replaceMethod("movement", "moveAlongPath").returns("moved successfully");
            myBot.base = {x: localCastle.me.x, y: localCastle.me.y};
            myBot.path = [{x: 3, y: 3}];
            myBot.target = {x: 9, y: 3};
            myBot.attackerMoves = 6;
            myBot.squadSize = 0;

            output = prophet.takeAttackerAction(myBot);

            expect(myBot.attackerMoves).equals(6);
            expect(myBot.squadSize).equals(0);
            expect(output).equals("moved successfully");

            done();
        });
    });

    describe('takeDefenderAction() tests', function() {
        it('DEFENDERS with enemies in attackable range should just attack enemies', function(done) {
            myBot.potentialEnemyCastleLocation = [{x: 9, y: 9}];
            myBot.base = {x: localCastle.me.x, y: localCastle.me.y};
            myBot.path = [{x: 3, y: 3}];
            myBot.target = {x: 9, y: 3};
            myBot.attackerMoves = 0;

            //Teammate in attackable range
            mockGame.createNewRobot(new MyRobot(), 1, 7, 0, 2);
            output = prophet.takeDefenderAction(myBot);

            expect(output['action']).equals('move');
            expect(myBot.attackerMoves).equals(1);

            //Enemy out of attackable range
            mockGame.createNewRobot(new MyRobot(), 9, 4, 1, 2);
            output = prophet.takeDefenderAction(myBot);

            expect(output['action']).equals('move');
            expect(myBot.attackerMoves).equals(2);

            //Enemy in attackable range
            mockGame.createNewRobot(new MyRobot(), 9, 3, 1, 2); 
            output = prophet.takeDefenderAction(myBot);

            expect(output['action']).equals('attack');
            expect(output['dx']).equals(8);
            expect(output['dy']).equals(0);            

            done();
        });


        it("DEFENDERS for first 5 turns should attempt to set path to target if empty", function(done) {
            myBot.potentialEnemyCastleLocation = [{x: 9, y: 3}];
            myBot.base = {x: localCastle.me.x, y: localCastle.me.y};
            myBot.target = {x: 9, y: 3};
            myBot.attackerMoves = 3;

            expect(myBot.path.length).equals(0);
            output = prophet.takeDefenderAction(myBot);

            expect(myBot.path[0]).to.eql(myBot.target);
            expect(output['action']).equals('move');
            expect(myBot.attackerMoves).equals(4);

            //Create impassable terrain so myBot can't get path
            const mapAlterations = [
                {x: 0, y: 2, value: false},
                {x: 0, y: 3, value: false}, //Yes this is a bot, but aStarPathfinding ignore that
                {x: 0, y: 4, value: false},
                {x: 1, y: 1, value: false},
                {x: 1, y: 2, value: false},
                {x: 1, y: 4, value: false},
                {x: 1, y: 5, value: false},
                {x: 2, y: 2, value: false},
                {x: 2, y: 3, value: false},
                {x: 2, y: 4, value: false},
                {x: 3, y: 3, value: false},
            ]

            myBot.path = [];
            mockGame.alterMap("map", mapAlterations);
            expect(myBot.path.length).equals(0);
            output = prophet.takeDefenderAction(myBot);

            expect(myBot.path.length).equals(0);
            expect(output).to.be.undefined;
            expect(myBot.attackerMoves).equals(5);
            

            done();
        });

        it("DEFENDERS after first 5 turns should wait if no enemies to attack", function(done) {
            myBot.potentialEnemyCastleLocation = [{x: 9, y: 3}];
            myBot.base = {x: localCastle.me.x, y: localCastle.me.y};
            myBot.target = {x: 9, y: 3};
            myBot.attackerMoves = 5;

            output = prophet.takeDefenderAction(myBot);

            expect(output).to.be.undefined;
            expect(myBot.attackerMoves).equals(5);           

            done();
        });

    });

    describe.only('fleeBehavior() tests', function() {
        it('should return false if no enemies in blindspot', function(done) {
            mockGame.createNewRobot(new MyRobot(), 5, 3, 1, 3);
            mockGame.createNewRobot(new MyRobot(), 4, 3, 0, 3);
            output = prophet.fleeBehavior(myBot, myBot.getVisibleRobots());       
            
            expect(output).to.be.false;

            done();
        });

        it('should return false if there are no fleeing directions', function(done) {
            const mapAlterations = [ 
                { x: 1, y: 1, value: false},
                { x: 0, y: 2, value: false},
                { x: 1, y: 2, value: false},
                { x: 0, y: 4, value: false},
                { x: 1, y: 4, value: false},
                { x: 1, y: 5, value: false} 
            ];


            mockGame.createNewRobot(new MyRobot(), 3, 3, 1, 3);
            mockGame.alterMap("map", mapAlterations);
            output = prophet.fleeBehavior(myBot, myBot.getVisibleRobots());       
            
            expect(output).to.be.false;

            done();
        });

        it('should return true and add current position and flee position to path', function(done) {
            const fleeingBot = new MyRobot();
            mockGame.createNewRobot(fleeingBot, 3, 3, 1, 4);
            output = prophet.fleeBehavior(fleeingBot, fleeingBot.getVisibleRobots());       
            
            //Optimal move - furthest in direction
            expect(output).to.be.true;
            expect(fleeingBot.path).to.eql([{x: 3, y: 3}, {x: 5, y: 3}]);

            //Next best move - furthest in non-opposite direction
            fleeingBot.path = [];
            mockGame.alterMap("map", [{x: 5, y: 3, value:false}, {x: 3, y: 5, value:false}])
            output = prophet.fleeBehavior(fleeingBot, fleeingBot.getVisibleRobots());       

            expect(output).to.be.true;
            expect(fleeingBot.path).to.eql([{x: 3, y: 3}, {x: 3, y: 1}]);

            //Still best move
            fleeingBot.path = [];
            mockGame.alterMap("map", [{x: 3, y: 1, value:false}, {x: 4, y: 4, value:false}])
            output = prophet.fleeBehavior(fleeingBot, fleeingBot.getVisibleRobots());       

            expect(output).to.be.true;
            expect(fleeingBot.path).to.eql([{x: 3, y: 3}, {x: 4, y: 2}]);

            //Take what you can get
            fleeingBot.path = [];
            mockGame.alterMap("map", [{x: 4, y: 2, value:false}, {x: 4, y: 3, value:false}, {x: 3, y: 4, value:false}])
            output = prophet.fleeBehavior(fleeingBot, fleeingBot.getVisibleRobots());       

            expect(output).to.be.true;
            expect(fleeingBot.path).to.eql([{x: 3, y: 3}, {x: 3, y: 2}]);

            done();
        });
    });
    
});