const mocha = require('mocha');
const chai = require('chai');
const mockBC19 = require('../projectUtils/mockGame.js');
const MyRobot = require('../projectUtils/psuteam7botCompiled.js').MyRobot;
const combat = require('../projectUtils/psuteam7botCompiled.js').combat;
const movement = require('../projectUtils/psuteam7botCompiled.js').movement;
const expect = chai.expect;


describe.only('Combat Unit Tests', function() {
    let input;
    let output;
    let myBot = new MyRobot();
    let castles = [new MyRobot(), new MyRobot()];
    let pilgrims = [new MyRobot(), new MyRobot()];
    let crusaders = [new MyRobot(), new MyRobot()];
    let prophets = [new MyRobot(), new MyRobot()];

    before(function() {
        mockGame = new mockBC19();
        mockGame.initEmptyMaps(10);
        mockGame.createNewRobot(myBot, 0, 0, 0, 2);
        mockGame.createNewRobot(castles[0], 1, 1, 0, 0);
        mockGame.createNewRobot(castles[1], 8, 8, 1, 0);
        mockGame.createNewRobot(pilgrims[0], 5, 5, 0, 2);
        mockGame.createNewRobot(pilgrims[1], 9, 9, 1, 2);
        mockGame.createNewRobot(crusaders[0], 6, 3, 0, 3);
        mockGame.createNewRobot(crusaders[1], 3, 6, 1, 3);
        mockGame.createNewRobot(prophets[0], 7, 0, 0, 4);
        mockGame.createNewRobot(prophets[1], 0, 7, 1, 4);
    });

    describe('UNITTYPE tests', function() {
        it('should have proper indices for each unit', function(done) {
            const units = combat.UNITTYPE;
            expect(units.indexOf("CASTLE")).equals(0);
            expect(units.indexOf("CHURCH")).equals(1);
            expect(units.indexOf("PILGRIM")).equals(2);
            expect(units.indexOf("CRUSADER")).equals(3);
            expect(units.indexOf("PROPHET")).equals(4);
            expect(units.indexOf("PREACHER")).equals(5);

            done();
        })
    });

    describe('filterByUnitType tests', function() {
        input = [];
        it('should properly filter by unit type', function(done) {
            input.push(pilgrims[0].me, pilgrims[1].me, myBot.me)
            output = combat.filterByUnitType(input, "PILGRIM");
            expect(output).to.eql(input);

            input.push(castles[0].me, prophets[1].me, crusaders[0].me);
            output = combat.filterByUnitType(input, "PILGRIM");
            expect(output).to.eql([pilgrims[0].me, pilgrims[1].me, myBot.me]);
            expect(output).to.not.deep.include(castles[0].me);
            expect(output).to.not.deep.include(prophets[1].me);
            expect(output).to.not.deep.include(crusaders[0].me);

            output = combat.filterByUnitType(input, "CRUSADER");
            expect(output).to.deep.include(crusaders[0].me);
            expect(output).to.not.deep.include(castles[0].me);
            expect(output).to.not.deep.include(prophets[1].me);
            expect(output).to.not.deep.include(myBot.me);
            expect(output).to.not.deep.include(pilgrims[0].me);
            expect(output).to.not.deep.include(pilgrims[1].me);

            input = [];
            output = combat.filterByUnitType(input, "PILGRIM");
            expect(output).to.eql([]);

            done();
        });
    });

    describe('getRobotsInRange tests', function() {
        let expectedBots;
        it('should pass range edge cases', function(done) {
            //minRange above maxRange - should return nothing
            output = combat.getRobotsInRange(myBot, 1, 0);
            expect(output).to.eql([])

            //minRange equal to maxRange - should return things at exactly that length
            output = combat.getRobotsInRange(myBot, 49, 49);
            expect(output.length).equals(2);

            //minRange is 0 - should return bot itself
            output = combat.getRobotsInRange(myBot, 0, 1);
            expect(output.length).equals(1);
            expect(myBot.me).to.include(output[0]);


            done();
        });

        it('should only get visible bots', function(done) {
            output = combat.getRobotsInRange(myBot, 0, 1000);
            expect(output.length).equals(7);
            expect(myBot.me).to.include(output[0]);
            output.forEach(bot => {
                expect(pilgrims[1].me).to.not.include(bot);
                expect(castles[1].me).to.not.include(bot);
            })
            
            done();
        });
    });
});