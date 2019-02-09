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

            let fullMap =                         
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

    describe('getAttackerPatrolRoute Returns Values Correctly', function(done) {
        it('getAttackerPatrolRoute Returns Valid Value Given Valid Castle location And fullMap Objects With Valid Values', function(done) {
            const A = {x: 0, y: 1};
            const B = {x: 5, y: 2};
            const C = {x: 2, y: 5};
            const D = {x: 4, y: 4};


            const vertFullMap = 
            [[true,true,true,true,true,true],
            [true,true,true,true,true,true],
            [true,false,true,true,false,true],
            [true,true,true,true,true,true],
            [true,true,true,true,true,true],
            [true,true,true,true,true,true]];    

            const horiFullMap = 
            [[true,true,true,true,true,true],
            [true,true,true,false,true,true],
            [true,true,true,true,true,true],
            [true,true,true,true,true,true],
            [true,true,true,false,true,true],
            [true,true,true,true,true,true]];    

            expect(movement.getAttackerPatrolRoute(A, horiFullMap)).to.eql([{x: 0,y: 4}, {x: 5, y: 4}]);
            expect(movement.getAttackerPatrolRoute(A, vertFullMap)).to.eql([{x: 5,y: 1}, {x: 5, y: 4}]);
            expect(movement.getAttackerPatrolRoute(B, horiFullMap)).to.eql([{x: 5, y: 3}, {x: 0, y: 3}]);
            expect(movement.getAttackerPatrolRoute(B, vertFullMap)).to.eql([{x: 0, y: 2}, {x: 0, y: 3}]);
            expect(movement.getAttackerPatrolRoute(C, horiFullMap)).to.eql([{x: 2, y: 0}, {x: 3, y: 0}]);
            expect(movement.getAttackerPatrolRoute(C, vertFullMap)).to.eql([{x: 3, y: 5}, {x: 3, y: 0}]);
            expect(movement.getAttackerPatrolRoute(D, horiFullMap)).to.eql([{x: 4, y: 1}, {x: 1, y: 1}]);
            expect(movement.getAttackerPatrolRoute(D, vertFullMap)).to.eql([{x: 1, y: 4}, {x: 1, y: 1}]);
            done();
        });
    });

    describe('isPassable Returns Values Correctly', function(done) {                  
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

            expect(movement.isPassable(D, fullMap, robotMap)).equals(false);
            expect(movement.isPassable(E, fullMap, robotMap)).equals(false);
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

        describe('isHorizontalReflection Returns Values Correctly', function(done) {
            it('isHorizontalReflection Returns Valid Values Given a horizontal or vertical reflection fullMap', function(done) {
                const vertFullMap = 
                [[true,true,true,true,true,true],
                [true,true,true,true,true,true],
                [true,false,true,true,false,true],
                [true,true,true,true,true,true],
                [true,true,true,true,true,true],
                [true,true,true,true,true,true]];    

                const horiFullMap = 
                [[true,true,true,true,true,true],
                [true,true,true,false,true,true],
                [true,true,true,true,true,true],
                [true,true,true,true,true,true],
                [true,true,true,false,true,true],
                [true,true,true,true,true,true]];    

                expect(movement.isHorizontalReflection(vertFullMap)).equals(false);
                expect(movement.isHorizontalReflection(horiFullMap)).equals(true);
                done();
            });
        });

        describe('getMirrorCastleLocations Returns Values Correctly', function(done) {
            it('getMirrorCastleLocations Returns Valid Values Given a horizontal or vertical reflection fullMap and a castle location', function(done) {
                const castleLocation = {x: 1,y: 1};

                const vertFullMap = 
                [[true,true,true,true,true,true],
                [true,true,true,true,true,true],
                [true,false,true,true,false,true],
                [true,true,true,true,true,true],
                [true,true,true,true,true,true],
                [true,true,true,true,true,true]];    

                const horiFullMap = 
                [[true,true,true,true,true,true],
                [true,true,true,false,true,true],
                [true,true,true,true,true,true],
                [true,true,true,true,true,true],
                [true,true,true,false,true,true],
                [true,true,true,true,true,true]];    

                expect(movement.getMirrorCastle(castleLocation, vertFullMap)).to.eql({x: 4, y: 1});
                expect(movement.getMirrorCastle(castleLocation, horiFullMap)).to.eql({x: 1,y: 4});
                done();
            });
        });

        describe('getEnemyCastleLocations Returns Values Correctly', function(done) {
            it('getEnemyCastleLocations Returns Mirrored Castle Locations Given a horizontal or vertical reflection fullMap and an array of castle location', function(done) {
                const castleLocation = [{x: 1,y: 1}, {x: 4, y: 4}, {x: 3, y: 2}];

                const vertFullMap = 
                [[true,true,true,true,true,true],
                [true,true,true,true,true,true],
                [true,false,true,true,false,true],
                [true,true,true,true,true,true],
                [true,true,true,true,true,true],
                [true,true,true,true,true,true]];    

                const horiFullMap = 
                [[true,true,true,true,true,true],
                [true,true,true,false,true,true],
                [true,true,true,true,true,true],
                [true,true,true,true,true,true],
                [true,true,true,false,true,true],
                [true,true,true,true,true,true]];    

                expect(movement.getEnemyCastleLocations(castleLocation, vertFullMap)).to.eql([{x: 4,y: 1}, {x: 1, y: 4}, {x: 2, y: 2}]);
                expect(movement.getEnemyCastleLocations(castleLocation, horiFullMap)).to.eql([{x: 1,y: 4}, {x: 4, y: 1}, {x: 3, y: 3}]);
                done();
            });
        });
    });
});