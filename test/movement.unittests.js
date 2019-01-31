const mocha = require('mocha');
const chai = require('chai');
const MyRobot = require('../projectUtils/psuteam7botCompiled.js').MyRobot;
const movement = require('../projectUtils/psuteam7botCompiled.js').movement;
const expect = chai.expect;


describe('Movement Helpers Unit Tests', function() {
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
            
            expect(movement.positionsAreEqual(A,B)).equals(false);
            expect(movement.positionsAreEqual(B,A)).equals(false);
            done();
        });
    });
    
    describe('getRelativePosition Returns Values Correctly', function(done) {
        it('getRelativePosition Returns Valid Values Given A And B Objects With Valid x And y Values', function(done) {
            const A = {x: 5, y: 7};
            const B = {x: 2, y: 4};
            
            expect(movement.getRelativePosition(A,B)).equals({x: -3, y: -3});
            expect(movement.getRelativePosition(B,A)).equals({x: 3, y: 3});
            expect(movement.getRelativePosition(A,A)).equals({x: 0, y: 0});
            done();
        });
    });

    describe('getRelativeDirection Returns Values Correctly', function(done) {
        it('getRelativeDirection Returns Valid Values Given Valid A and B Objects', function(done) {
            const A = {x: 2, y: 3};
            const B = {x: 4, y: 6};
            
            expect(movement.getRelativeDirection(A,B)).equals({x: 1, y: 1});
            expect(movement.getRelativeDirection(B,A)).equals({x: -1, y: -1});
            expect(movement.getRelativeDirection(A,A)).equals({x: 0, y: 0});
            done();
        });
    });

    describe('getDirectionIndex Returns Values Correctly', function(done) {
        it('getDirectionIndex Returns Valid Values Given Valid Direction Object', function(done) {
            const A = {x: 0, y: 1};
            const B = {x: -1, y: -1};
            const C = {x: 1, y: 0};
            
            expect(movement.DirectionIndex(A)).equals(0);
            expect(movement.DirectionIndex(B)).equals(5);
            expect(movement.DirectionIndex(C)).equals(2);
            done();
        });
        it('getDirectionIndex Returns -1 Given Valid/ Invalid Direction Object With x Or y Not An Element Of {-1, 1}', function(done) {
            const A = {x: -3, y: 1};
            const B = {x: -1, y: 2};
            const C = {x: 0, y: 0};
            const D = {x: 4};
            const E = {y: -4};
            
            expect(movement.DirectionIndex(A)).equals(-1);
            expect(movement.DirectionIndex(B)).equals(-1);
            expect(movement.DirectionIndex(C)).equals(-1);
            expect(movement.DirectionIndex(D)).equals(-1);
            expect(movement.DirectionIndex(E)).equals(-1);
            done();
        });
    });

    describe('rotateDirection Returns Values Correctly', function(done) {
        it('rotateDirection Returns Valid Value Given Valid Direction Object and N value', function(done) {
            const A = {x: 0, y: 1};
            const B = {x: -1, y: -1};
            const C = {x: 1, y: 0};
            
            expect(movement.DirectionIndex(A, 3)).equals({x: 1, y: -1});
            expect(movement.DirectionIndex(B, -5)).equals({x: 0, y: 1});
            expect(movement.DirectionIndex(C, 0)).equals(C);
            done();
        });
    });

    describe('getDistanceXY Returns Values Correctly', function(done) {
        it('getDistanceXY Returns Valid Value Given Valid A And B Objects With Valid x And y Values', function(done) {
            const A = {x: 5, y: 7};
            const B = {x: 2, y: 4};
            
            expect(movement.getDistanceXY(A,B)).equals({x: 3, y: 3});
            expect(movement.getDistanceXY(B,A)).equals({x: 3, y: 3});
            expect(movement.getDistanceXY(A,A)).equals({x: 0, y: 0});
            done();
        });
    });

    describe('getDistance Returns Values Correctly', function(done) {
        it('getDistance Returns Valid Value Given Valid A And B Objects With Valid x And y Values', function(done) {
            const A = {x: 5, y: 7};
            const B = {x: 2, y: 4};
            const C = {x: 5, y: 8};
            
            expect(movement.getDistanceXY(A,B)).equals(9);
            expect(movement.getDistanceXY(B,A)).equals(9);
            expect(movement.getDistanceXY(A,A)).equals(25);
            done();
        });
    });

    describe('checkQuadrant Returns Values Correctly', function(done) {
        it('checkQuadrant Returns Valid Value Given Valid location And fullMap Objects With Valid Values', function(done) {
            let A = {x: 0, y: 1};
            let B = {x: 5, y: 2};
            let C = {x: 2, y: 5};
            let D = {x: 4, y: 4};

            let fullmap =                         
            [[0,0,0,0,0,0],
            [0,0,0,0,0,0],
            [0,0,0,0,0,0],
            [0,0,0,0,0,0],
            [0,0,0,0,0,0],
            [0,0,0,0,0,0]];

            expect(movement.checkQuadrant(A, fullMap)).equals(1);
            expect(movement.checkQuadrant(B, fullMap)).equals(2);
            expect(movement.checkQuadrant(C, fullMap)).equals(3);
            expect(movement.checkQuadrant(D, fullMap)).equals(4);
            done();
        });
    });

    describe('getPotentialEnemyCastleLocation Returns Values Correctly', function(done) {
        it('getPotentialEnemyCastleLocation Returns Valid Value Given Valid Castle location And fullMap Objects With Valid Values', function(done) {
            const A = {x: 0, y: 1};
            const B = {x: 5, y: 2};
            const C = {x: 2, y: 5};
            const D = {x: 4, y: 4};
            const fullmap =                         
            [[true,false,false,false,false,false],
            [true,false,false,false,false,false],
            [true,true,true,false,false,false],
            [false,false,true,false,false,false],
            [false,false,false,false,false,false],
            [false,false,false,false,false,false]]; 

            expect(movement.getPotentialEnemyCastleLocation(A, fullMap)).equals([{x: 5,y: 1}, {x:0 ,y: 4}]);
            expect(movement.getPotentialEnemyCastleLocation(B, fullMap)).equals([{x: 0,y: 2}, {x:5 ,y: 3}]);
            expect(movement.getPotentialEnemyCastleLocation(C, fullMap)).equals([{x: 3,y: 5}, {x:2 ,y: 0}]);
            expect(movement.getPotentialEnemyCastleLocation(D, fullMap)).equals([{x: 4,y: 1}, {x:1 ,y: 4}]);
            done();
        });
    });

    describe('isPassable Returns Values Correctly', function(done) {                  
        const fullmap =   
        [[true,false,false,false,false,false],
        [true,false,true,true,false,false],
        [true,true,true,true,true,true],
        [false,true,true,true,false,false],
        [false,false,true,true,false,false],
        [false,false,false,false,false,false]];                      


        const robotMap = 
        [[0,0,0,0,0,0],
        [0,0,0,0,0,0],
        [0,0,0,0,0,3005],
        [0,0,0,0,0,0],
        [0,0,0,0,0,0],
        [0,0,0,0,0,0]];

        it('isPassable Returns true Given Valid location, fullMap, and robotMap Objects With Valid Values, And Location Is Passable On The Map', function(done) {
            const A = {x: 0, y: 1};
            
            expect(movement.isPassable(A, fullMap, robotMap)).equals(true);
            done();
        });
        it('isPassable Returns false Given Valid location, fullMap, and robotMap Objects With Valid Values, And Location Is impassable On The Map', function(done) {
            const B = {x: 5, y: 2};
            const C = {x: 2, y: 5};
            
            expect(movement.isPassable(B, fullMap, robotMap)).equals(false);
            expect(movement.isPassable(C, fullMap, robotMap)).equals(false);
            done();
        });

        it('isPassable Returns true Given Valid location And fullMap Objects With location Values Outside Map', function(done) {
            const D = {x: 4, y: 7};
            const E = {x: -1, y: 2};

            expect(movement.getPotentialEnemyCastleLocation(D, fullMap, robotMap)).equals(false);
            expect(movement.getPotentialEnemyCastleLocation(E, fullMap, robotMap)).equals(false);
            done();
        });
    });


    describe('dumberMoveTowards Returns Values Correctly', function(done) {     
        const fullMap = 
            [[true,false,false,false,false,false],
            [true,false,true,true,false,false],
            [true,true,true,true,true,true],
            [false,true,true,true,false,false],
            [false,false,true,true,false,false],
            [false,false,false,false,false,false]];                 


        const robotMap = 
        [[0,0,0,0,0,0],
        [0,0,0,0,0,0],
        [0,0,404,0,0,3005],
        [0,0,0,0,0,0],
        [0,0,0,0,0,0],
        [0,0,0,0,0,0]];

        it('dumberMoveTowards move to destination', function(done) {
            const A = {x: 2, y: 4};

            const destA = {x: 2, y: 3};

            const previous = {x: 1, y: 2};
            
            expect(movement.dumberMoveTowards(A, fullMap, robotMap, destA, previous)).equals(destA);
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

            expect(movement.dumberMoveTowards(B, fullMap, robotMap, destBC, previousB)).equals({x: 0, y: 1});
            expect(movement.dumberMoveTowards(C, fullMap, robotMap, destBC, previousC)).equals({x: 2,y: 3});
            expect(movement.dumberMoveTowards(D, fullMap, robotMap, destD, previousD)).equals({x: 2,y: 1});
            done();
        });

    });
});