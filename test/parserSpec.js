'use strict';

var should; should = require('./testSetup').should();
var _ = require('underscore');
var parser = require('../lib/parser');
var testSettings = { 
	url:'http://www.google.com', 
	targets:'h1, h2, a' 
};
var testContent = '<h1>foo</h1><h1>bar</h1>';
var testContentHref = '<a href="/oak/strong"><h1>';
		testContentHref += 'Oak is strong and also gives shade.';
		testContentHref += '</h1></a>';
		testContentHref += '<h2><a href="http://www.catsanddogs.com/hate">';
		testContentHref += 'Cats and dogs each hate the other.';
		testContentHref += '</a></h2>';
		testContentHref += '<a href="http://www.pipe.com/rust">';
		testContentHref += 'The pipe began to rust while new.';
		testContentHref += '</a>';
var testContentNoHref = '<p><h1>';
		testContentNoHref += 'Open the crate but don&#39;t break the glass.';
		testContentNoHref += '</h1></p>';
var testContentNewlines = '<h1>';
		testContentNewlines += '\n\nAdd the sum\n';
		testContentNewlines += ' to the\n\n product\n\n\n of these three\n';
		testContentNewlines += '</h1>';
var parsed;
var settings;

describe('parser', function () {

	it('returns an array of nuggets', function () {
		parsed = parser(testSettings, testContent);
		parsed.should.be.an('array');
	});

	it('returns nuggets with a timestamp', function () {
		parsed = parser(testSettings, testContent);
		parsed.should.all.have.property('timestamp');
		parsed[0].timestamp.should.be.a('number');
	});
	
	it('returns nuggets with a text', function () {
		parsed = parser(testSettings, testContent);
		parsed.should.all.have.property('text');
		parsed[0].text.should.be.a('string');
	});

	it.skip('removes newlines from the text', function () {
		parsed = parser(testSettings, testContentNewlines);
		console.log(parsed);
		parsed[0].text.should.eql('Add the sum to the product of these three');
	});

	it('returns nuggets with an array of keywords', function () {
		parsed = parser(testSettings, testContentNoHref);
		parsed.should.all.have.property('keywords');
		parsed[0].keywords.should.be.an('array');
	});

	it('returns nuggets with an array of sanitized keywords', function () {
		parsed = parser(testSettings, testContentNoHref);
		parsed[0].keywords.should.eql([ 
			'open', 
			'the',
			'crate', 
			'but', 
			'dont', 
			'break', 
			'the',
			'glass' 
		]);
	});

	it('returns nuggets with an array of filtered keywords', function () {
		settings = _.extend({ filterKeywords: ['the'] }, testSettings);
		parsed = parser(settings, testContentNoHref);
		parsed[0].keywords.should.eql([ 
			'open', 
			'crate', 
			'but', 
			'dont', 
			'break', 
			'glass' 
		]);
	});

	it('throws if filterKeywords is not an array', function () {
		settings = _.extend({ filterKeywords: 'foo' }, testSettings);
		should.throw(function(){ parser(settings, testContentNoHref); });
	});

	it('returns nuggets with a href', function () {
		parsed = parser(testSettings, testContentHref);
		var isValidHref = function (href) {
			return href.indexOf('http://') > -1; 
		};
		parsed.should.all.have.property('href');
		parsed.should.all.satisfy(function (nugget) { 
			return isValidHref(nugget.href); 
		});
	});

	it('returns nuggets with empty href if none is found', function () {
		parsed = parser(testSettings, testContentNoHref);
		parsed[0].href.should.be.a('string');
		parsed[0].href.should.equal('');
	});
	
	it('returns nuggets with a tag', function () {
		parsed = parser(testSettings, testContent);
		parsed.should.all.have.property('tag');
		parsed[0].tag.should.be.a('string');
	});

	it('returns nuggets with the count of all nuggets', function () {
		parsed = parser(testSettings, testContent);
		parsed.should.all.have.property('count');
		parsed[0].count.should.be.a('number');
	});

	it('returns nuggets with an index of the count', function () {
		parsed = parser(testSettings, testContent);
		parsed.should.all.have.property('index');
		parsed[0].index.should.be.a('number');
	});

});