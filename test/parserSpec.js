'use strict';

var should; should = require('./testSetup').should();
var parser = require('../lib/parser');
var testContent  = '<html><body>';
		testContent += '<h1>foo</h1>';
		testContent += '<h2>bar</h2>';
		testContent += '<h3>foobar</h3>';
		testContent += '<p>foobar foobar</p>';
		testContent += '</body></html>';
var parsed = parser(testContent);

describe('parser', function() {

		it('returns an array', function () {
			parsed.should.be.an('array');
		});

		it('returns an array with objects with a tag', function () {
			parsed.should.all.have.property('tag');
		});
		
		it('returns an array with objects with a sentence', function () {
			parsed.should.all.have.property('text');
		});

});