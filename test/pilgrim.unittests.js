const mocha = require('mocha');
const chai = require('chai');
const MyRobot = require('../projectUtils/psuteam7botCompiled.js').MyRobot;
const pilgrim = require('../projectUtils/psuteam7botCompiled.js').pilgrim;
const expect = chai.expect;


describe('Pilgrim Unit Tests', function() {
    describe('Role objectives tests', function(done) {
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

            returnValue = pilgrim.findClosestResource(myBot.me, myBot.karbonite_map);
            expect(returnValue).to.be.have.property('x', 0);
            expect(returnValue).to.be.have.property('y', 4);
            myBot.fuel_map = [[0,0,0,1,0],
                              [0,0,0,0,0],
                              [0,0,1,0,0],
                              [1,0,0,0,0],
                              [0,0,0,0,0]];

            returnValue = pilgrim.findClosestResource(myBot.me, myBot.fuel_map);
            expect(returnValue).to.be.have.property('x', 2);
            expect(returnValue).to.be.have.property('y', 2);

            done();
        });

    });
});