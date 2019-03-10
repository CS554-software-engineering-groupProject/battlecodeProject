const mocha = require('mocha');
const chai = require('chai');
const mockBC19 = require('../projectUtils/mockGame.js');
const MyRobot = require('../projectUtils/psuteam7botCompiled.js').MyRobot;
const castle = require('../projectUtils/psuteam7botCompiled.js').castle;
const movement = require('../projectUtils/psuteam7botCompiled.js').movement;
const expect = chai.expect;

describe('Castle Helpers Unit Tests', function(){
    let mockGame;
    let myBot;
    beforeEach(function() {
        mockGame = new mockBC19();
        mockGame.initEmptyMaps(10);
    });

    /*describe('', function(done){

    });*/

    describe('findDepotClusters() tests', function() {
        it('should only get one location per cluster', function(done) {
            myBot = new MyRobot();
            const karbAlterations = [
                {x: 5, y: 5, value:true},
                {x: 4, y: 5, value:true},
                {x: 5, y: 4, value:true},
                {x: 6, y: 5, value:true},
                {x: 5, y: 6, value:true}
            ]

            mockGame.alterMap("karbonite_map", karbAlterations);
            mockGame.createNewRobot(myBot, 0, 0, 0, 0);

            output = castle.findDepotClusters(myBot, 0, 1, true);

            expect(output.length).equals(1);

            done();
        });

        it('should only get things before the range limit', function(done) {
            myBot = new MyRobot();
            const testIndex = 0.65;
            const karbAlterations = [
                {x: 0, y: 6, value:true},
                {x: 0, y: 7, value:true},
                {x: 6, y: 0, value:true},
                {x: 7, y: 0, value:true},
                {x: 5, y: 7, value:true},
                {x: 7, y: 5, value:true}
            ]

            //Vertical reflection map
            mockGame.alterMap("map", [{x: 0, y: 9, value:false},{x: 9, y: 9, value:false}]); //Vertical reflection
            mockGame.alterMap("karbonite_map", karbAlterations);
            mockGame.createNewRobot(myBot, 0, 0, 0, 0);

            output = castle.findDepotClusters(myBot, 0, testIndex, true);
            output.forEach(cluster => {
                expect(cluster.x <= testIndex);
            })

            //Horizontal reflection map
            mockGame.initEmptyMaps(10);
            mockGame.alterMap("map", [{x: 9, y: 0, value:false},{x: 9, y: 9, value:false}]); //Horizontal reflection
            mockGame.createNewRobot(myBot, 0, 0, 0, 0);

            output = castle.findDepotClusters(myBot, 0, testIndex, true);
            output.forEach(cluster => {
                expect(cluster.y <= testIndex);
            })

            done();
        });

        it('should not get clusters close to itself or near another team castle', function(done) {
            myBot = new MyRobot();
            const karbAlterations = [
                {x: 0, y: 5, value:true},
                {x: 4, y: 0, value:true},
                {x: 3, y: 4, value:true},
                {x: 9, y: 5, value:true}
            ]

            mockGame.alterMap("karbonite_map", karbAlterations);
            mockGame.createNewRobot(myBot, 0, 0, 0, 0);
            myBot.teamCastles = [{id: myBot.me.id, x: myBot.me.x, y: myBot.me.y}, {id: myBot.me.id-1, x: 0, y: 9}];
            //console.log(myBot);

            output = castle.findDepotClusters(myBot, 0, 1, true);
        
            expect(output.length).equals(1);
            expect(output[0]).to.have.property('x', 3);
            expect(output[0]).to.have.property('y', 4);

            done();
        });

        it('if searching aggressively, should only get items roughly between midpoint and rangeIndex', function(done) {
            myBot = new MyRobot();
            const testIndex = 0.9;
            const karbAlterations = [
                {x: 8, y: 1, value:true},
                {x: 9, y: 1, value:true},
                {x: 1, y: 8, value:true},
                {x: 1, y: 9, value:true},
                {x: 1, y: 1, value:true},
                {x: 1, y: 2, value:true},
                {x: 2, y: 1, value:true},
                {x: 2, y: 2, value:true},
                {x: 6, y: 6, value:true}
            ]

            //Vertical reflection map
            mockGame.alterMap("karbonite_map", karbAlterations);
            mockGame.alterMap("map", [{x: 0, y: 9, value:false},{x: 9, y: 9, value:false}]); //Vertical reflection
            mockGame.createNewRobot(myBot, 0, 0, 0, 0);

            output = castle.findDepotClusters(myBot, 0, testIndex, true);
            expect(output.length).equals(1);
            expect(output[0]).to.have.property('x', 8);
            expect(output[0]).to.have.property('y', 1);

            //Horizontal reflection map
            mockGame.initEmptyMaps(10);
            mockGame.alterMap("karbonite_map", karbAlterations);
            mockGame.alterMap("map", [{x: 9, y: 0, value:false},{x: 9, y: 9, value:false}]); //Horizontal reflection
            mockGame.createNewRobot(myBot, 0, 0, 0, 0);

            output = castle.findDepotClusters(myBot, 0, testIndex, true);
            expect(output.length).equals(1);
            expect(output[0]).to.have.property('x', 1);
            expect(output[0]).to.have.property('y', 8);

            done();
        });

        it('if not searching aggressively, should only get items roughly on your side of map', function(done) {
            myBot = new MyRobot();
            const testIndex = 0.9;
            const karbAlterations = [
                {x: 8, y: 1, value:true},
                {x: 9, y: 1, value:true},
                {x: 1, y: 8, value:true},
                {x: 1, y: 9, value:true},
                {x: 1, y: 1, value:true},
                {x: 1, y: 2, value:true},
                {x: 2, y: 1, value:true},
                {x: 2, y: 2, value:true},
                {x: 6, y: 6, value:true}
            ]

            //Vertical reflection map
            mockGame.alterMap("karbonite_map", karbAlterations);
            mockGame.alterMap("map", [{x: 0, y: 9, value:false},{x: 9, y: 9, value:false}]); //Vertical reflection
            mockGame.createNewRobot(myBot, 0, 0, 0, 0);

            output = castle.findDepotClusters(myBot, 0, testIndex, false);
            expect(output.length).equals(2);
            expect(output[0]).to.have.property('x', 1);
            expect(output[0]).to.have.property('y', 1);

            //Horizontal reflection map
            mockGame.initEmptyMaps(10);
            mockGame.alterMap("karbonite_map", karbAlterations);
            mockGame.alterMap("map", [{x: 9, y: 0, value:false},{x: 9, y: 9, value:false}]); //Horizontal reflection
            mockGame.createNewRobot(myBot, 0, 0, 0, 0);

            output = castle.findDepotClusters(myBot, 0, testIndex, false);
            expect(output.length).equals(2);
            expect(output[0]).to.have.property('x', 1);
            expect(output[0]).to.have.property('y', 1);

            done();
        });       
    })

    describe('processLocalDepots() tests', function() {
        it('should get number of depots within +/- 3 units of location', function(done) {
            myBot = new MyRobot();
            const karbAlterations = [
                {x: 3, y: 0, value:true},
                {x: 0, y: 3, value:true},
                {x: 3, y: 3, value:true}
            ]
            const fuelAlterations = [
                {x: 4, y: 4, value:true},
                {x: 0, y: 0, value:true}
            ]

            mockGame.alterMap("karbonite_map", karbAlterations);
            mockGame.alterMap("fuel_map", fuelAlterations);
            mockGame.createNewRobot(myBot, 0, 0, 0, 0);

            output = castle.processLocalDepots(myBot, myBot.me);

            expect(output).eql({x: myBot.me.x, y: myBot.me.y, count: 4, dist: 36});

            done();
        });
    });

    describe('assessLocalPilgrims() tests', function() {
        it('should only count local pilgrims when adding to queue', function(done) {
            myBot = new MyRobot();
            myBot.macro.localPilgrims = 0;
            const karbAlterations = [
                {x: 3, y: 0, value:true},
                {x: 0, y: 3, value:true},
                {x: 2, y: 2, value:true}
            ]
            const fuelAlterations = [
                {x: 1, y: 0, value:true},
                {x: 0, y: 1, value:true},
                {x: 4, y: 4, value:true}
            ]

            mockGame.alterMap("karbonite_map", karbAlterations);
            mockGame.alterMap("fuel_map", fuelAlterations);
            mockGame.createNewRobot(myBot, 0, 0, 0, 0);

            //Things that shouldn't be counted
            mockGame.createNewRobot(new MyRobot(), 1, 0, 0, 3);
            mockGame.createNewRobot(new MyRobot(), 4, 4, 0, 2);
            mockGame.createNewRobot(new MyRobot(), 3, 0, 1, 2);

            output = castle.assessLocalPilgrims(myBot);

            expect(myBot.castleBuildQueue).eql([]);

            done();
        });

        it('should do nothing if local pilgrims greater or equal to macro value', function(done) {
            myBot = new MyRobot();
            myBot.macro.localPilgrims = 2;
            const karbAlterations = [
                {x: 3, y: 0, value:true},
                {x: 0, y: 3, value:true},
                {x: 2, y: 2, value:true}
            ]
            const fuelAlterations = [
                {x: 1, y: 0, value:true},
                {x: 0, y: 1, value:true},
                {x: 4, y: 4, value:true}
            ]

            mockGame.alterMap("karbonite_map", karbAlterations);
            mockGame.alterMap("fuel_map", fuelAlterations);
            mockGame.createNewRobot(myBot, 0, 0, 0, 0);

            mockGame.createNewRobot(new MyRobot(), 1, 2, 0, 2);
            mockGame.createNewRobot(new MyRobot(), 2, 2, 0, 2);

            output = castle.assessLocalPilgrims(myBot);

            expect(myBot.castleBuildQueue).eql([]);

            done();
        });

        it('should do nothing if more unoccupied depots than local pilgrims', function(done) {
            myBot = new MyRobot();
            myBot.macro.localPilgrims = 5;
            const karbAlterations = [
                {x: 3, y: 0, value:true},
                {x: 0, y: 3, value:true},
                {x: 2, y: 2, value:true}
            ]
            const fuelAlterations = [
                {x: 1, y: 0, value:true},
                {x: 0, y: 1, value:true},
                {x: 4, y: 4, value:true}
            ]

            mockGame.alterMap("karbonite_map", karbAlterations);
            mockGame.alterMap("fuel_map", fuelAlterations);
            mockGame.createNewRobot(myBot, 0, 0, 0, 0);

            //5 local depots, 3 local pilgrims on depot, 1 not on depot
            mockGame.createNewRobot(new MyRobot(), 1, 0, 0, 2);
            mockGame.createNewRobot(new MyRobot(), 2, 2, 0, 2);
            mockGame.createNewRobot(new MyRobot(), 3, 0, 0, 2);
            mockGame.createNewRobot(new MyRobot(), 3, 2, 0, 2);

            output = castle.assessLocalPilgrims(myBot);

            expect(myBot.castleBuildQueue).eql([]);

            done();
        });

        it('should not add pilgrims for depots already in castleBuildQueue', function(done) {
            myBot = new MyRobot();
            myBot.macro.localPilgrims = 5;
            const karbAlterations = [
                {x: 3, y: 0, value:true},
                {x: 0, y: 3, value:true},
                {x: 2, y: 2, value:true}
            ]
            const fuelAlterations = [
                {x: 1, y: 0, value:true},
                {x: 0, y: 1, value:true},
                {x: 4, y: 4, value:true}
            ]

            mockGame.alterMap("karbonite_map", karbAlterations);
            mockGame.alterMap("fuel_map", fuelAlterations);
            mockGame.createNewRobot(myBot, 0, 0, 0, 0);

            //5 local depots, 4 local pilgrims on depot, last depot in queue
            mockGame.createNewRobot(new MyRobot(), 1, 0, 0, 2);
            mockGame.createNewRobot(new MyRobot(), 2, 2, 0, 2);
            mockGame.createNewRobot(new MyRobot(), 3, 0, 0, 2);
            mockGame.createNewRobot(new MyRobot(), 0, 1, 0, 2);
            myBot.castleBuildQueue = [{unit: "PILGRIM", x: 0, y: 3}];

            output = castle.assessLocalPilgrims(myBot);

            expect(myBot.castleBuildQueue).to.deep.include.members([{unit: "PILGRIM", x: 0, y: 3}]);

            done();
        });

        it('should add pilgrims for unoccupied depots not in castleBuildQueue', function(done) {
            myBot = new MyRobot();
            myBot.macro.localPilgrims = 5;
            const karbAlterations = [
                {x: 3, y: 0, value:true},
                {x: 0, y: 3, value:true},
                {x: 2, y: 2, value:true}
            ]
            const fuelAlterations = [
                {x: 1, y: 0, value:true},
                {x: 0, y: 1, value:true},
                {x: 4, y: 4, value:true}
            ]

            mockGame.alterMap("karbonite_map", karbAlterations);
            mockGame.alterMap("fuel_map", fuelAlterations);
            mockGame.createNewRobot(myBot, 0, 0, 0, 0);

            //5 local depots, 4 local pilgrims on depot, last depot not in queue
            mockGame.createNewRobot(new MyRobot(), 1, 0, 0, 2);
            mockGame.createNewRobot(new MyRobot(), 2, 2, 0, 2);
            mockGame.createNewRobot(new MyRobot(), 3, 0, 0, 2);
            mockGame.createNewRobot(new MyRobot(), 0, 1, 0, 2);

            output = castle.assessLocalPilgrims(myBot);

            expect(myBot.castleBuildQueue).to.deep.include.members([{unit: "PILGRIM", x: 0, y: 3}]);

            done();
        });
    });

});