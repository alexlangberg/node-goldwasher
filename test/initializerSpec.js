'use strict';

var setup = require('./testSetup');
var should; should = setup.chai.should();
var initializer = require('../lib/initializer');
var validObject = { 
	url: 'http://www.foo.com',
	tags: 'h1'
};
var invalidObject = {
	foo: 'bar'
};

describe('initializer', function () {

		it('throws if not passed an object', function () {
			var number = 5;
			var string = 'foo';
			should.throw(function(){ initializer(number); });
			should.throw(function(){ initializer(string); });
			should.throw(function(){ initializer(); });
		});

		it('throws if input object does not contain a URL', function () {
			should.throw(function(){ initializer(invalidObject); });
		});

		it('throws if output object does not contain a URL', function () {
			var success = initializer(validObject);
			success.should.have.deep.property('url');
		});

		it('throws if output object does not contain target tags', function () {
			var success = initializer(validObject);
			success.should.have.deep.property('tags');	
		});

});