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
        it('positionsAreEqual Returns Undefined Given Invalid Objects', function(done) {
            const A = {x: 1, y: 1};
            const B = null;
            const C = {x: 2};
            
            expect(movement.positionsAreEqual(A,B)).to.be.undefined;
            expect(movement.positionsAreEqual(B,A)).to.be.undefined;
            expect(movement.positionsAreEqual(A,C)).to.be.undefined;
            expect(movement.positionsAreEqual(C,A)).to.be.undefined;
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
        it('getRelativePosition Returns Undefined Value Given Invalid A And B Objects', function(done) {
            const A = {x: 5, y: 7};
            const B = null;
            const C = {x: 4};
            
            expect(movement.getRelativePosition(A,B)).to.be.undefined;
            expect(movement.getRelativePosition(B,A)).to.be.undefined;
            expect(movement.getRelativePosition(C,A)).to.be.undefined;
            expect(movement.getRelativePosition(A,C)).to.be.undefined;
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
        it('getRelativePosition Returns Undefined Value Given Invalid A And B Objects', function(done) {
            const A = {x: 5, y: 7};
            const B = null;
            const C = {x: 4};
            
            expect(movement.getRelativeDirection(A,B)).to.be.undefined;
            expect(movement.getRelativeDirection(B,A)).to.be.undefined;
            expect(movement.getRelativeDirection(C,A)).to.be.undefined;
            expect(movement.getRelativeDirection(A,C)).to.be.undefined;
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
        it('getRelativePosition Returns -1 Given Valid/ Invalid Direction Object With x Or y Not An Element Of {-1, 1}', function(done) {
            const A = {x: -3, y: 1};
            const B = {x: -1, y: 2};
            const C = {x: 0, 0};
            const D = {x: 4};
            const E = {y: -4};
            
            expect(movement.DirectionIndex(A)).equals(-1);
            expect(movement.DirectionIndex(B)).equals(-1);
            expect(movement.DirectionIndex(C)).equals(-1);
            expect(movement.DirectionIndex(D)).equals(-1);
            expect(movement.DirectionIndex(E)).equals(-1);
            done();
        });
        it('getRelativePosition Returns Undefined Value Given Invalid Direction Object', function(done) {
            const A = null;
            
            expect(movement.DirectionIndex(A)).to.be.undefined;
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
    movement.rotateDirection(direction, n);
    movement.getDistanceXY(A, B);
    movement.getDistance(A, B);
    movement.checkQuadrant(location, fullmap);
    movement.getPotentialEnemyCastleLocation(myCastleLocation, fullmap);
    movement.isPassable = (location, fullMap, robotMap);
    movement.dumberMoveTowards = (location, fullMap, robotMap, destination, previous);
    movement.moveTowards = (self, destination);

});