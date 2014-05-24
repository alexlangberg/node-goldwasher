'use strict';

var should; should = require('./testSetup').should();
var parser = require('../lib/parser');
var testSettings = { 
	url:'http://www.google.com', 
	targets:'h1, h2, a' 
};
var testContent = '<h1>foo</h1><h1>bar</h1>';
var testContentBig = '<a href="/oak/strong"><h1>';
		testContentBig += 'Oak is strong and also gives shade.';
		testContentBig += '</h1></a>';
		testContentBig += '<h2><a href="http://www.catsanddogs.com/hate">';
		testContentBig += 'Cats and dogs each hate the other.';
		testContentBig += '</a></h2>';
		testContentBig += '<a href="http://www.pipe.com/rust">';
		testContentBig += 'The pipe began to rust while new.';
		testContentBig += '</a>';
var testContentNoHref = '<p><h1>';
		testContentNoHref += 'Open the crate but don\'t break the glass.';
		testContentNoHref += '</h1></p>';
var parsed;

//console.log(parsed);

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

	it.skip('returns nuggets with an array of keywords', function () {
		parsed = parser(testSettings, testContent);
		parsed.should.all.have.property('keywords');
		parsed[0].keywords.should.be.an('array');
	});

	it('returns nuggets with a href', function () {
		parsed = parser(testSettings, testContentBig);
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