'use strict';

var chai = require('chai');
chai.use(require('chai-things'));
var should = chai.should();
var validator = require('validator');
var cheerio = require('cheerio');
var goldwasher = require('../lib/goldwasher');
var R = require('ramda');

var testOptions = {
  selector: 'h1, h2, a',
  url: 'http://www.google.com'
};
var testContent = '<h1>foo</h1><h1>bar</h1>';
var testContentHref = '<a href="/oak/strong"><h1>' +
                      'Oak is strong and also gives shade.' +
                      '</h1></a>' +

                      '<h2><a href="http://www.catsanddogs.com/hate">' +
                      'Cats and dogs each hate the other.' +
                      '</a></h2>' +

                      '<h2>Cats and dogs each hate the other.</h2>' +
                      '<a href="http://www.catsanddogs.com/hate">' +
                      'adjecent link' +
                      '</a>' +

                      '<a href="http://www.pipe.com/rust">' +
                      'The pipe began to rust while new.' +
                      '</a>';
var testContentNoHref = '<p><h1>' +
                        'Open the crate but don&#39;t break the glass.' +
                        '</h1></p>';
var testContentNewlines = '<h1>' +
                          '\n\nAdd the&nbsp; sum\n' +
                          ' to the\n\n product\n\n\n of these three\n' +
                          '</h1>';
var parsed;
var options;

describe('returned objects', function() {

  it('returns an array of nuggets', function() {
    parsed = goldwasher(testContent);
    parsed.should.be.an('array');
  });

  it('returns nuggets with a href', function() {
    parsed = goldwasher(testContentHref, testOptions);
    parsed.should.all.have.property('href');
    parsed.should.all.satisfy(function(nugget) {
      return validator.isURL(nugget.href);
    });
  });

  it('returns nuggets with a tag', function() {
    parsed = goldwasher(testContent, testOptions);
    parsed.should.all.have.property('tag');
    parsed[0].tag.should.be.a('string');
  });

  it('returns nuggets with a position of the count', function() {
    parsed = goldwasher(testContent, testOptions);
    parsed.should.all.have.property('position');
    parsed[0].position.should.be.a('number');
  });

  it('returns nuggets with the total nuggets count', function() {
    parsed = goldwasher(testContent, testOptions);
    parsed.should.all.have.property('total');
    parsed[0].total.should.be.a('number');
  });

  it('returns nuggets with a timestamp', function() {
    parsed = goldwasher(testContent, testOptions);
    parsed.should.all.have.property('timestamp');
    parsed[0].timestamp.should.be.a('number');
  });

  it('returns nuggets with a uuid', function() {
    parsed = goldwasher(testContent, testOptions);
    parsed.should.all.have.property('uuid');
    parsed[0].uuid.should.be.a('string');
    validator.isUUID(parsed[0].uuid).should.equal(true);
  });

  it('returns nuggets with a text', function() {
    parsed = goldwasher(testContent, testOptions);
    parsed.should.all.have.property('text');
    parsed[0].text.should.be.a('string');
  });

  it('returns nuggets with objects with keyword counts', function() {
    parsed = goldwasher(testContentNoHref, testOptions);
    parsed.should.all.have.property('keywords');
    parsed[0].keywords.should.be.an('array');
  });

  it('returns nuggets with objects of sanitized keywords', function() {
    parsed = goldwasher(testContentNoHref, testOptions);
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

  it('returns nuggets with empty href if none is found', function() {
    parsed = goldwasher(testContentNoHref, testOptions);
    should.equal(parsed[0].href, null);
  });

  it('returns nuggets with an object of filtered keywords', function() {
    options = R.merge({filterKeywords: ['the']}, testOptions);
    parsed = goldwasher(testContentNoHref, options);
    parsed[0].keywords.should.eql([
      {word: 'open', count: 1},
      {word: 'crate', count: 1},
      {word: 'but', count: 1},
      {word: 'dont', count: 1},
      {word: 'break', count: 1},
      {word: 'glass', count: 1}
    ]);
  });
});

describe('filtering', function() {

  it('removes newlines from the text', function() {
    parsed = goldwasher(testContentNewlines, testOptions);
    parsed[0].text.should.eql('Add the sum to the product of these three');
  });

  it('filters nuggets with stop texts', function() {
    var stopText = 'Oak is strong and also gives shade.';
    options = R.merge({filterTexts: [stopText]}, testOptions);
    parsed = goldwasher(testContentHref, options);
    parsed.should.not.contain.an.item
      .with.property('text', 'Oak is strong and also gives shade.');
  });

  it('can sanitize by a standard set of locale stop words', function() {
    options = R.merge({
      filterKeywords: ['the'],
      filterLocale: 'en'
    }, testOptions);
    parsed = goldwasher(testContentNoHref, options);
    parsed[0].keywords.should.eql([
      {word: 'open', count: 1},
      {word: 'crate', count: 1},
      {word: 'break', count: 1},
      {word: 'glass', count: 1}
    ]);
  });

  it('can search for strings', function(done) {
    options = R.merge({search: ['pipe began', 'crate']}, testOptions);
    parsed = goldwasher(testContentHref, options);
    parsed.length.should.equal(1);
    done();
  });

  it('can limit results', function(done) {
    options = R.merge({limit: 2}, testOptions);
    parsed = goldwasher(testContentHref, options);
    parsed.length.should.equal(2);
    done();
  });
});

describe('validation', function() {

  it('can accept a cheerio object as a dom input', function() {
    parsed = goldwasher(cheerio.load(testContent), testOptions);
    parsed.length.should.equal(2);
  });

  it('throws if filterTexts is not an array', function() {
    options = R.merge({filterTexts: 'foo'}, testOptions);
    should.throw(function() {
      goldwasher(testContentNoHref, options);
    });
  });

  it('throws if filterLocale is not a string', function() {
    options = R.merge({filterLocale: []}, testOptions);
    should.throw(function() {
      goldwasher(testContentNoHref, options);
    });
  });

  it('throws if filterKeywords is not an array', function() {
    options = R.merge({filterKeywords: 'foo'}, testOptions);
    should.throw(function() {
      goldwasher(testContentNoHref, options);
    });
  });

  it('does not fail if no url is provided', function() {
    parsed = goldwasher(testContentHref, {selector: 'h1'});
    parsed.should.all.have.property('href');
  });

  it('runs with all settings off', function(done) {
    var options = {
      total: false,
      href: false,
      keywords: false,
      position: false,
      tag: false,
      text: false,
      timestamp: false,
      uuid: false
    };
    parsed = goldwasher(testContentNoHref, options);
    parsed.length.should.equal(0);
    done();
  });
});

describe('conversion', function() {
  it('can output as XML', function() {
    parsed = goldwasher(testContentHref, {format: 'xml'});
    parsed.should.all.be.a('string');
  });
});