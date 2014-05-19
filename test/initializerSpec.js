var expect = require("chai").expect;
var initializer = require("../lib/initializer.js");
var validObject = { 
	uri: 'http://www.foo.com',
	tags: 'h1'
}
var invalidObject = {
	foo: 'bar'
}

describe("initializer", function() {

		it('should throw error if not passed an object', function () {
			var error = 'Input was not an object.';
			var number = 5;
			var string = 'foo';
			expect(function(){ initializer(number); }).to.throw(error);
			expect(function(){ initializer(string); }).to.throw(error);
			expect(function(){ initializer(); }).to.throw(error);
		});

		it('should throw if input object does not contain a URI', function () {
			var error = 'Input did not contain a URI';
			expect(function(){ initializer(invalidObject); }).to.throw(error);
		});

		it('should throw if output object does not contain a URI', function () {
			var success = initializer(validObject);
			expect(success).to.have.deep.property('uri');
		});

		it('should throw if output object does not contain tags', function () {
			var success = initializer(validObject);
			expect(success).to.have.deep.property('tags');	
		});

});