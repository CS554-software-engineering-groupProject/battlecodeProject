const mocha = require('mocha');
const chai = require('chai');
const MyRobot = require('../projectUtils/psuteam7botCompiled.js').MyRobot;
const movement = require('../projectUtils/psuteam7botCompiled.js').movement;
const expect = chai.expect;


describe('Movement Helpers Unit Tests', function() {
    describe('positionsAreEqual Returns Valid Values', function(done) {
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
            const B = {x: 0, y: 1};
            
            expect(movement.positionsAreEqual(A,B)).to.be.undefined;
            expect(movement.positionsAreEqual(B,A)).to.be.undefined;
            done();
        });
    });

});