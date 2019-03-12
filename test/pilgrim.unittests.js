const mocha = require('mocha');
const chai = require('chai');
const mockBC19 = require('../projectUtils/mockGame.js');
const SPECS = require('../projectUtils/psuteam7botCompiled.js').SPECS;
const MyRobot = require('../projectUtils/psuteam7botCompiled.js').MyRobot;
const pilgrim = require('../projectUtils/psuteam7botCompiled.js').pilgrim;
const expect = chai.expect;


describe('Pilgrim Unit Tests', function() {
    let mockGame;
    let myBot;
    let localCastle;
    let output;
    beforeEach(function() {
        myBot = new MyRobot();
        localCastle = new MyRobot();
        mockGame = new mockBC19('../projectUtils/psuteam7botCompiled.js');
        mockGame.initEmptyMaps(10);
        mockGame.createNewRobot(localCastle, 0, 0, 0, 0);
        mockGame.createNewRobot(myBot, 1, 1, 0, 2);
    })

    afterEach(function() {
        mockGame.undoSinonMethods();
    })

    describe('doAction() tests', function() {
        it('should do nothing if in undefined role', function(done) {
            myBot.role = "TESTROLE";

            output = pilgrim.doAction(myBot);

            expect(output).to.be.undefined;
            done();
        });

        it('UNASSIGNED pilgrims should set their base and target then become PIONEERS', function(done) {
            let stubTakePioneerAction = mockGame.replaceMethod("pilgrim", "takePioneerAction").returns('taking pioneer action');
            myBot.role = "UNASSIGNED";
            localCastle.me.signal = 4;
            localCastle.me.signal_radius = 2;
            
            mockGame._setCommunication(localCastle);
            output = pilgrim.doAction(myBot);

            expect(myBot.base).to.eql({x: 0, y: 0});
            expect(myBot.target).to.eql({x: 4, y: 0});
            expect(output).equals('taking pioneer action');
            done();
        });

        it('UNASSIGNED pilgrims with no local base should set base to current position', function(done) {
            let stubTakePioneerAction = mockGame.replaceMethod("pilgrim", "takePioneerAction").returns('taking pioneer action');
            let stubSignal2Position = mockGame.replaceMethod("communication", "signalToPosition").returns({x: 5, y: 5});
            
            mockGame.removeAllBots();
            mockGame.createNewRobot(localCastle, 1, 3, 0, 2);
            mockGame.createNewRobot(myBot, 1, 1, 0, 2);
            myBot.teamCastles = [{id: localCastle.id, x: localCastle.me.x, y: localCastle.me.y}];
            output = pilgrim.doAction(myBot);

            expect(myBot.base).to.eql({x: 1, y: 1});
            expect(myBot.target).to.eql({x: 5, y: 5});
            expect(output).equals('taking pioneer action');
            done();
        });

        it('PIONEER/MINER pilgrims should just call respective action methods', function(done) {
            let stubTakePioneerAction = mockGame.replaceMethod("pilgrim", "takePioneerAction").returns('taking pioneer action');
            let stubTakeMinerAction = mockGame.replaceMethod("pilgrim", "takeMinerAction").returns('taking miner action');
            myBot.role = "PIONEER";

            output = pilgrim.doAction(myBot);

            expect(myBot.base).to.be.null;
            expect(output).equals('taking pioneer action');

            myBot.role = "MINER";

            output = pilgrim.doAction(myBot);

            expect(myBot.base).to.be.null;
            expect(output).equals('taking miner action');
            done();
        })
    })

    describe('takePioneerAction() tests', function() {
        it('should set target to karbonite depot if no target and odd number of local pilgrims', function(done) {
            let stubMoveAlongPath = mockGame.replaceMethod("movement", "moveAlongPath").returns('move made');
            const karbAlterations = [
                {x: 3, y: 4, value:true},
                {x: 1, y: 5, value:true}
            ];
            const fuelAlterations = [
                {x: 4, y: 3, value:true},
                {x: 5, y: 1, value:true}
            ];
            mockGame.alterMap("karbonite_map", karbAlterations);
            mockGame.alterMap("fuel_map", fuelAlterations);

            //One local pilgrim (itself)
            output = pilgrim.takePioneerAction(myBot);

            expect(myBot.target).to.not.be.null;
            expect(myBot.target).eql({x: 3, y: 4});
            expect(myBot.karbonite_map[myBot.target.y][myBot.target.x]).to.be.true;
            expect(myBot.fuel_map[myBot.target.y][myBot.target.x]).to.be.false;
            expect(output).equals('move made');

            //Still one local pilgrim
            myBot.target = null;
            mockGame.createNewRobot(new MyRobot(), 5, 5, 1, 2);
            mockGame.createNewRobot(new MyRobot(), 9, 8, 0, 2);
            output = pilgrim.takePioneerAction(myBot);

            expect(myBot.target).to.not.be.null;
            expect(myBot.target).eql({x: 3, y: 4});
            expect(myBot.karbonite_map[myBot.target.y][myBot.target.x]).to.be.true;
            expect(myBot.fuel_map[myBot.target.y][myBot.target.x]).to.be.false;
            expect(output).equals('move made');

            //Three local pilgrims
            myBot.target = null;
            mockGame.createNewRobot(new MyRobot(), 9, 7, 0, 2);
            mockGame.createNewRobot(new MyRobot(), 8, 8, 0, 2);
            output = pilgrim.takePioneerAction(myBot);

            expect(myBot.target).to.not.be.null;
            expect(myBot.target).eql({x: 3, y: 4});
            expect(myBot.karbonite_map[myBot.target.y][myBot.target.x]).to.be.true;
            expect(myBot.fuel_map[myBot.target.y][myBot.target.x]).to.be.false;
            expect(output).equals('move made');
            
            done();
        });

        it('should set target to fuel depot if no target and even number of local pilgrims', function(done) {
            let stubMoveAlongPath = mockGame.replaceMethod("movement", "moveAlongPath").returns('move made');
            const karbAlterations = [
                {x: 3, y: 4, value:true},
                {x: 1, y: 5, value:true}
            ];
            const fuelAlterations = [
                {x: 4, y: 3, value:true},
                {x: 5, y: 1, value:true}
            ];
            mockGame.alterMap("karbonite_map", karbAlterations);
            mockGame.alterMap("fuel_map", fuelAlterations);
            mockGame.createNewRobot(new MyRobot(), 2, 2, 0, 2);

            //Two locals pilgrims
            output = pilgrim.takePioneerAction(myBot);

            expect(myBot.target).to.not.be.null;
            expect(myBot.target).eql({x: 4, y: 3});
            expect(myBot.karbonite_map[myBot.target.y][myBot.target.x]).to.be.false;
            expect(myBot.fuel_map[myBot.target.y][myBot.target.x]).to.be.true;
            expect(output).equals('move made');

            //Still two local pilgrims
            myBot.target = null;
            mockGame.createNewRobot(new MyRobot(), 5, 5, 1, 2);
            mockGame.createNewRobot(new MyRobot(), 9, 8, 0, 2);
            output = pilgrim.takePioneerAction(myBot);

            expect(myBot.target).to.not.be.null;
            expect(myBot.target).eql({x: 4, y: 3});
            expect(myBot.karbonite_map[myBot.target.y][myBot.target.x]).to.be.false;
            expect(myBot.fuel_map[myBot.target.y][myBot.target.x]).to.be.true;
            expect(output).equals('move made');

            //Four local pilgrims
            myBot.target = null;
            mockGame.createNewRobot(new MyRobot(), 9, 7, 0, 2);
            mockGame.createNewRobot(new MyRobot(), 8, 8, 0, 2);
            output = pilgrim.takePioneerAction(myBot);

            expect(myBot.target).to.not.be.null;
            expect(myBot.target).eql({x: 4, y: 3});
            expect(myBot.karbonite_map[myBot.target.y][myBot.target.x]).to.be.false;
            expect(myBot.fuel_map[myBot.target.y][myBot.target.x]).to.be.true;
            expect(output).equals('move made');

            done();
        });

        it.skip('should become miner if at target with local base nearby', function(done) {
            let stubTakeMinerAction = mockGame.replaceMethod("pilgrim", "takeMinerAction").returns('becoming miner');
            let stubBuildChurch = mockGame.replaceMethod("pilgrim", "buildChurch").returns('not becoming miner');
            myBot.target = {x: myBot.me.x, y: myBot.me.y};

            //Nearby team castle, should become miner
            output = pilgrim.takePioneerAction(myBot);

            expect(myBot.role).equals('MINER');
            expect(myBot.base).to.eql({x: 0, y: 0})
            expect(output).equals('becoming miner');

            //Nearby team church, should become miner 
            mockGame.removeAllBots();
            mockGame.createNewRobot(myBot, 0, 0, 0, 2);
            myBot.target = {x: myBot.me.x, y: myBot.me.y};
            myBot.role = "PIONEER";
            mockGame.createNewRobot(new MyRobot(), 0, 7, 0, 1);
            output = pilgrim.takePioneerAction(myBot);

            expect(myBot.role).equals('MINER');
            expect(myBot.base).to.eql({x: 0, y: 7});
            expect(output).equals('becoming miner');

            //No nearby team bases, should stay pioneer 
            mockGame.removeAllBots();
            mockGame.createNewRobot(myBot, 0, 0, 0, 2);
            myBot.target = {x: myBot.me.x, y: myBot.me.y};
            myBot.role = "PIONEER";
            mockGame.createNewRobot(new MyRobot(), 1, 7, 0, 0);
            mockGame.createNewRobot(new MyRobot(), 5, 5, 0, 1);
            mockGame.createNewRobot(new MyRobot(), 7, 0, 1, 0);
            mockGame.createNewRobot(new MyRobot(), 3, 3, 1, 1);
            output = pilgrim.takePioneerAction(myBot);

            expect(output).equals('not becoming miner');
            expect(myBot.role).equals('PIONEER');

            done();
        });

        it.skip('should attempt to build a church if at target but no local base nearby', function(done) {
            let stubBuildChurch = mockGame.replaceMethod("pilgrim", "buildChurch").returns('building church');

            //Nearby team church, should become miner 
            mockGame.removeAllBots();
            mockGame.createNewRobot(myBot, 0, 0, 0, 2);
            myBot.target = {x: myBot.me.x, y: myBot.me.y};
            myBot.role = "PIONEER";
            myBot.karbonite = 50;
            myBot.fuel = 200;
            output = pilgrim.takePioneerAction(myBot);

            expect(myBot.role).equals('PIONEER');
            expect(output).equals('building church');

            done();
        });

        it.skip('should mine if at target with no local base nearby, but not enough resources for church', function(done) {
            let stubBuildChurch = mockGame.replaceMethod("pilgrim", "buildChurch").returns('building church');

            //Nearby team church, should become miner 
            mockGame.removeAllBots();
            mockGame.createNewRobot(myBot, 0, 0, 0, 2);
            mockGame.alterMap("karbonite_map", [{x: myBot.me.x, y: myBot.me.y, value:true}])
            myBot.target = {x: myBot.me.x, y: myBot.me.y};
            myBot.role = "PIONEER";
            myBot.karbonite = 49;
            myBot.fuel = 200;
            output = pilgrim.takePioneerAction(myBot);

            expect(myBot.role).equals('PIONEER');
            expect(output['action']).equals('mine');

            myBot.karbonite = 50;
            myBot.fuel = 199;
            output = pilgrim.takePioneerAction(myBot);

            expect(myBot.role).equals('PIONEER');
            expect(output['action']).equals('mine');

            done();
        });

        it('should move towards target if not there yet', function(done) {
            let stubMoveAlongPath = mockGame.replaceMethod("movement", "moveAlongPath").returns('move made');
            myBot.target = {x: myBot.me.x+1, y: myBot.me.y+1};

            //Two locals pilgrims
            output = pilgrim.takePioneerAction(myBot);

            expect(output).equals('move made');

            done();
        });
    });

    describe('takeMinerAction() tests', function() {
        it('should set target to depot of relatively less plentiful resource if no target', function(done) {
            let stubMoveAlongPath = mockGame.replaceMethod("movement", "moveAlongPath").returns('move made');
            const karbAlterations = [
                {x: 3, y: 4, value:true},
                {x: 1, y: 5, value:true}
            ];
            const fuelAlterations = [
                {x: 4, y: 3, value:true},
                {x: 5, y: 1, value:true}
            ];
            mockGame.alterMap("karbonite_map", karbAlterations);
            mockGame.alterMap("fuel_map", fuelAlterations);

            //Relatively more karbonite, target fuel
            myBot.karbonite = 10;
            myBot.fuel = myBot.karbonite*5-1;
            output = pilgrim.takeMinerAction(myBot);

            expect(myBot.target).to.not.be.null;
            expect(myBot.target).eql({x: 4, y: 3});
            expect(myBot.karbonite_map[myBot.target.y][myBot.target.x]).to.be.false;
            expect(myBot.fuel_map[myBot.target.y][myBot.target.x]).to.be.true;
            expect(output).equals('move made');

            //Relatively more fuel, target karbonite
            myBot.karbonite = 10;
            myBot.fuel = myBot.karbonite*5+1;
            myBot.target = null;
            output = pilgrim.takeMinerAction(myBot);

            expect(myBot.target).to.not.be.null;
            expect(myBot.target).eql({x: 3, y: 4});
            expect(myBot.karbonite_map[myBot.target.y][myBot.target.x]).to.be.true;
            expect(myBot.fuel_map[myBot.target.y][myBot.target.x]).to.be.false;
            expect(output).equals('move made');

            //Relatively equal resources, target karbonite
            myBot.karbonite = 10;
            myBot.fuel = myBot.karbonite*5;
            myBot.target = null;
            output = pilgrim.takeMinerAction(myBot);

            expect(myBot.target).to.not.be.null;
            expect(myBot.target).eql({x: 3, y: 4});
            expect(myBot.karbonite_map[myBot.target.y][myBot.target.x]).to.be.true;
            expect(myBot.fuel_map[myBot.target.y][myBot.target.x]).to.be.false;
            expect(output).equals('move made');

            //Edge case with 0 karbonite, target karbonite
            myBot.karbonite = 0;
            myBot.fuel = 3;
            myBot.target = null;
            output = pilgrim.takeMinerAction(myBot);

            expect(myBot.target).to.not.be.null;
            expect(myBot.target).eql({x: 3, y: 4});
            expect(myBot.karbonite_map[myBot.target.y][myBot.target.x]).to.be.true;
            expect(myBot.fuel_map[myBot.target.y][myBot.target.x]).to.be.false;
            expect(output).equals('move made');
            
            done();
        });

        
        it('should give resources if near adjacent base and fuel or karbonite at carrying capacity', function(done) {
            myBot.target = {x: myBot.me.x, y: myBot.me.y};
            myBot.me.karbonite = 20;

            output = pilgrim.takeMinerAction(myBot);

            expect(output['action']).equals('give');
            expect(output['dx']).equals(-1);
            expect(output['dy']).equals(-1);

            myBot.me.karbonite = 0;
            myBot.me.fuel = 100;

            output = pilgrim.takeMinerAction(myBot);

            expect(output['action']).equals('give');
            expect(output['dx']).equals(-1);
            expect(output['dy']).equals(-1);

            done();
        });

        it('should move towards base if not near castle, there is a path, and fuel or karbonite at carrying capacity', function(done) {
            let stubMoveAlongPath = mockGame.replaceMethod("movement", "moveAlongPath").returns('move made');
            const returningPilgrim = new MyRobot();
            mockGame.createNewRobot(returningPilgrim, 5, 5, 0, 2);
            returningPilgrim.path = [{x: 2, y: 2}];
            returningPilgrim.target = {x: myBot.me.x+1, y: myBot.me.y+1};
            returningPilgrim.me.karbonite = 20;

            output = pilgrim.takeMinerAction(returningPilgrim);

            expect(output).equals('move made');

            done();
        });

        it('should update path to base if no path and fuel or karbonite at carrying capacity', function(done) {
            let stubMoveAlongPath = mockGame.replaceMethod("movement", "moveAlongPath").returns('move made');
            const returningPilgrim = new MyRobot();
            mockGame.createNewRobot(returningPilgrim, 5, 5, 0, 2);
            returningPilgrim.target = {x: localCastle.me.x, y: localCastle.me.y};
            returningPilgrim.base = {x: localCastle.me.x, y: localCastle.me.y};
            returningPilgrim.me.karbonite = 20;

            output = pilgrim.takeMinerAction(returningPilgrim);

            expect(returningPilgrim.path[0]).eql({x: localCastle.me.x, y: localCastle.me.y});
            expect(output).equals('move made');

            done();
        });

        it('should mine if not at carrying capacity and at target depot', function(done) {
            myBot.target = {x: myBot.me.x, y: myBot.me.y};
            myBot.me.karbonite = 19;
            myBot.me.fuel = 99;

            mockGame.alterMap("karbonite_map", [{x: myBot.me.x, y: myBot.me.y, value:true}])
            output = pilgrim.takeMinerAction(myBot);

            expect(output['action']).equals('mine');

            done();
        });

        it('should move towards target if not at carrying capacity and not at target depot', function(done) {
            let stubMoveAlongPath = mockGame.replaceMethod("movement", "moveAlongPath").returns('move made');
            myBot.target = {x: myBot.me.x+1, y: myBot.me.y+1};
            myBot.me.karbonite = 19;
            myBot.me.karbonite = 99;

            output = pilgrim.takeMinerAction(myBot);

            expect(output).equals('move made');

            done();
        });
    });

    describe('buildChurch() tests', function() {
        it('should skip building if no viable build locations', function(done) {
            let stubMoveAlongPath = mockGame.replaceMethod("movement", "moveAlongPath").returns('move made');
            const karbAlterations = [
                {x: 0, y: 1, value:true},
                {x: 0, y: 2, value:true},
                {x: 1, y: 0, value:true}
            ];
            const fuelAlterations = [
                {x: 2, y: 2, value:true},
                {x: 2, y: 1, value:true},
                {x: 1, y: 2, value:true}
            ];
            mockGame.alterMap("karbonite_map", karbAlterations);
            mockGame.alterMap("fuel_map", fuelAlterations);
            mockGame.createNewRobot(new MyRobot(), 2, 0, 0, 2);
            mockGame.createNewRobot(new MyRobot(), 0, 2, 0, 2);

            output = pilgrim.buildChurch(myBot);

            expect(output).to.be.undefined;

            done();
        });

        it('should build church at best location if at least one viable spot', function(done) {
            let stubMoveAlongPath = mockGame.replaceMethod("movement", "moveAlongPath").returns('move made');
            const karbAlterations = [
                {x: 1, y: 0, value:true},
                {x: 0, y: 2, value:true},
                {x: 1, y: 0, value:true}
            ];
            const fuelAlterations = [
                {x: 2, y: 2, value:true},
                {x: 2, y: 1, value:true},
                {x: 2, y: 0, value:true}
            ];
            mockGame.alterMap("karbonite_map", karbAlterations);
            mockGame.alterMap("fuel_map", fuelAlterations);

            output = pilgrim.buildChurch(myBot);

            expect(output['action']).equals('build');
            expect(output['dx']).equals(0);
            expect(output['dy']).equals(1)

            done();
        });
    });


    describe.skip('Role objectives tests', function(done) {

        it('MINERS without a target should identify and move towards a resource', function(done) {
            let returnValue;
            let target;
            const myBot = new MyRobot();
            myBot._bc_game_state = {shadow: null};
            myBot.me = {
                id: 1,
                unit: 2, //Pilgrim
                x: 0,
                y: 0,
                fuel: 0,
                karbonite: 0
            }
            myBot._bc_game_state.shadow = myBot.map = 
                        [[1,0,0,0,0],
                         [0,0,0,0,0],
                         [0,0,0,0,0],
                         [0,0,0,0,0],
                         [0,0,0,0,0]];
            myBot.karbonite_map = [[0,0,0,0,0],
                                   [0,0,0,0,0],
                                   [0,0,0,0,0],
                                   [0,0,0,1,0],
                                   [1,0,1,0,1]];
            myBot.fuel_map = [[0,0,0,1,0],
                              [0,0,0,0,0],
                              [0,0,1,0,0],
                              [1,0,0,0,0],
                              [0,0,0,0,0]];

            //Initially should be unassigned with no target
            expect(myBot.role).equals('UNASSIGNED');
            expect(myBot.target).to.be.null;
            //Test target being set to nearest karbonite location when relatively less karbonite
            myBot.karbonite = 0;
            myBot.fuel = 10;

            returnValue = pilgrim.doAction(myBot);
            expect(myBot.role).equals('MINER');
            expect(myBot.target).to.be.have.property('x', 0);
            expect(myBot.target).to.be.have.property('y', 4);
            expect(myBot.karbonite_map[myBot.target.y][myBot.target.x]).to.be.ok;

            //Test target being set to nearest fuel location when relatively less fuel
            myBot.target = null;
            myBot.karbonite = 10;
            myBot.fuel = 10;

            returnValue = pilgrim.doAction(myBot);
            expect(myBot.role).equals('MINER');
            expect(myBot.target).to.be.have.property('x', 2);
            expect(myBot.target).to.be.have.property('y', 2);
            expect(myBot.fuel_map[myBot.target.y][myBot.target.x]).to.be.ok;

            done();
        });

        it.skip('MINERS at capacity for either karbonite or fuel should be able to deposit resources', function(done) {
            let returnValue;
            let target;
            const myBot = new MyRobot();
            myBot._bc_game_state = {shadow: null};
            myBot.me = {
                id: 1,
                unit: 2, //Pilgrim
                x: 0,
                y: 0,
                fuel: 0,
                karbonite: 0
            }
            const castle = new MyRobot();
            castle.me = {
                id: 10,
                unit: 0, //Pilgrim
                x: 1,
                y: 0
            }
            myBot._bc_game_state.shadow = myBot.map = 
                        [[10,0,0,0,0],
                         [0,1,0,0,0],
                         [0,0,0,0,0],
                         [0,0,0,0,0],
                         [0,0,0,0,0]];
            myBot.karbonite_map = [[0,0,0,0,0],
                                   [0,0,0,0,0],
                                   [0,0,0,0,0],
                                   [0,0,0,1,0],
                                   [1,0,1,0,1]];
            myBot.fuel_map = [[0,0,0,1,0],
                              [0,0,0,0,0],
                              [0,0,1,0,0],
                              [1,0,0,0,0],
                              [0,0,0,0,0]];

            //console.log(myBot.getVisibleRobots());

            done();
        });

        it.skip('PIONEERS without a target should identify and move towards a resource', function(done) {
            let returnValue;
            let target;
            const myBot = new MyRobot();
            myBot._bc_game_state = {shadow: null};
            myBot.me = {
                id: 1,
                unit: 2, //Pilgrim
                x: 0,
                y: 0,
                fuel: 0,
                karbonite: 0
            }
            const castle = new MyRobot();
            castle.me = {
                id: 10,
                unit: 0, //Pilgrim
                x: 1,
                y: 0
            }
            myBot._bc_game_state.shadow = myBot.map = 
                        [[1,0,0,0,0],
                         [0,0,0,0,0],
                         [0,0,0,0,0],
                         [0,0,0,0,0],
                         [0,0,0,0,0]];
            myBot.karbonite_map = [[0,0,0,0,0],
                                   [0,0,0,0,0],
                                   [0,0,0,0,0],
                                   [0,0,0,1,0],
                                   [1,0,1,0,1]];
            myBot.fuel_map = [[0,0,0,1,0],
                              [0,0,0,0,0],
                              [0,0,1,0,0],
                              [1,0,0,0,0],
                              [0,0,0,0,0]];

            //console.log(myBot.getVisibleRobots());

            done();
        });
    });

    describe('Mining tests', function() {
        it('should be able to mine if on a resource depot', function(done) {
            let returnValue;
            const myBot = new MyRobot();
            myBot.karbonite = 100;
            myBot.fuel = 100;
            myBot.me = {
                id: 1,
                unit: 2, //Pilgrim
                x: 0,
                y: 0,
                fuel: 0,
                karbonite: 0
            }

            //Check that it can mine on karbonite depot
            myBot.karbonite_map = [[true]];
            myBot.fuel_map = [[false]];

            returnValue = pilgrim.mine(myBot);
            //The syntax for this expectation is ugly, but this is the best check to guarantee that 'this.mine()' was called
            expect(returnValue['action']).equals('mine');

            //Second check that it can mine on fuel depot
            myBot.karbonite_map = [[false]];
            myBot.fuel_map = [[true]];

            returnValue = pilgrim.mine(myBot);
            expect(returnValue['action']).equals('mine');

            done();
        });

        it('should not be able to mine if not on a resource depot', function(done) {
            let returnValue;
            let expectedErrorLog;
            const myBot = new MyRobot();
            myBot.karbonite = 100;
            myBot.fuel = 100;
            myBot.id = 1;
            myBot.me = {
                unit: 2, //Pilgrim
                x: 0,
                y: 0,
                fuel: 0,
                karbonite: 0
            }

            myBot.karbonite_map = [[false]];
            myBot.fuel_map = [[false]];
            //Can check logs to see if expected error passed. Logs are funny in that they use JSON.stringify, hence the given structure
            expectedErrorLog = JSON.stringify("pilgrim " + myBot.id + " attempting to mine where there is no resource");

            returnValue = pilgrim.mine(myBot);
            //Should just return undefined
            expect(returnValue).to.be.undefined;
            expect(myBot._bc_logs).to.include(expectedErrorLog);

            done();
        });

        it('should not be able to mine if at carrying capacity', function(done) {
            let returnValue;
            let expectedErrorLog;
            const myBot = new MyRobot();
            myBot.karbonite = 100;
            myBot.fuel = 100;
            myBot.id = 1;
            myBot.me = {
                unit: 2, //Pilgrim
                x: 0,
                y: 0,
                fuel: 100,
                karbonite: 20
            }

            //Check if karbonite at capacity
            myBot.karbonite_map = [[true]];
            myBot.fuel_map = [[false]];
            expectedErrorLog = JSON.stringify("pilgrim " + myBot.id + " attempting to mine karbonite when at capacity")

            returnValue = pilgrim.mine(myBot);
            expect(returnValue).to.be.undefined;
            expect(myBot._bc_logs).to.include(expectedErrorLog);

            //Check if fuel at capacity
            myBot.karbonite_map = [[false]];
            myBot.fuel_map = [[true]];
            expectedErrorLog = JSON.stringify("pilgrim " + myBot.id + " attempting to mine fuel when at capacity")

            returnValue = pilgrim.mine(myBot);
            expect(returnValue).to.be.undefined;
            expect(myBot._bc_logs).to.include(expectedErrorLog);

            done();
        });

        it('should be able to find the closest resource', function(done) {
            let returnValue;
            const myBot = new MyRobot();
            myBot.me = {
                unit: 2, //Pilgrim
                x: 0,
                y: 0
            }

            myBot.karbonite_map = [[0,0,0,0,0],
                                   [0,0,0,0,0],
                                   [0,0,0,0,0],
                                   [0,0,0,1,0],
                                   [1,0,1,0,1]];

            returnValue = pilgrim.findClosestResource(myBot.me, myBot.karbonite_map, []);
            expect(returnValue).to.be.have.property('x', 0);
            expect(returnValue).to.be.have.property('y', 4);
            myBot.fuel_map = [[0,0,0,1,0],
                              [0,0,0,0,0],
                              [0,0,1,0,0],
                              [1,0,0,0,0],
                              [0,0,0,0,0]];

            returnValue = pilgrim.findClosestResource(myBot.me, myBot.fuel_map, []);
            expect(returnValue).to.be.have.property('x', 2);
            expect(returnValue).to.be.have.property('y', 2);

            done();
        });

    });

    describe('Method tests', function() {
        describe('findClosestResource() tests', function(done) {
            it('should return closest non-occupied resource', function(done) {
                let returnValue;
                const myBot = new MyRobot();
                myBot.target = {x: 1, y: 1};
                myBot.occupiedResources = [{x: 1, y: 1}, {x: 2, y: 2}];
                const friendlyBot1 = new MyRobot();
                const friendlyBot2 = new MyRobot();
                const karbAlterations = [
                    {x: 1, y: 1, value:true},
                    {x: 2, y: 2, value:true},
                    {x: 3, y: 3, value:true},
                    {x: 4, y: 4, value:true},
                    {x: 2, y: 4, value:true}
                ]

                mockGame.removeAllBots();
                mockGame.createNewRobot(myBot, 0, 0, 0, 2);
                mockGame.createNewRobot(friendlyBot1, 1, 1, 0, 2);
                mockGame.createNewRobot(friendlyBot2, 2, 2, 0, 2);
                mockGame.alterMap("karbonite_map", karbAlterations);
    
                returnValue = pilgrim.findClosestResource(myBot.me, myBot.karbonite_map, myBot.occupiedResources);
                expect(returnValue).to.eql({x: 3, y: 3});
    
                done();
            });
        });

        describe('isDepotOccupied() tests', function(done) {
            it('should change nothing if target unoccupied', function(done) {
                let returnValue;
                const myBot = new MyRobot();
                const startTarget = {x: 1, y: 1}
                const karbAlterations = [
                    {x: 1, y: 1, value:true},
                    {x: 2, y: 2, value:true},
                    {x: 3, y: 3, value:true},
                    {x: 4, y: 4, value:true},
                    {x: 0, y: 4, value:true},
                    {x: 2, y: 4, value:true}
                ];

                mockGame.removeAllBots();
                mockGame.createNewRobot(myBot, 0, 0, 0, 2);
                mockGame.alterMap("karbonite_map", karbAlterations);
    
                returnValue = pilgrim.isDepotOccupied(myBot, startTarget);
                expect(returnValue).to.be.false;
                expect(myBot.occupiedResources).to.eql([]);
    
                done();
            });

            it('should change nothing if target occupied by bot that isnt friendly pilgrim', function(done) {
                let returnValue;
                const myBot = new MyRobot();
                const friendlyBot = new MyRobot();
                const startTarget = {x: 1, y: 1}
                const karbAlterations = [
                    {x: 1, y: 1, value:true},
                    {x: 2, y: 2, value:true},
                    {x: 3, y: 3, value:true},
                    {x: 4, y: 4, value:true},
                    {x: 0, y: 4, value:true},
                    {x: 2, y: 4, value:true}
                ];

                //Same team, non-pilgrim unit on target
                mockGame.removeAllBots();
                mockGame.createNewRobot(myBot, 0, 0, 0, 2);
                mockGame.createNewRobot(friendlyBot, 1, 1, 0, 3);
                mockGame.alterMap("karbonite_map", karbAlterations);
    
                returnValue = pilgrim.isDepotOccupied(myBot, startTarget);
                expect(returnValue).to.be.false;
                expect(myBot.occupiedResources).to.eql([]);

                //Pilgrim of different team on target
                mockGame.removeAllBots();
                mockGame.createNewRobot(myBot, 0, 0, 0, 2);
                mockGame.createNewRobot(friendlyBot, 1, 1, 1, 2);
                mockGame.alterMap("karbonite_map", karbAlterations);
    
                returnValue = pilgrim.isDepotOccupied(myBot, startTarget);
                expect(returnValue).to.be.false;
                expect(myBot.occupiedResources).to.eql([]);
    
                done();
            });

            it('should add target to occupiedResources if target occupied', function(done) {
                let returnValue;
                const myBot = new MyRobot();
                const friendlyBot = new MyRobot();
                const startTarget = {x: 1, y: 1}
                const karbAlterations = [
                    {x: 1, y: 1, value:true},
                    {x: 2, y: 2, value:true},
                    {x: 3, y: 3, value:true},
                    {x: 4, y: 4, value:true},
                    {x: 0, y: 4, value:true},
                    {x: 2, y: 4, value:true}
                ];

                mockGame.removeAllBots();
                mockGame.createNewRobot(myBot, 0, 0, 0, 2);
                mockGame.createNewRobot(friendlyBot, 1, 1, 0, 2);
                mockGame.alterMap("karbonite_map", karbAlterations);
    
                returnValue = pilgrim.isDepotOccupied(myBot, startTarget);
                expect(returnValue).to.be.true;
                expect(myBot.occupiedResources).to.deep.include(startTarget);
    
                done();
            });
        });

        describe('updateResourceTarget() tests', function(done) {
            it('should change nothing if target unoccupied', function(done) {
                let returnValue;
                const myBot = new MyRobot();
                const startTarget = myBot.target = {x: 1, y: 1};
                const karbAlterations = [
                    {x: 1, y: 1, value:true},
                    {x: 2, y: 2, value:true},
                    {x: 3, y: 3, value:true},
                    {x: 4, y: 4, value:true}
                ];
                mockGame.removeAllBots();
                mockGame.createNewRobot(myBot, 0, 0, 0, 2);
                mockGame.alterMap("karbonite_map", karbAlterations);
    
                returnValue = pilgrim.updateResourceTarget(myBot);
                expect(myBot.occupiedResources).to.eql([]);
                expect(myBot.target).to.eql(startTarget);
    
                done();
            });

            it('should update target and occupiedResources until target unoccupied', function(done) {
                let returnValue;
                const myBot = new MyRobot();
                const friendlyBot1 = new MyRobot();
                const friendlyBot2 = new MyRobot();
                myBot.target = {x: 1, y: 1};
                //Add specific karbonite_map depots for test
                const karbAlterations = [
                    {x: 1, y: 1, value: true},
                    {x: 2, y: 2, value: true},
                    {x: 3, y: 3, value: true},
                    {x: 4, y: 4, value: true}
                ];

                //Should work for karbonite
                mockGame.removeAllBots();
                mockGame.alterMap("karbonite_map", karbAlterations);
                mockGame.createNewRobot(myBot, 0, 0, 0, 2);
                mockGame.createNewRobot(friendlyBot1, 1, 1, 0, 2);
                mockGame.createNewRobot(friendlyBot2, 2, 2, 0, 2);
                
    
                returnValue = pilgrim.updateResourceTarget(myBot);
                expect(myBot.occupiedResources).to.deep.include.members([{x: 1, y: 1}, {x: 2, y: 2}]);
                expect(myBot.target).to.eql({x: 3, y: 3});

                //Should work for fuel
                mockGame.initEmptyMaps(10);
                mockGame.removeAllBots();
                mockGame.alterMap("fuel_map", karbAlterations);
                mockGame.createNewRobot(myBot, 0, 0, 0, 2);
                mockGame.createNewRobot(friendlyBot1, 1, 1, 0, 2);
                mockGame.createNewRobot(friendlyBot2, 2, 2, 0, 2);
                
    
                returnValue = pilgrim.updateResourceTarget(myBot);
                expect(myBot.occupiedResources).to.deep.include.members([{x: 1, y: 1}, {x: 2, y: 2}]);
                expect(myBot.target).to.eql({x: 3, y: 3});
    
                done();
            });
        });
    });
});