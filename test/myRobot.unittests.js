const mocha = require('mocha');
const chai = require('chai');
const MyRobot = require('../projectUtils/psuteam7botCompiled.js').MyRobot;

/*Choose an assertion style. I am used to 'expect', but there is also 'should' and 'assert'
Basically different ways of making assertions. See https://www.chaijs.com/guide/styles/ for more documentation
Full Chai expect documentation for reference is here: https://www.chaijs.com/api/bdd/
*/
const expect = chai.expect;


//'describe' serves as a way to represent of kind of test. Everything in this describe block are 'MyRobot Unit Tests'
describe('MyRobot Unit Tests', function() {
    //Everything in this block is an 'Exanple' test. Some categories might be 'Mining', 'Movement', 'Strategy', etc.
    describe('Properties tests', function() {
        //'it' is the actual test that is run, with expectations being evaluated
        it('should be an MyRobot object', function(done) {
            const bot = new MyRobot();
            const type = typeof bot;

            //Create various assertions 
            expect(type).equals('object');
            expect(bot).to.be.an.instanceof(MyRobot);
            //Done is called at completion of test to know this specific test can terminate
            done();
        });

        //Use multiple 'it' blocks to test different aspects for the broader 'describe' category
        it('should have certain properties and lack others', function(done) {
            const bot = new MyRobot();

            expect(bot).to.have.property('id');
            expect(bot).to.have.property('fuel');
            expect(bot).to.have.property('karbonite');
            expect(bot).to.not.have.property('ID');
            expect(bot).to.not.have.property('nonExistantProperty');

            done();
        });

        //You can also skip tests or entire 'describe' blocks - useful for tests that are unfinished.
        //Similarly, there is a '.only' syntax to exclusively test an 'it' or 'describe' block
        it.skip('test to ignore', function(done) {
            //This test is not done
            expect(true).equals(false);
        })
    });
});