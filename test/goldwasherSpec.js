'use strict';
var chai = require('chai');
chai.use(require('chai-things'));
var should = chai.should();
var _ = require('underscore');
var validator = require('validator');
var cheerio = require('cheerio');
var goldwasher = require('../lib/goldwasher');

var testOptions = {
  targets: 'h1, h2, a',
  url: 'http://www.google.com'
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
var options;

describe('goldwasher', function () {

  it('returns an array of nuggets', function () {
    parsed = goldwasher(testOptions, testContent);
    parsed.should.be.an('array');
  });

  it('returns nuggets with a timestamp', function () {
    parsed = goldwasher(testOptions, testContent);
    parsed.should.all.have.property('timestamp');
    parsed[0].timestamp.should.be.a('number');
  });

  it('returns nuggets with a text', function () {
    parsed = goldwasher(testOptions, testContent);
    parsed.should.all.have.property('text');
    parsed[0].text.should.be.a('string');
  });

  it('removes newlines from the text', function () {
    parsed = goldwasher(testOptions, testContentNewlines);
    parsed[0].text.should.eql('Add the sum to the product of these three');
  });

  it('filters nuggets with stop texts', function () {
    var stopText = 'Oak is strong and also gives shade.';
    options = _({filterTexts: [stopText]}).extend(testOptions);
    parsed = goldwasher(options, testContentHref);
    parsed.should.not.contain.an.item
      .with.property('text', 'Oak is strong and also gives shade.');
  });

  it('throws if filterTexts is not an array', function () {
    options = _({filterTexts: 'foo'}).extend(testOptions);
    should.throw(function () {
      goldwasher(options, testContentNoHref);
    });
  });

  it('throws if filterLocale is not a string', function () {
    options = _({filterLocale: []}).extend(testOptions);
    should.throw(function () {
      goldwasher(options, testContentNoHref);
    });
  });

  it('throws if filterKeywords is not an array', function () {
    options = _({filterKeywords: 'foo'}).extend(testOptions);
    should.throw(function () {
      goldwasher(options, testContentNoHref);
    });
  });

  it('returns nuggets with objects with keyword counts', function () {
    parsed = goldwasher(testOptions, testContentNoHref);
    parsed.should.all.have.property('keywords');
    parsed[0].keywords.should.be.an('array');
  });

  it('returns nuggets with objects of sanitized keywords', function () {
    parsed = goldwasher(testOptions, testContentNoHref);
    parsed[0].keywords.should.eql([
      {word: 'open', count: 1},
      {word: 'the', count: 2},
      {word: 'crate', count: 1},
      {word: 'but', count: 1},
      {word: 'dont', count: 1},
      {word: 'break', count: 1},
      {word: 'glass', count: 1}
    ]);
  });

  it('can sanitize by a standard set of locale stop words', function () {
    options = _({
      filterKeywords: ['the'],
      filterLocale: 'en'
    }).extend(testOptions);
    parsed = goldwasher(options, testContentNoHref);
    parsed[0].keywords.should.eql([
      {word: 'open', count: 1},
      {word: 'crate', count: 1},
      {word: 'break', count: 1},
      {word: 'glass', count: 1}
    ]);
  });

  it('returns nuggets with an object of filtered keywords', function () {
    options = _({filterKeywords: ['the']}).extend(testOptions);
    parsed = goldwasher(options, testContentNoHref);
    parsed[0].keywords.should.eql([
      {word: 'open', count: 1},
      {word: 'crate', count: 1},
      {word: 'but', count: 1},
      {word: 'dont', count: 1},
      {word: 'break', count: 1},
      {word: 'glass', count: 1}
    ]);
  });

  it('returns nuggets with a href', function () {
    parsed = goldwasher(testOptions, testContentHref);
    parsed.should.all.have.property('href');
    parsed.should.all.satisfy(function (nugget) {
      return validator.isURL(nugget.href);
    });
  });

  it('does not fail if no url is provided', function () {
    parsed = goldwasher({targets: 'h1'}, testContentHref);
    parsed.should.all.have.property('href');
  });

  it('returns nuggets with empty href if none is found', function () {
    parsed = goldwasher(testOptions, testContentNoHref);
    should.equal(parsed[0].href, null);
  });

  it('returns nuggets with a tag', function () {
    parsed = goldwasher(testOptions, testContent);
    parsed.should.all.have.property('tag');
    parsed[0].tag.should.be.a('string');
  });

  it('returns nuggets with a position of the count', function () {
    parsed = goldwasher(testOptions, testContent);
    parsed.should.all.have.property('position');
    parsed[0].position.should.be.a('number');
  });

  it('can accept a cheerio object as a dom input', function () {
    parsed = goldwasher(testOptions, cheerio.load(testContent));
    parsed.length.should.equal(2);
  });

});