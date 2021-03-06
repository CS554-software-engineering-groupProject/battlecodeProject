const mocha = require('mocha');
const chai = require('chai');
const mockBC19 = require('../projectUtils/mockGame.js');
const MyRobot = require('../projectUtils/psuteam7botCompiled.js').MyRobot;
const movement = require('../projectUtils/psuteam7botCompiled.js').movement;
const expect = chai.expect;


describe('Movement Helpers Unit Tests', function() {
    let mockGame;
    let myBot;
    let output;
    beforeEach(function() {
        mockGame = new mockBC19();
        mockGame.initEmptyMaps(6);
    });

    describe('positionsAreEqual Returns Values Correctly', function(done) {
        it('positionsAreEqual Returns true Given Two Objects With The Same x And y Values', function(done) {
            const A = {x: 1, y: 1};
            const B = {x: 1, y: 1};
            
            expect(movement.positionsAreEqual(A,B)).equals(true);
            expect(movement.positionsAreEqual(B,A)).equals(true);
            done();
        });
        it('positionsAreEqual Returns false Given Two Objects With Different x Values', function(done) {
            const A = {x: 1, y: 1};
            const B = {x: 0, y: 1};
            
            expect(movement.positionsAreEqual(A,B)).equals(false);
            expect(movement.positionsAreEqual(B,A)).equals(false);
            done();
        });
        it('positionsAreEqual Returns false Given Two Objects With Different y Values', function(done) {
            const A = {x: 1, y: 1};
            const B = {x: 1, y: 0};
            
            expect(movement.positionsAreEqual(A,B)).equals(false);
            expect(movement.positionsAreEqual(B,A)).equals(false);
            done();
        });
        it('positionsAreEqual Returns false Given Two Objects With Different x and y Values', function(done) {
            const A = {x: 1, y: 1};
            const B = {x: 0, y: 1};
            
            expect(movement.positionsAreEqual(A,B)).to.eql(false);
            expect(movement.positionsAreEqual(B,A)).to.eql(false);
            done();
        });
    });
    
    describe('getRelativePosition Returns Values Correctly', function(done) {
        it('getRelativePosition Returns Valid Values Given A And B Objects With Valid x And y Values', function(done) {
            const A = {x: 5, y: 7};
            const B = {x: 2, y: 4};
            
            expect(movement.getRelativePosition(A,B)).to.eql({x: -3, y: -3});
            expect(movement.getRelativePosition(B,A)).to.eql({x: 3, y: 3});
            expect(movement.getRelativePosition(A,A)).to.eql({x: 0, y: 0});
            done();
        });
    });

    describe('getRelativeDirection Returns Values Correctly', function(done) {
        it('getRelativeDirection Returns Valid Values Given Valid A and B Objects', function(done) {
            const A = {x: 2, y: 3};
            const B = {x: 4, y: 6};
            
            expect(movement.getRelativeDirection(A,B)).to.eql({x: 1, y: 1});
            expect(movement.getRelativeDirection(B,A)).to.eql({x: -1, y: -1});
            expect(movement.getRelativeDirection(A,A)).to.eql({x: 0, y: 0});
            done();
        });
    });

    describe('getDirectionIndex Returns Values Correctly', function(done) {
        it('getDirectionIndex Returns Valid Values Given Valid Direction Object', function(done) {
            const A = {x: 0, y: 1};
            const B = {x: -1, y: -1};
            const C = {x: 1, y: 0};
            
            expect(movement.getDirectionIndex(A)).equals(0);
            expect(movement.getDirectionIndex(B)).equals(5);
            expect(movement.getDirectionIndex(C)).equals(2);
            done();
        });
        it('getDirectionIndex Returns -1 Given Valid/ Invalid Direction Object With x Or y Not An Element Of {-1, 1}', function(done) {
            const A = {x: -3, y: 1};
            const B = {x: -1, y: 2};
            const C = {x: 0, y: 0};
            const D = {x: 4};
            const E = {y: -4};
            
            expect(movement.getDirectionIndex(A)).equals(-1);
            expect(movement.getDirectionIndex(B)).equals(-1);
            expect(movement.getDirectionIndex(C)).equals(-2);
            expect(movement.getDirectionIndex(D)).equals(-1);
            expect(movement.getDirectionIndex(E)).equals(-1);
            done();
        });
    });

    describe('rotateDirection Returns Values Correctly', function(done) {
        it('rotateDirection Returns Valid Value Given Valid Direction Object and N value', function(done) {
            const A = {x: 0, y: 1};
            const B = {x: -1, y: -1};
            const C = {x: 1, y: 0};
            
            expect(movement.rotateDirection(A, 3)).to.eql({x: 1, y: -1});
            expect(movement.rotateDirection(B, -5)).to.eql({x: 0, y: 1});
            expect(movement.rotateDirection(C, 0)).to.eql(C);
            done();
        });
    });

    describe('getDirectionsBetween Returns Values Correctly', function(done) {
        it('rotateDirection returns all values if sum of input geq  7', function(done) {
            expect(movement.getDirectionsBetween(0, 7, 0)).to.eql(movement.directions);
            expect(movement.getDirectionsBetween(0, 0, 7)).to.eql(movement.directions);
            expect(movement.getDirectionsBetween(0, 3, 4)).to.eql(movement.directions);
            expect(movement.getDirectionsBetween(0, -1, 8)).to.eql(movement.directions);
            done();
        });

        it('rotateDirection returns single index if left and right sum to zero', function(done) {
            expect(movement.getDirectionsBetween(0, 0, 0)).to.deep.include(movement.directions[0]);
            expect(movement.getDirectionsBetween(1, -1, 1)).to.deep.include(movement.directions[2]);
            expect(movement.getDirectionsBetween(2, 2, -2)).to.deep.include(movement.directions[0]);
            done();
        });

        it('rotateDirection returns empty array if left and right sum is negative', function(done) {
            expect(movement.getDirectionsBetween(0, -1, 0)).to.eql([]);
            expect(movement.getDirectionsBetween(1, 0, -1)).to.eql([]);
            expect(movement.getDirectionsBetween(2, -2, -3)).to.eql([]);
            done();
        });

        it('rotateDirection returns all values between left and right properly', function(done) {
            expect(movement.getDirectionsBetween(0, 1, 0)).to.have.members([movement.directions[0], movement.directions[7]])
            expect(movement.getDirectionsBetween(0, 0, 1)).to.have.members(movement.directions.slice(0, 2));
            expect(movement.getDirectionsBetween(0, 6, 0)).to.have.members([movement.directions[0], ...movement.directions.slice(2, 8)]);
            expect(movement.getDirectionsBetween(0, 0, 6)).to.have.members(movement.directions.slice(0, 7));
            expect(movement.getDirectionsBetween(3, 0, 1)).to.have.members(movement.directions.slice(3, 5));
            expect(movement.getDirectionsBetween(5, 0, 1)).to.have.members(movement.directions.slice(5, 7));
            done();
        });


    });

    describe('getDistanceXY Returns Values Correctly', function(done) {
        it('getDistanceXY Returns Valid Value Given Valid A And B Objects With Valid x And y Values', function(done) {
            const A = {x: 5, y: 7};
            const B = {x: 2, y: 4};
            
            expect(movement.getDistanceXY(A,B)).to.eql({x: 3, y: 3});
            expect(movement.getDistanceXY(B,A)).to.eql({x: 3, y: 3});
            expect(movement.getDistanceXY(A,A)).to.eql({x: 0, y: 0});
            done();
        });
    });

    describe('getDistance Returns Values Correctly', function(done) {
        it('getDistance Returns Valid Value Given Valid A And B Objects With Valid x And y Values', function(done) {
            const A = {x: 5, y: 7};
            const B = {x: 2, y: 4};
            const C = {x: 5, y: 8};
            
            expect(movement.getDistance(A,B)).equals(18);
            expect(movement.getDistance(B,A)).equals(18);
            expect(movement.getDistance(A,A)).equals(0);
            done();
        });
    });

    describe('checkQuadrant Returns Values Correctly', function(done) {
        it('checkQuadrant Returns Valid Value Given Valid location And fullMap Objects With Valid Values', function(done) {
            let A = {x: 0, y: 1};
            let B = {x: 5, y: 2};
            let C = {x: 2, y: 5};
            let D = {x: 4, y: 4};

            expect(movement.checkQuadrant(A, mockGame.game.map)).equals(1);
            expect(movement.checkQuadrant(B, mockGame.game.map)).equals(2);
            expect(movement.checkQuadrant(C, mockGame.game.map)).equals(3);
            expect(movement.checkQuadrant(D, mockGame.game.map)).equals(4);
            done();
        });
    });

    describe('getAttackerPatrolRoute Returns Values Correctly', function(done) {
        it('getAttackerPatrolRoute Returns Valid Value Given Valid Castle location And fullMap Objects With Valid Values', function(done) {
            const A = {x: 0, y: 1};
            const B = {x: 5, y: 2};
            const C = {x: 2, y: 5};
            const D = {x: 4, y: 4};
            const vertMapAlts = [
                {x: 1, y: 2, value: false},
                {x: 4, y: 2, value: false}
            ];
            const horiMapAlts = [
                {x: 3, y: 2, value: false},
                {x: 3, y: 4, value: false}
            ];   

            mockGame.alterMap("map", horiMapAlts);
            expect(movement.getAttackerPatrolRoute(A, mockGame.game.map)).to.eql([{x: 0,y: 4}, {x: 5, y: 4}]);
            expect(movement.getAttackerPatrolRoute(B, mockGame.game.map)).to.eql([{x: 5, y: 3}, {x: 0, y: 3}]);
            expect(movement.getAttackerPatrolRoute(C, mockGame.game.map)).to.eql([{x: 2, y: 0}, {x: 3, y: 0}]);
            expect(movement.getAttackerPatrolRoute(D, mockGame.game.map)).to.eql([{x: 4, y: 1}, {x: 1, y: 1}]);

            mockGame.initEmptyMaps(6);
            mockGame.alterMap("map", vertMapAlts);
            expect(movement.getAttackerPatrolRoute(A, mockGame.game.map)).to.eql([{x: 5,y: 1}, {x: 5, y: 4}]);
            expect(movement.getAttackerPatrolRoute(B, mockGame.game.map)).to.eql([{x: 0, y: 2}, {x: 0, y: 3}]);
            expect(movement.getAttackerPatrolRoute(C, mockGame.game.map)).to.eql([{x: 3, y: 5}, {x: 3, y: 0}]);
            expect(movement.getAttackerPatrolRoute(D, mockGame.game.map)).to.eql([{x: 1, y: 4}, {x: 1, y: 1}]);

            done();
        });
    });

    describe('isPassable Returns Values Correctly', function(done) {                  
        /*
        //Keeping as visual since hard to see with alterations array
        const fullMap =   
        [[true,false,false,false,false,false],
        [true,false,true,true,false,false],
        [true,true,true,true,true,true],
        [false,true,true,true,false,false],
        [false,false,true,true,false,false],
        [false,false,false,false,false,false]];
        */   
        beforeEach(function() {
            const mapAlterations = [
                {x: 1, y: 0, value: false},
                {x: 2, y: 0, value: false},
                {x: 3, y: 0, value: false},
                {x: 4, y: 0, value: false},
                {x: 5, y: 0, value: false},
                {x: 1, y: 1, value: false},
                {x: 4, y: 1, value: false},
                {x: 5, y: 1, value: false},
                {x: 0, y: 3, value: false},
                {x: 4, y: 3, value: false},
                {x: 5, y: 3, value: false},
                {x: 0, y: 4, value: false},
                {x: 1, y: 4, value: false},
                {x: 4, y: 4, value: false},
                {x: 5, y: 4, value: false},
                {x: 0, y: 5, value: false},
                {x: 1, y: 5, value: false},
                {x: 2, y: 5, value: false},
                {x: 3, y: 5, value: false},
                {x: 4, y: 5, value: false},
                {x: 5, y: 5, value: false},
    
            ]                   
            myBot = new MyRobot();
            mockGame = new mockBC19();
            mockGame.initEmptyMaps(6);
            mockGame.alterMap("map", mapAlterations);
            mockGame.createNewRobot(new MyRobot(), 5, 2, 0, 2);
            mockGame.createNewRobot(myBot, 1, 0, 0, 2);
        });

        it('isPassable Returns true Given Valid location, fullMap, and robotMap Objects With Valid Values, And Location Is Passable On The Map', function(done) {
            const A = {x: 0, y: 1};
            
            expect(movement.isPassable(A, mockGame.game.map, myBot.getVisibleRobotMap())).equals(true);
            done();
        });
        it('isPassable Returns false Given Valid location, fullMap, and robotMap Objects With Valid Values, And Location Is impassable On The Map', function(done) {
            const B = {x: 5, y: 2};
            const C = {x: 2, y: 5};
                        
            expect(movement.isPassable(B, mockGame.game.map, myBot.getVisibleRobotMap())).equals(false);
            expect(movement.isPassable(C, mockGame.game.map, myBot.getVisibleRobotMap())).equals(false);
            done();
        });

        it('isPassable Returns true Given Valid location And fullMap Objects With location Values Outside Map', function(done) {
            const D = {x: 4, y: 7};
            const E = {x: -1, y: 0};
            const F = {x: 0, y: -1};
            const G = {x: mockGame.game.map.length, y: 0};
            const H = {x: 0, y: mockGame.game.map.length};

            expect(movement.isPassable(D, mockGame.game.map, myBot.getVisibleRobotMap())).equals(false);
            expect(movement.isPassable(E, mockGame.game.map, myBot.getVisibleRobotMap())).equals(false);
            expect(movement.isPassable(F, mockGame.game.map, myBot.getVisibleRobotMap())).equals(false);
            expect(movement.isPassable(G, mockGame.game.map, myBot.getVisibleRobotMap())).equals(false);
            expect(movement.isPassable(H, mockGame.game.map, myBot.getVisibleRobotMap())).equals(false);
            done();
        });
    });


    describe.skip('dumberMoveTowards Returns Values Correctly', function(done) {     
        /*
        //Keeping as visual since hard to see with alterations array
        const fullMap =   
        [[true,false,false,false,false,false],
        [true,false,true,true,false,false],
        [true,true,true,true,true,true],
        [false,true,true,true,false,false],
        [false,false,true,true,false,false],
        [false,false,false,false,false,false]];
        */                  


        const robotMap = 
        [[0,0,0,0,0,0],
        [0,0,0,0,0,0],
        [0,0,404,0,0,3005],
        [0,0,0,0,0,0],
        [0,0,0,0,0,0],
        [0,0,0,0,0,0]];

        beforeEach(function() {
            const mapAlterations = [
                {x: 1, y: 0, value: false},
                {x: 2, y: 0, value: false},
                {x: 3, y: 0, value: false},
                {x: 4, y: 0, value: false},
                {x: 5, y: 0, value: false},
                {x: 1, y: 1, value: false},
                {x: 4, y: 1, value: false},
                {x: 5, y: 1, value: false},
                {x: 0, y: 3, value: false},
                {x: 4, y: 3, value: false},
                {x: 5, y: 3, value: false},
                {x: 0, y: 4, value: false},
                {x: 1, y: 4, value: false},
                {x: 4, y: 4, value: false},
                {x: 5, y: 4, value: false},
                {x: 0, y: 5, value: false},
                {x: 1, y: 5, value: false},
                {x: 2, y: 5, value: false},
                {x: 3, y: 5, value: false},
                {x: 4, y: 5, value: false},
                {x: 5, y: 5, value: false},
    
            ]                   
            myBot = new MyRobot();
            mockGame = new mockBC19();
            mockGame.initEmptyMaps(6);
            mockGame.alterMap("map", mapAlterations);
            mockGame.createNewRobot(new MyRobot(), 5, 2, 0, 2);
            mockGame.createNewRobot(myBot, 1, 0, 0, 2);
        });

        it('dumberMoveTowards move to destination', function(done) {
            const A = {x: 2, y: 4};

            const destA = {x: 2, y: 3};

            const previous = {x: 1, y: 2};
            
            expect(movement.dumberMoveTowards(A, fullMap, robotMap, destA, previous)).to.eql(destA);
            done();
        });

        it('dumberMoveTowards gets best location to go around obstacle, and not previous location', function(done) {
            const B = {x: 0, y: 0};
            const C = {x: 3, y: 4};
            const D = {x: 1, y: 2};

            const destBC = {x: 2, y: 5};
            const destD = {x: 3, y: 2};

            const previousB = B;
            const previousC = {x: 2, y: 4}
            const previousD = {x: 2, y: 3}

            expect(movement.dumberMoveTowards(B, fullMap, robotMap, destBC, previousB)).to.eql({x: 0, y: 1});
            expect(movement.dumberMoveTowards(C, fullMap, robotMap, destBC, previousC)).to.eql({x: 2,y: 3});
            expect(movement.dumberMoveTowards(D, fullMap, robotMap, destD, previousD)).to.eql({x: 2,y: 1});
            done();
        });
    });

    describe('isHorizontalReflection Returns Values Correctly', function(done) {
        it('isHorizontalReflection Returns Valid Values Given a horizontal or vertical reflection fullMap', function(done) {
            const vertMapAlts = [
                {x: 1, y: 2, value: false},
                {x: 4, y: 2, value: false}
            ];
            const horiMapAlts = [
                {x: 3, y: 2, value: false},
                {x: 3, y: 4, value: false}
            ];   

            mockGame.alterMap("map", vertMapAlts);  
            expect(movement.isHorizontalReflection(mockGame.game.map)).equals(false);

            mockGame.initEmptyMaps(6);
            mockGame.alterMap("map", horiMapAlts);  
            expect(movement.isHorizontalReflection(mockGame.game.map)).equals(true);
            
            done();
        });
    });

    describe('getMirrorCastleLocations Returns Values Correctly', function(done) {
        it('getMirrorCastleLocations Returns Valid Values Given a horizontal or vertical reflection fullMap and a castle location', function(done) {
            const castleLocation = {x: 1,y: 1};
            const vertMapAlts = [
                {x: 1, y: 2, value: false},
                {x: 4, y: 2, value: false}
            ];
            const horiMapAlts = [
                {x: 3, y: 2, value: false},
                {x: 3, y: 4, value: false}
            ];   

            mockGame.alterMap("map", vertMapAlts);  
            expect(movement.getMirrorCastle(castleLocation, mockGame.game.map)).to.eql({x: 4, y: 1});

            mockGame.initEmptyMaps(6);
            mockGame.alterMap("map", horiMapAlts);  
            expect(movement.getMirrorCastle(castleLocation, mockGame.game.map)).to.eql({x: 1,y: 4});

            done();
        });
    });

    describe('getEnemyCastleLocations Returns Values Correctly', function(done) {
        it('getEnemyCastleLocations Returns Mirrored Castle Locations Given a horizontal or vertical reflection fullMap and an array of castle location', function(done) {
            const castleLocation = [{x: 1,y: 1}, {x: 4, y: 4}, {x: 3, y: 2}];

            const vertMapAlts = [
                {x: 1, y: 2, value: false},
                {x: 4, y: 2, value: false}
            ];
            const horiMapAlts = [
                {x: 3, y: 2, value: false},
                {x: 3, y: 4, value: false}
            ];   

            mockGame.alterMap("map", vertMapAlts);  
            expect(movement.getEnemyCastleLocations(castleLocation, mockGame.game.map)).to.eql([{x: 4,y: 1}, {x: 1, y: 4}, {x: 2, y: 2}]);

            mockGame.initEmptyMaps(6);
            mockGame.alterMap("map", horiMapAlts);  
            expect(movement.getEnemyCastleLocations(castleLocation, mockGame.game.map)).to.eql([{x: 1,y: 4}, {x: 4, y: 1}, {x: 3, y: 3}]);

            done();
        });
    });

    describe('A* Pathfinding Tests', function() {
        describe('initAStarMaps() tests', function() {
            it('should set defaults for infoMap except for at starting location', function(done) {
                let returnValue;
                const closedMap = [];
                const infoMap = [];
                const fullMap =   
                [[true,false,false,false,false,false],
                [true,false,false,false,false,false],
                [true,false,false,false,true,true],
                [true,false,false,false,false,false],
                [true,false,false,true,false,false],
                [true,true,true,true,true,true]];
                const expectedMaxDist = 2*Math.pow(fullMap.length, 2);
                const expectedInfoCell = {
                    f: expectedMaxDist,
                    g: expectedMaxDist,
                    h: expectedMaxDist,
                    parent: {
                        x: -1,
                        y: -1
                    }
                }
                const myBot = new MyRobot();
                myBot.map = fullMap;
                myBot.target = {x: 5, y: 5};
                myBot.me = {
                    id: 1,
                    unit: 2,
                    x: 0, 
                    y: 0
                }



                movement.initAStarMaps(myBot, myBot.me, false, closedMap, infoMap);

                expect(infoMap.length).equals(fullMap.length);
                for(let i = 0; i < infoMap.length; i++) {
                    for(let j = 0; j < infoMap.length; j++) {
                        if(i == myBot.me.x && j == myBot.me.y) {
                            expect(infoMap[i][j]).to.not.eql(expectedInfoCell);
                        } else {
                            expect(infoMap[i][j]).to.eql(expectedInfoCell);
                        }
                        
                    }
                }

                done();
            });

            it('should initialize closedMap properly depending on accountForBots value', function(done) {
                let infoMap = [];
                const closedMapJustTerrain = [];
                const closedMapWithBots = [];
                const fullMap =   
                [[true,false,false,false,false,false],
                [true,false,false,false,false,false],
                [true,false,false,false,true,true],
                [true,false,false,false,false,false],
                [true,false,false,true,false,false],
                [true,true,true,true,true,true]];
                const myBot = new MyRobot();
                myBot._bc_game_state = {shadow: null};
                myBot._bc_game_state.shadow =
                [[1,0,0,0,0,0],
                [0,0,0,3,0,0],
                [2,0,0,0,0,0],
                [0,0,0,4,0,0],
                [0,5,0,0,0,0],
                [0,0,0,0,0,10]];
                myBot.map = fullMap;
                myBot.target = {x: 5, y: 5};
                myBot.me = {
                    id: 1,
                    unit: 2,
                    x: 0, 
                    y: 0
                }

                movement.initAStarMaps(myBot, myBot.me, false, closedMapJustTerrain, infoMap);
                expect(closedMapJustTerrain.length).equals(fullMap.length);
                infoMap = [];
                movement.initAStarMaps(myBot, myBot.me, true, closedMapWithBots, infoMap);
                expect(closedMapJustTerrain.length).equals(fullMap.length);

                for(let i = 0; i < infoMap.length; i++) {
                    for(let j = 0; j < infoMap.length; j++) {
                        const mapCell = fullMap[i][j];
                        const botsCell = myBot._bc_game_state.shadow[i][j];
                        expect(infoMap[i][j]).not.equals(mapCell);
                        expect(infoMap[i][j]).not.equals(mapCell && botsCell === 0);     
                    }
                }

                done();
            });
        });

        describe('processAStarCell() tests', function() {  
            it('should only add cells that are reachable, on map, and not on closedMap', function(done) {
                const fullMap =   
                [[true,false,true],
                [true,true,false],
                [false,true,true]]
                const botMap =
                [[1,0,0],
                [2,0,0],
                [0,0,0]];
                const myBot = new MyRobot();
                myBot._bc_game_state = {shadow: null};
                myBot._bc_game_state.shadow = botMap;
                myBot.map = fullMap;
                myBot.target = {x: 2, y: 2};
                myBot.me = {
                    id: 1,
                    unit: 2,
                    x: 0, 
                    y: 0
                }
                const reachable = movement.getMoveablePositions(myBot.me.unit);
                const startLoc = {x: myBot.me.x, y: myBot.me.y}
                const openQueue = [startLoc]
                const infoMap = [];
                const closedMap = []; 
                movement.initAStarMaps(myBot, myBot.me, true, closedMap, infoMap)
                returnValue = movement.processAStarCell(myBot, myBot.target, infoMap, openQueue, closedMap);

                for(let i = 0; i < openQueue.length; i++) {
                    const current = openQueue[i];
                    const reachableMatches = reachable.filter(obj => {
                        return obj.x === current.x && obj.y === current.y;
                    })
                    expect(reachableMatches.length).equals(1);
                    expect(movement.isPassable(current, fullMap, botMap)).to.be.true;
                    expect(closedMap[current.y][current.x]).to.be.false;
                }

                done();
            });     
            
            //TODO: Change because we made tweaks to code
            it.skip('next cells should be inserted in proper order', function(done) {
                let returnValue;
                const fullMap =   
                [[true,false,false,false,false,false],
                [true,true,true,false,false,false],
                [true,false,false,false,true,true],
                [false,false,false,false,false,false],
                [false,false,true,true,false,false],
                [false,false,false,true,true,true]];
                const myBot = new MyRobot();
                myBot.map = fullMap;
                myBot.target = {x: 5, y: 5};
                myBot.me = {
                    id: 1,
                    unit: 2,
                    x: 0, 
                    y: 0
                }
                const startLoc = {x: myBot.me.x, y: myBot.me.y}
                const openQueue = [startLoc]
                const infoMap = [];
                const closedMap = [];

                movement.initAStarMaps(myBot, myBot.me, false, closedMap, infoMap)
                returnValue = movement.processAStarCell(myBot, myBot.target, infoMap, openQueue, closedMap);
                expect(openQueue).to.not.include(startLoc);
                for(let i = 1; i < openQueue.length; i++) {
                    const first = openQueue[i-1];
                    const second = openQueue[i];
                    expect(movement.getDistance(startLoc, first)).to.be.at.least(movement.getDistance(startLoc, second));
                }
                
                done();
            });

            it('closedMap and infoMap should be updated properly', function(done) {
                let returnValue;
                const fullMap =   
                [[true,false,false,false,false,false],
                [true,false,false,false,false,false],
                [true,false,false,false,true,true],
                [true,false,false,false,false,false],
                [true,false,false,true,false,false],
                [true,true,true,true,true,true]];
                const myBot = new MyRobot();
                myBot.map = fullMap;
                myBot.target = {x: 5, y: 5};
                myBot.me = {
                    id: 1,
                    unit: 2,
                    x: 0, 
                    y: 0
                }

                const startLoc = {x: myBot.me.x, y: myBot.me.y}
                const openQueue = [startLoc]
                const infoMap = [];
                const closedMap = [];

                movement.initAStarMaps(myBot, startLoc, false, closedMap, infoMap);
                expect(closedMap[startLoc.y][startLoc.x]).to.be.false;
                returnValue = movement.processAStarCell(myBot, myBot.target, infoMap, openQueue, closedMap);
                //closedMap should be updated to add startLoc as true, indicating that it's been processed
                expect(closedMap[startLoc.y][startLoc.x]).to.be.true;
                for(let i = 0; i < openQueue.length; i++) {
                    const current = openQueue[i];
                    const gNew = movement.getDistance(startLoc, current);
                    const hNew = movement.getDistance(current, myBot.target);
                    const fNew = gNew+hNew;
                    const expectedCell = {
                        f: fNew,
                        g: gNew,
                        h: hNew,
                        parent: startLoc
                    }
                    expect(infoMap[current.y][current.x]).to.eql(expectedCell)
                }

                done();
            });

            it('should return boolean indicating if destination found', function(done) {
                let returnValue;
                const fullMap =   
                [[true,false,false,false,false,false],
                [true,false,false,false,false,false],
                [true,false,false,false,true,true],
                [true,false,false,false,false,false],
                [true,false,false,true,false,false],
                [true,true,true,true,true,true]];
                const myBot = new MyRobot();
                myBot.map = fullMap;
                myBot.target = {x: 5, y: 5};
                myBot.me = {
                    id: 1,
                    unit: 2,
                    x: 0, 
                    y: 0
                }

                const startLoc = {x: myBot.me.x, y: myBot.me.y}
                let openQueue = [startLoc]
                let infoMap = [];
                let closedMap = [];

                movement.initAStarMaps(myBot, startLoc, false, closedMap, infoMap);
                returnValue = movement.processAStarCell(myBot, {x: 0, y: 1}, infoMap, openQueue, closedMap);
                expect(returnValue).to.be.true;

                infoMap = [];
                closedMap = [];
                openQueue = [startLoc]
                movement.initAStarMaps(myBot, startLoc, false, closedMap, infoMap);
                returnValue = movement.processAStarCell(myBot, myBot.target, infoMap, openQueue, closedMap);
                expect(returnValue).to.be.false;

                done();
            });
        });

        describe('aStarPathfinding() tests', function() {
            it('should return false location and destination are identical', function(done) {
                let returnValue;
                const myBot = new MyRobot();
                myBot.target = {x: 0, y: 0};
                myBot.me = {
                    id: 1,
                    unit: 2,
                    x: 0, 
                    y: 0
                }

                returnValue = movement.aStarPathfinding(myBot, myBot.me, myBot.target, false);
                expect(returnValue).to.be.false;
                expect(myBot.path).to.eql([]);
                done();
            });

            
            
            it('should return false if no path possible', function(done) {
                let returnValue;
                const fullMap =   
                [[true,false,false,false,false,false],
                [false,false,false,false,false,false],
                [false,false,false,false,true,true],
                [false,false,false,false,false,false],
                [false,false,true,true,false,false],
                [false,false,false,true,true,true]];
                const myBot = new MyRobot();
                myBot.map = fullMap;
                myBot.target = {x: 5, y: 5};
                myBot.me = {
                    id: 1,
                    unit: 2,
                    x: 0, 
                    y: 0
                }

                returnValue = movement.aStarPathfinding(myBot, myBot.me, myBot.target, false);
                expect(returnValue).to.be.false;
                expect(myBot.path).to.eql([]);
                done();
            });

            it('should have different paths if accounting for bots', function(done) {
                let returnValue;
                let pathJustTerrain;
                let pathWithBots;
                const fullMap =   
                [[true,false,false,false,false,false],
                [true,false,false,false,false,false],
                [true,false,false,false,true,true],
                [true,false,false,false,false,false],
                [true,false,false,true,false,false],
                [true,true,true,true,true,true]];
                const myBot = new MyRobot();
                const anotherBot = new MyRobot();
                myBot._bc_game_state = anotherBot._bc_game_state = {shadow: null};
                myBot._bc_game_state.shadow = anotherBot._bc_game_state.shadow =  
                [[1,0,0,0,0,0],
                [0,0,0,0,0,0],
                [2,0,0,0,0,0],
                [0,0,0,0,0,0],
                [0,0,0,0,0,0],
                [0,0,0,0,0,0]];
                myBot.map = fullMap;
                myBot.target = {x: 5, y: 5};
                myBot.me = {
                    id: 1,
                    unit: 2,
                    x: 0, 
                    y: 0
                }
                anotherBot.me = {
                    id: 2,
                    unit: 2,
                    x: 0, 
                    y: 2
                }

                returnValue = movement.aStarPathfinding(myBot, myBot.me, myBot.target, false);
                expect(returnValue).to.be.true;
                pathJustTerrain = myBot.path.splice(0);
                returnValue = movement.aStarPathfinding(myBot, myBot.me, myBot.target, true);
                expect(returnValue).to.be.true;
                pathWithBots = myBot.path.splice(0);
                expect(pathJustTerrain).to.eql(pathJustTerrain)
                expect(pathJustTerrain).to.not.eql(pathWithBots);

                done();
            });


            it('should find optimal path in minimal moves', function(done) {
                const fullMap =   
                [[true,false,false,false,false,false],
                [true,false,true,true,false,false],
                [true,true,true,true,true,true],
                [false,false,true,true,false,false],
                [false,false,true,true,false,false],
                [false,false,false,true,true,true]];
                const myBot = new MyRobot();
                myBot.map = fullMap;
                myBot.target = {x: 5, y: 5};
                myBot.me = {
                    id: 1,
                    unit: 2,
                    x: 0, 
                    y: 0
                }

                movement.aStarPathfinding(myBot, myBot.me, myBot.target, false);
                done();
            });
        });
    });

    describe('Path Movement Tests', function() {
        let output;
        let myBot = new MyRobot();
        let stubAStarPathfining;
        let spyAdjustPath;
        let targetPath = [
            {x: 5, y: 5}, 
            {x: 4, y: 4},
            {x: 3, y: 3},
            {x: 2, y: 2},
            {x: 1, y: 1}
        ];

        beforeEach(function() {
            mockGame = new mockBC19('../projectUtils/psuteam7botCompiled.js');
            myBot = new MyRobot();
            mockGame.initEmptyMaps(6);
            mockGame.createNewRobot(myBot, 0, 0, 0, 2);
            myBot.target = {x: 5, y: 5};
            //Make deep copy so comparisons to targetPath not always identical
            myBot.path = JSON.parse(JSON.stringify(targetPath)) 
        });

        afterEach(function() {
            //Reset any spies/mocks created so they don't affect subsequent tests
            mockGame.undoSinonMethods();
        })

        describe('moveAlongPath() tests', function() {
            it('should move to next location on path if passible and enough fuel', function(done) {
                //Set fuel to exactly required amount
                myBot.fuel = movement.getDistance(myBot.me, targetPath[4]);
                output = movement.moveAlongPath(myBot);

                expect(myBot.path).to.deep.include.members(targetPath.slice(0, 4));
                expect(myBot.path).to.not.deep.include(targetPath[4]);
                expect(output['action']).equals('move');
                expect(output['dx']).equals(1);
                expect(output['dy']).equals(1);

                done();
            });

            it('should wait if next location on path if passible but not enough fuel', function(done) {
                //Set fuel to just under required amount
                myBot.fuel = movement.getDistance(myBot.me, targetPath[4])-1;
                output = movement.moveAlongPath(myBot);

                expect(myBot.path).to.deep.include.members(targetPath);
                expect(output).equals(undefined);

                done();
            });

            it('should not move if next place on path impassable and adjustPath fails', function(done) {
                const mapAlterations = [
                    {x: 1, y: 1, value: false},
                    {x: 2, y: 2, value: false},
                    {x: 3, y: 3, value: false},
                    {x: 4, y: 4, value: false},
                    {x: 5, y: 5, value: false},
                    {x: 3, y: 5, value: false},
                    {x: 5, y: 3, value: false},
                    {x: 4, y: 5, value: false},
                    {x: 5, y: 4, value: false}
                ]
                mockGame.alterMap("map", mapAlterations);
                spyAdjustPath = mockGame.trackMethod("movement", "adjustPath");

                output = movement.moveAlongPath(myBot);

                expect(spyAdjustPath.callCount).equals(1);
                expect(myBot.path).to.deep.include.members(targetPath);
                expect(output).equals(undefined);

                done();
            });

            it('should move to new adjusted location if next move is impassable and adjustPath() succeeds', function(done) {
                const mapAlterations = [
                    {x: 1, y: 1, value: false}
                ]
                mockGame.createNewRobot(new MyRobot(), 2, 2, 0, 0);
                mockGame.alterMap("map", mapAlterations);
                spyAdjustPath = mockGame.trackMethod("movement", "adjustPath");

                output = movement.moveAlongPath(myBot);

                expect(spyAdjustPath.callCount).equals(1);
                expect(myBot.path).to.deep.include.members(targetPath.slice(0, 3));
                expect(myBot.path).to.not.deep.include(targetPath[3]);
                expect(myBot.path).to.not.deep.include(targetPath[4]);
                expect(output['action']).equals('move');
                expect({x: output['dx'], y: output['dy']}).to.not.eql({x: 1, y: 1});

                done();
            });
        });

        describe('adjustPath() tests', function() {  
            it('should adjust nothing if path clear', function(done) {
                /*stubAStarPathfining = mockGame.replaceMethod("movement", "aStarPathfinding", function(self) {
                    self.path
                });*/
                output = movement.adjustPath(myBot, myBot.me);

                expect(myBot.path).to.eql(targetPath);
                expect(myBot.path[0]).to.eql(myBot.target);

                done();
            });     

            it('should adjust path up until next passible point on path', function(done) {
                const mapAlterations = [
                    {x: 1, y: 1, value: false},
                    {x: 2, y: 2, value: false},
                    {x: 3, y: 3, value: false}
                ]
                mockGame.alterMap("map", mapAlterations);

                output = movement.adjustPath(myBot, myBot.me);

                expect(myBot.path).to.deep.include.members(targetPath.slice(0, 2));
                expect(myBot.path).to.not.deep.include(targetPath[2]);
                expect(myBot.path).to.not.deep.include(targetPath[3]);
                expect(myBot.path).to.not.deep.include(targetPath[4]);
                expect(myBot.path).to.not.deep.include.members(targetPath.slice(2));
                expect(myBot.path[0]).to.eql(myBot.target);

                done();
            }); 

            it('should adjust target to nearest location if all path locations are impassable', function(done) {
                const mapAlterations = [
                    {x: 1, y: 1, value: false},
                    {x: 2, y: 2, value: false},
                    {x: 3, y: 3, value: false},
                    {x: 4, y: 4, value: false},
                    {x: 5, y: 5, value: false}
                ]
                mockGame.alterMap("map", mapAlterations);
                const closestTarget = movement.findNearestLocation(myBot, myBot.target);

                output = movement.adjustPath(myBot, myBot.me);

                expect(myBot.path).to.not.deep.include.members(targetPath);
                expect(myBot.path[0]).to.eql(closestTarget);

                done();
            });

            it('should return false and reproduce original path if all path locations AND movement near target impossible', function(done) {
                const mapAlterations = [
                    {x: 1, y: 1, value: false},
                    {x: 2, y: 2, value: false},
                    {x: 3, y: 3, value: false},
                    {x: 4, y: 4, value: false},
                    {x: 5, y: 5, value: false},
                    {x: 3, y: 5, value: false},
                    {x: 5, y: 3, value: false},
                    {x: 4, y: 5, value: false},
                    {x: 5, y: 4, value: false}
                ]
                mockGame.alterMap("map", mapAlterations);

                output = movement.adjustPath(myBot, myBot.me);

                expect(output).to.be.false;
                expect(myBot.path).to.deep.include.members(targetPath);

                done();
            });

        });
    });

    describe('getMoveablePositions() Tests', function() {
        let output;

        beforeEach(function() {
            mockGame = new mockBC19();
            mockGame.initEmptyMaps(6);
        });

        it('should provide basic coordinates and information for every move', function(done) {
            output = movement.getMoveablePositions(3);
            output.forEach(position => {
                expect(position).to.have.property('x');
                expect(position).to.have.property('y');
                expect(position).to.have.property('r2');
                expect(position).to.have.property('dirIndex');
            });

            done();
        });

        it('should only include moves in range for unit', function(done) {
            //Because I'm too lazy to import SPECS atm...
            const maxSpeed = [0, 0, 4, 9, 4, 4];
            for(let i = 0; i < 6; i++) {
                output = movement.getMoveablePositions(i);
                output.forEach(position => {
                    expect(position.r2).to.be.at.most(maxSpeed[i]);
                });
            }

            done();
        });

        it('should not include a non-movement position', function(done) {
            for(let i = 0; i < 6; i++) {
                output = movement.getMoveablePositions(i);
                expect(output).to.not.deep.include({x: 0, y: 0});
            }

            done();
        });
    });

    describe.skip('findNearestLocation() Tests', function() {
        let output;
        let myBot = new MyRobot();
        let target = {x: 3, y: 3};
        let targetIndex

        beforeEach(function() {
            mockGame = new mockBC19();
            mockGame.initEmptyMaps(6);
            mockGame.createNewRobot(myBot, 0, 0, 0, 2);
            targetIndex = movement.getDirectionIndex(movement.getRelativeDirection(target, myBot.me));
        });

        it('should prioritize closest cells to target', function(done) {
            let mapAlterations;
            target = {x: 4, y: 0};

            output = movement.findNearestLocation(myBot, target);
            expect(output).eql({x: 3, y: 0});

            mapAlterations = [
                {x: 3, y: 2, value: false},
                {x: 2, y: 3, value: false},
                {x: 4, y: 3, value: false}
            ]
            target = {x: 3, y: 3};

            mockGame.alterMap("map", mapAlterations);
            output = movement.findNearestLocation(myBot, target);
            expect(output).eql({x: 3, y: 4});

            mockGame.alterMap("map", [{x: 3, y: 4, value: false}]);
            output = movement.findNearestLocation(myBot, target);
            expect(output).eql({x: 2, y: 2});


            done();
        });

        it('should prioritize cells in direction from target to bot if equal distance', function(done) {
            let mapAlterations = [
                {x: 3, y: 2, value: false},
                {x: 2, y: 3, value: false},
                {x: 4, y: 3, value: false},
                {x: 3, y: 4, value: false}
            ];
            target = {x: 3, y: 3};

            mockGame.alterMap("map", mapAlterations);
            output = movement.findNearestLocation(myBot, target);
            expect(output).eql({x: 2, y: 2});

            done();
        });

        it('should account for bots in the way', function(done) {
            let anotherBot = new MyRobot();
            let mapAlterations = [
                {x: 3, y: 2, value: false},
                {x: 2, y: 3, value: false},
                {x: 4, y: 3, value: false},
                {x: 3, y: 4, value: false}
            ];
            target = {x: 3, y: 3};

            mockGame.createNewRobot(anotherBot, 2, 2, 0, 2);
            mockGame.alterMap("map", mapAlterations);
            output = movement.findNearestLocation(myBot, target);
            expect(output).to.not.eql({x: 2, y: 2});

            done();
        });
    });

    describe.skip('getNearestPositionFromList() Tests', function() {
        let output;
        let myBot = new MyRobot();
        let loc1 = {x: 5, y: 5};
        let loc2 = {x: 3, y: 3}
        let targets = [{x: 3, y: 4}, {x: 2, y: 1}, {x: 1, y: 1}, {x: 4, y: 4}]

        beforeEach(function() {
            mockGame = new mockBC19();
            mockGame.initEmptyMaps(6);
            mockGame.createNewRobot(myBot, 0, 0, 0, 2);
        });

        it('Should return closest tile when true passableCheck is false',function() {
            //Works with bots
            output = movement.getNearestPositionFromList(myBot, myBot.map, myBot.getVisibleRobotMap(), targets, false);
            expect(output).eql({x: 1, y: 1});

            mapAlterations = [
                {x: 1, y: 1, value: false}
            ]
            mockGame.alterMap("map", mapAlterations);

            //Works with impassable tile
            output = movement.getNearestPositionFromList(myBot, myBot.map, myBot.getVisibleRobotMap(), targets, false);
            expect(output).eql({x: 1, y: 1});


            mapAlterations = [
                {x: 1, y: 1, value: true}
            ]
            mockGame.alterMap("map", mapAlterations);
            mockGame.createNewRobot(new MyRobot(), 1, 1, 0, 2);

            //Works with occupied tile
            output = movement.getNearestPositionFromList(myBot, myBot.map, myBot.getVisibleRobotMap(), targets, false);
            expect(output).eql({x: 1, y: 1});

            //Works with locs instead of bot
            output = movement.getNearestPositionFromList(loc1, myBot.map, myBot.getVisibleRobotMap(), targets, false);
            expect(output).eql({x: 4, y: 4});

            output = movement.getNearestPositionFromList(loc2, myBot.map, myBot.getVisibleRobotMap(), targets, false);
            expect(output).eql({x: 3, y: 4});
        });

        it('Should return closest unoccupied tile when passableCheck is true',function() {
            //Works with bots and passable tiles
            targets = [{x: 3, y: 4}, {x: 2, y: 1}, {x: 1, y: 1}, {x: 4, y: 4}];
            expect(movement.getNearestPositionFromList(myBot, myBot.map, myBot.getVisibleRobotMap(), targets, true)).eql({x: 1, y: 1});

            mapAlterations = [
                {x: 1, y: 1, value: false}
            ]
            mockGame.alterMap("map", mapAlterations);

            //Gets nearest passable tile instead
            expect(movement.getNearestPositionFromList(myBot, myBot.map, myBot.getVisibleRobotMap(), targets, true)).eql({x: 2, y: 1});

            mockGame.alterMap("map", mapAlterations);
            mockGame.createNewRobot(new MyRobot(), 2, 1, 0, 2);

            //Gets nearest unoccupied tile instead
            expect(movement.getNearestPositionFromList(myBot, myBot.map, myBot.getVisibleRobotMap(), targets, true)).eql({x: 3, y: 4});

            //Works with locs instead of bot
            expect(movement.getNearestPositionFromList(loc1, myBot.map, myBot.getVisibleRobotMap(), targets, true)).eql({x: 4, y: 4});

            expect(movement.getNearestPositionFromList(loc2, myBot.map, myBot.getVisibleRobotMap(), targets, true)).eql({x: 3, y: 4});
        });

        it('Should return itself when all locations on list are not passable and passableCheck is true',function() {

            mapAlterations = [
                {x: 1, y: 1, value: false},
                {x: 3, y: 4, value: false}, 
                {x: 2, y: 1, value: false},
                {x: 4, y: 4, value: false}
            ]
            mockGame.alterMap("map", mapAlterations);

            //Works with bots
            output = movement.getNearestPositionFromList(myBot, myBot.map, myBot.getVisibleRobotMap(), targets, true);
            expect(output).eql({x: 0, y: 0});

            //Works with locs
            output = movement.getNearestPositionFromList(loc1, myBot.map, myBot.getVisibleRobotMap(), targets, true);
            expect(output).eql(loc1);

            output = movement.getNearestPositionFromList(loc2, myBot.map, myBot.getVisibleRobotMap(), targets, true);
            expect(output).eql(loc2);

            mapAlterations = [
                {x: 1, y: 1, value: false},
                {x: 3, y: 4, value: false}, 
                {x: 2, y: 1, value: false},
                {x: 4, y: 4, value: false}
            ]
            mockGame.alterMap("map", mapAlterations);

            mockGame.createNewRobot(new MyRobot(), 1, 1, 0, 2);
            mockGame.createNewRobot(new MyRobot(), 3, 4, 0, 2);
            mockGame.createNewRobot(new MyRobot(), 2, 1, 0, 2);
            mockGame.createNewRobot(new MyRobot(), 4, 4, 0, 2);

            //Works with bots
            output = movement.getNearestPositionFromList(myBot, myBot.map, myBot.getVisibleRobotMap(), targets, true);
            expect(output).eql({x: 0, y: 0});

            //Works with locs
            output = movement.getNearestPositionFromList(loc1, myBot.map, myBot.getVisibleRobotMap(), targets, true);
            expect(output).eql(loc1);

            output = movement.getNearestPositionFromList(loc2, myBot.map, myBot.getVisibleRobotMap(), targets, true);
            expect(output).eql(loc2);
        });
    });
});