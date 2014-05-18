var expect = require("chai").expect;
var calculator = require("../lib/calculator.js");
 
describe("calculator", function() {
	describe('#sum()', function() {
		it('should add two integers', function() {
			var sum = calculator.sum(4, 3);
			expect(sum).to.equal(7); 
		});
	});
});