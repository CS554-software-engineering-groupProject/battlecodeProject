const mocha = require('mocha');
const chai = require('chai');
const mockBC19 = require('../projectUtils/mockGame.js');
const MyRobot = require('../projectUtils/psuteam7botCompiled.js').MyRobot;
const communication = require('../projectUtils/psuteam7botCompiled.js').communication;
const movement = require('../projectUtils/psuteam7botCompiled.js').movement;
const expect = chai.expect;


describe('Communication Helpers Unit Tests', function() {
    beforeEach(function() {
        mockGame = new mockBC19();
        mockGame.initEmptyMaps(6);
    });
    describe('positionToSignal Translates Position Correctly', function(done) {

        it('positionToSignal Returns Correct Signal Given A Position Object', function(done) {
            const A = {x: 0, y: 0};
            const B = {x: 3, y: 4};
            const C = {x: 1, y: 2};            
            mapAlterations = [
                {x: 1, y: 2, value:false},
                {x: 3, y: 2, value:false}
            ];
            mockGame.alterMap("map", mapAlterations);

            expect(communication.positionToSignal(A, mockGame.game.map)).equals(0);
            expect(communication.positionToSignal(B, mockGame.game.map)).equals(27);
            expect(communication.positionToSignal(C, mockGame.game.map)).equals(13);
            done();
        });
    });

    describe('signalToPosition Translates Signal Correctly', function(done) {
        it('signalToPosition Returns Position Object Given A Signal', function(done) {
            const A = 0;
            const B = 27;
            const C = 13;
            mapAlterations = [
                {x: 1, y: 2, value:false},
                {x: 3, y: 2, value:false}
            ];
            mockGame.alterMap("map", mapAlterations);   


            expect(communication.signalToPosition(A, mockGame.game.map)).to.eql({x: 0, y: 0});
            expect(communication.signalToPosition(B, mockGame.game.map)).to.eql({x: 3, y: 4});
            expect(communication.signalToPosition(C, mockGame.game.map)).to.eql({x: 1, y: 2});
            done();
        });
    });

    describe('initTeamCastleInformation implementation tests', function() {
        let castleBuiltBy;
        let teamCastles;
        let buildLocs = [];

        beforeEach(function() {
            mockGame = new mockBC19();
            teamCastles = mockGame.getBotsInGame(0).filter(castle => {
                return castle.me.team === 0;
            });
            if(teamCastles.length > 0) {
                castleBuiltBy = teamCastles[0];
            } else {
                throw "Need castles in game to init castle information"
            }

            for(let x = castleBuiltBy.me.x-1; x < castleBuiltBy.me.x+1; x++) {
                for(let y = castleBuiltBy.me.y-1; y < castleBuiltBy.me.y+1; y++) {
                    const position = {x: x, y: y}
                    if(movement.isPassable(position, mockGame.game.map, mockGame.game.shadow)) {
                        buildLocs.push(position);
                    }
                }
            }
        });

        it('should return false if teamCastles have been added to already', function(done) {
            let returnValue;
            const myBot = new MyRobot();
            myBot.teamCastles.push({id: -1, x: -1, y: -1});
            const visibleCastles = [];
            mockGame.createNewRobot(myBot, buildLocs[0].x, buildLocs[0].y, 0, 2);

            returnValue = communication.initTeamCastleInformation(myBot);
            expect(returnValue).to.be.false;
            done();
        });

        it('should add all visible team castles', function(done) {
            const myBot = new MyRobot();
            const visibleCastles = [];
            mockGame.createNewRobot(myBot, buildLocs[0].x, buildLocs[0].y, 0, 2);
            teamCastles.forEach(castle => {
                if(movement.getDistance(myBot.me, castle.me) <= 100) {
                    visibleCastles.push({id: castle.me.id, x: castle.me.x, y: castle.me.y});
                }
            })

            communication.initTeamCastleInformation(myBot);

            expect(myBot.teamCastles.length).equals(visibleCastles.length);
            expect(myBot.teamCastles).to.have.deep.members(visibleCastles);
            done();
        });

        it('should sort castles such that the closest is near index 0', function(done) {
            const myBot = new MyRobot();
            const visibleCastles = [];
            
            mockGame.createNewRobot(myBot, buildLocs[0].x, buildLocs[0].y, 0, 2);
            for(let i = 1; i < buildLocs.length; i++) {
                const addedCastle = new MyRobot();
                mockGame.createNewRobot(addedCastle, buildLocs[i].x, buildLocs[i].y, 0, 0);
                visibleCastles.push({id: addedCastle.me.id, x: addedCastle.me.x, y: addedCastle.me.y})
            }

            communication.initTeamCastleInformation(myBot);

            for(let j = 1; j < myBot.teamCastles.length; j++) {
                const castle1 = myBot.teamCastles[j-1];
                const castle2 = myBot.teamCastles[j];
                const c1dist = movement.getDistance(myBot.me, castle1);
                const c2dist = movement.getDistance(myBot.me, castle2);
                expect(c1dist).to.be.at.most(c2dist);
            }
            done();
        });
    });

    describe('checkAndReportEnemyCastleDestruction implementation test', function(){
        beforeEach(function() {
            const myBot = new MyRobot();
            mockGame.createNewRobot(myBot, 0, 0, 0, 2);
            myBot.target = {x: 2, y: 3};
        });

        it('should push target coordinates into pendingMessages and return true when there is no robot at target', function(done) {
            expect(myBot.pendingMessages.length).to.be.empty;
            expect(myBot.pendingMessages).to.eql([]);
            expect(communication.checkAndReportEnemyCastleDestruction(myBot)).to.equals(true);
            expect(myBot.pendingMessages.length).to.equals(2);
            expect(myBot.pendingMessages).to.eql([3, 2]);

            done();
        });

        it('should push target coordinates into pendingMessages and return true when the robot at target is not a castle', function(done) {
            const notCastle = new MyRobot();
            mockGame.createNewRobot(notCastle, 2, 3, 1, 2);

            expect(myBot.pendingMessages.length).to.be.empty;
            expect(myBot.pendingMessages).to.eql([]);
            expect(communication.checkAndReportEnemyCastleDestruction(myBot)).to.equals(true);
            expect(myBot.pendingMessages.length).to.equals(2);
            expect(myBot.pendingMessages).to.eql([3, 2]);
            done();
        });

        it('should return false if robot at target is a castle', function(done) {
            const enemyCastle = new MyRobot();
            mockGame.createNewRobot(enemyCastle, 2, 3, 1, 0);

            expect(myBot.pendingMessages.length).to.be.empty;
            expect(communication.checkAndReportEnemyCastleDestruction(myBot)).to.equals(false);
            expect(myBot.pendingMessages.length).to.be.empty;
            done();
        });
    });

    describe('sendCastleTalkMessage implementation test', function(){
        beforeEach(function() {
            const myBot = new MyRobot();
            mockGame.createNewRobot(myBot, 0, 0, 0, 2);
        });

        it('should pop message from pendingMessages, castleTalk, and returns true if pendingMessages contains something', function(done) {
            myBot.pendingMessages = [3, 2];

            expect(myBot.pendingMessages.length).to.equals(2);
            expect(myBot.pendingMessages).to.eql([3, 2]);
            expect(communication.sendCastleTalkMessage(myBot)).to.equals(true);
            expect(myBot.pendingMessages.length).to.equals(1);
            expect(myBot.pendingMessages).to.eql([3]);
            done();
        });

        it('should return false if pendingMessages is empty', function(done) {
            myBot.pendingMessages = [];
            
            expect(myBot.pendingMessages.length).to.not.be.empty;
            expect(communication.sendCastleTalkMessage(myBot)).to.equals(false);
            expect(myBot.pendingMessages.length).to.not.be.empty;
            done();
        });
    });

    describe('checkBaseSignalAndUpdateTarget implementation test', function(){
        beforeEach(function() {
            const myBot = new MyRobot();
            const baseBot = new MyRobot();
            const newPos = {x: 3, y: 4};
            mockGame.createNewRobot(myBot, 0, 0, 0, 2);
            mockGame.createNewRobot(base, 4, 4, 0, 0);
            myBot.attackerMoves = 1;
            myBot.target = {x: 5, y: 5};
            myBot.baseID = baseBot.me.id;
            myBot.squadSize = 8;
            myBot.path = [{x: 1, y:2}];
        });

        it('should return false if baseID is null and is never set', function(done) {
            myBot.baseID = null;

            expect(communication.checkBaseSignalAndUpdateTarget(myBot)).to.equals(false);
            done();
        });

        it('should change target, resets path, does not change squadSize and returns true, if base signals and attackerMoves is 1', function(done) {
            baseBot.signal = communication.positionToSignal(newPos, mockGame.game.map);
            baseBot.signal_radius = mockGame.game.map.length * mockGame.game.map.length;
            mockGame._setCommunication(baseBot);

            expect(myBot.squadSize).equals(8);
            expect(myBot.target).to.eql({x: 5, y: 5});
            expect(myBot.path).to.not.be.empty;
            expect(communication.checkBaseSignalAndUpdateTarget(myBot)).to.equals(true);
            expect(myBot.target).to.eql(newPos);
            expect(myBot.squadSize).equals(8);
            expect(myBot.path).to.be.empty;
            done();
        });

        it('should change target, resets path, changes squadSize to 0 and returns true, if base signals and attackerMoves is > 1', function(done) {
            myBOt.attackerMoves = 3;

            baseBot.signal = communication.positionToSignal(newPos, mockGame.game.map);
            baseBot.signal_radius = mockGame.game.map.length * mockGame.game.map.length;
            mockGame._setCommunication(baseBot);

            expect(myBot.squadSize).equals(8);
            expect(myBot.target).to.eql({x: 5, y: 5});
            expect(myBot.path).to.not.be.empty;
            expect(communication.checkBaseSignalAndUpdateTarget(myBot)).to.equals(true);
            expect(myBot.target).to.eql(newPos);
            expect(myBot.squadSize).equals(0);
            expect(myBot.path).to.be.empty;
            done();
        });

        it('should return false if base is not signalling', function(done) {

            expect(myBot.squadSize).equals(8);
            expect(myBot.target).to.eql({x: 5, y: 5});
            expect(myBot.path).to.not.be.empty;
            expect(communication.checkBaseSignalAndUpdateTarget(myBot)).to.equals(false);
            expect(myBot.squadSize).equals(8);
            expect(myBot.target).to.eql({x: 5, y: 5});
            expect(myBot.path).to.not.be.empty;
            done();
        });

        it('should return false if base signals -1', function(done) {
            baseBot.signal = -1;
            baseBot.signal_radius = mockGame.game.map.length * mockGame.game.map.length;
            mockGame._setCommunication(baseBot);

            expect(myBot.squadSize).equals(8);
            expect(myBot.target).to.eql({x: 5, y: 5});
            expect(myBot.path).to.not.be.empty;
            expect(communication.checkBaseSignalAndUpdateTarget(myBot)).to.equals(false);
            expect(myBot.squadSize).equals(8);
            expect(myBot.target).to.eql({x: 5, y: 5});
            expect(myBot.path).to.not.be.empty;
            done();
        });

        it('should return false if base signal radius is short', function(done) {
            baseBot.signal = communication.positionToSignal(newPos, mockGame.game.map);
            baseBot.signal_radius = 2;
            mockGame._setCommunication(baseBot);

            expect(myBot.squadSize).equals(8);
            expect(myBot.target).to.eql({x: 5, y: 5});
            expect(myBot.path).to.not.be.empty;
            expect(communication.checkBaseSignalAndUpdateTarget(myBot)).to.equals(false);
            expect(myBot.squadSize).equals(8);
            expect(myBot.target).to.eql({x: 5, y: 5});
            expect(myBot.path).to.not.be.empty;
            done();
        });
    });
});