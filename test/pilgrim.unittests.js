const mocha = require('mocha');
const chai = require('chai');
const mockBC19 = require('../projectUtils/mockGame.js');
const SPECS = require('../projectUtils/psuteam7botCompiled.js').SPECS;
const MyRobot = require('../projectUtils/psuteam7botCompiled.js').MyRobot;
const pilgrim = require('../projectUtils/psuteam7botCompiled.js').pilgrim;
const expect = chai.expect;


describe.only('Pilgrim Unit Tests', function() {
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

        it('UNASSIGNED pilgrims', function(done) {
            myBot.role = "TESTROLE";

            output = pilgrim.doAction(myBot);

            expect(output).to.be.undefined;
            done();
        })

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

    describe.only('takePioneerAction() tests', function() {
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
        beforeEach(function() {
            mockGame = new mockBC19();
            mockGame.initEmptyMaps(10);
        });

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
        describe('findClosestResource()', function(done) {
            beforeEach(function() {
                mockGame = new mockBC19();
                mockGame.initEmptyMaps(10);
            });

            it('should return closest non-occupied resource', function(done) {
                let returnValue;
                const myBot = new MyRobot();
                myBot.target = {x: 1, y: 1};
                const friendlyBot1 = new MyRobot();
                const friendlyBot2 = new MyRobot();
                myBot.me = {
                    id: 10,
                    team: 0,
                    unit: 2, //Pilgrim
                    x: 0,
                    y: 0
                }
                friendlyBot1.me = {
                    id: 1,
                    team: 0,
                    unit: 2, //Pilgrim
                    x: 1,
                    y: 1
                }
                friendlyBot2.me = {
                    id: 2,
                    team: 0,
                    unit: 2, //Pilgrim
                    x: 2,
                    y: 2
                }
                myBot._bc_game_state = friendlyBot1._bc_game_state = friendlyBot2._bc_game_state = {
                    visible: [myBot.me, friendlyBot1.me, friendlyBot2.me],
                    shadow: null
                };
                myBot.occupiedResources = [{x: 1, y: 1}, {x: 2, y: 2}];
                myBot._bc_game_state.shadow = friendlyBot1._bc_game_state.shadow = friendlyBot2._bc_game_state.shadow = 
                [[10,0,0,0,0],
                 [0,1,0,0,0],
                 [0,0,2,0,0],
                 [0,0,0,0,0],
                 [0,0,0,0,0]];
                myBot.karbonite_map = [[false,false,false,false,false],
                                       [false,true,false,false,false],
                                       [false,false,true,false,false],
                                       [false,false,false,true,false],
                                       [false,false,true,false,true]];
    
                returnValue = pilgrim.findClosestResource(myBot.me, myBot.karbonite_map, myBot.occupiedResources);
                expect(returnValue).to.eql({x: 3, y: 3});
    
                done();
            });
        });

        describe('isDepotOccupied()', function(done) {
            beforeEach(function() {
                mockGame = new mockBC19();
                mockGame.initEmptyMaps(10);
            });

            it('should change nothing if target unoccupied', function(done) {
                let returnValue;
                const myBot = new MyRobot();
                myBot._bc_game_state = {shadow: null};
                myBot.me = {
                    id: 1,
                    unit: 2, //Pilgrim
                    x: 0,
                    y: 0
                }
                const startTarget = {x: 1, y: 1};
                myBot._bc_game_state.shadow = 
                [[1,0,0,0,0],
                 [0,0,0,0,0],
                 [0,0,0,0,0],
                 [0,0,0,0,0],
                 [0,0,0,0,0]];
                myBot.karbonite_map = [[0,0,0,0,0],
                                       [0,1,0,0,0],
                                       [0,0,1,0,0],
                                       [0,0,0,1,0],
                                       [1,0,1,0,1]];
    
                returnValue = pilgrim.isDepotOccupied(myBot, startTarget);
                expect(returnValue).to.be.false;
                expect(myBot.occupiedResources).to.eql([]);
    
                done();
            });

            it('should add target to occupiedResources if target occupied', function(done) {
                let returnValue;
                const myBot = new MyRobot();
                const friendlyBot = new MyRobot();
                myBot.me = {
                    id: 1,
                    team: 0,
                    unit: 2, //Pilgrim
                    x: 0,
                    y: 0
                }
                friendlyBot.me = {
                    id: 2,
                    team: 0,
                    unit: 2, //Pilgrim
                    x: 1,
                    y: 1
                }
                myBot._bc_game_state = friendlyBot._bc_game_state = {
                    visible: [myBot.me, friendlyBot.me],
                    shadow: null
                };
                const startTarget = {x: 1, y: 1};
                myBot._bc_game_state.shadow = friendlyBot._bc_game_state.shadow = 
                [[1,0,0,0,0],
                 [0,2,0,0,0],
                 [0,0,0,0,0],
                 [0,0,0,0,0],
                 [0,0,0,0,0]];
                myBot.karbonite_map = [[0,0,0,0,0],
                                       [0,1,0,0,0],
                                       [0,0,1,0,0],
                                       [0,0,0,1,0],
                                       [1,0,1,0,1]];
    
                returnValue = pilgrim.isDepotOccupied(myBot, startTarget);
                expect(returnValue).to.be.true;
                expect(myBot.occupiedResources).to.deep.include(startTarget);
    
                done();
            });
        });

        describe('updateResourceTarget()', function(done) {
            beforeEach(function() {
                mockGame = new mockBC19();
                mockGame.initEmptyMaps(10);
            });

            it('should change nothing if target unoccupied', function(done) {
                let returnValue;
                const myBot = new MyRobot();
                myBot._bc_game_state = {shadow: null};
                const startTarget = myBot.target = {x: 1, y: 1};
                myBot.me = {
                    id: 1,
                    unit: 2, //Pilgrim
                    x: 0,
                    y: 0
                }
                myBot._bc_game_state.shadow = 
                [[1,0,0,0,0],
                 [0,0,0,0,0],
                 [0,0,0,0,0],
                 [0,0,0,0,0],
                 [0,0,0,0,0]];
                myBot.karbonite_map = [[0,0,0,0,0],
                                       [0,1,0,0,0],
                                       [0,0,1,0,0],
                                       [0,0,0,1,0],
                                       [0,0,0,0,1]];
    
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

                mockGame.alterMap("karbonite_map", karbAlterations);
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