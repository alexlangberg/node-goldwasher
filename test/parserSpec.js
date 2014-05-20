'use strict';

var expect = require('chai').expect;
var parser = require('../lib/parser.js');
var testContent  = '<html><body>';
		testContent += '<h1>foo</h1>';
		testContent += '<h2>bar</h2>';
		testContent += '<h3>foobar</h3>';
		testContent += '<p>foobar foobar</p>';
		testContent += '</body></html>';

describe('parser', function() {

		it('should return an object', function () {
			var parsed = parser(testContent);
			//console.log(parsed);
			expect(parsed).to.be.an('object');
		});

});