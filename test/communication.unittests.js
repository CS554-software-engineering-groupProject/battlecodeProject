const mocha = require('mocha');
const chai = require('chai');
const MyRobot = require('../projectUtils/psuteam7botCompiled.js').MyRobot;
const communication = require('../projectUtils/psuteam7botCompiled.js').communication;
const expect = chai.expect;


describe('Communication Helpers Unit Tests', function() {
    describe('positionToSignal Translates Position Correctly', function(done) {
        it('positionToSignal Returns Correct Signal Given A Position Object', function(done) {
            const A = {x: 0, y: 0};
            const B = {x: 3, y: 4};
            const C = {x: 1, y: 2};

            const fullMap = 
            [[true,true,true,true,true,true],
            [true,true,true,true,true,true],
            [true,false,true,true,false,true],
            [true,true,true,true,true,true],
            [true,true,true,true,true,true],
            [true,true,true,true,true,true]];    


            expect(communication.positionToSignal(A, fullMap)).equals(0);
            expect(communication.positionToSignal(B, fullMap)).equals(27);
            expect(communication.positionToSignal(C, fullMap)).equals(13);
            done();
        });
    });

    describe('signalToPosition Translates Signal Correctly', function(done) {
        it('signalToPosition Returns Position Object Given A Signal', function(done) {
            const A = 0;
            const B = 27;
            const C = 13;

            const fullMap = 
            [[true,true,true,true,true,true],
            [true,true,true,true,true,true],
            [true,false,true,true,false,true],
            [true,true,true,true,true,true],
            [true,true,true,true,true,true],
            [true,true,true,true,true,true]];    


            expect(communication.signalToPosition(A, fullMap)).to.eql({x: 0, y: 0});
            expect(communication.signalToPosition(B, fullMap)).to.eql({x: 3, y: 4});
            expect(communication.signalToPosition(C, fullMap)).to.eql({x: 1, y: 2});
            done();
        });
    });
});