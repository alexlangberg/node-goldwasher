var expect = require("chai").expect;
var goldwasher = require("../lib/goldwasher.js");
 
describe("goldwasher", function() {
	describe('#sum()', function() {
		it('should add two integers', function() {
			var sum = goldwasher.sum(4, 3);
			expect(sum).to.equal(7);
		});
	});
});