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
var testContentNone = '<h1>foo</h1><h1> </h1><h1></h1>';
var testContentAccents = '<h1>rødgrød</h1>';
var testContentIntegers = '<h1>0123456789</h1>';
var testContentDash = '<h1>hello-world</h1>';
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
                      '</a>' +

                      '<h1></h1>';
var testContentNoHref = '<p><h1>' +
                        'Open the crate but don&#39;t break the glass.' +
                        '</h1></p>';
var testContentNewlines = '<h1>' +
                          '\n\nAdd the&nbsp; sum\n' +
                          ' to the\n\n product\n\n\n of these three\n' +
                          '</h1>';
var testContentMeta = '<html><head>' +
                      '<title>foo title</title>' +
                      '<meta name="description" content="Foo Bar Baz">' +
                      '<meta name="keywords" content="foo, bar, baz">' +
                      '<meta name="author" content="Baz Barfoo">' +
                      '</head><body>' +
                      testContentHref +
                      '<div><a href="#"><h1>invalid link</h1></a></div>' +
                      '</body></html>';
var testContentXml = '<?xml version="1.0" encoding="UTF-8"?>' +
  '<foo><bar>' +
  '<baz>Oak is strong and also gives shade.</baz>' +
  '</bar><foo>';
var testContentDeepHref = '<h1><span><span>' +
  '<a href="http://www.catsanddogs.com/hate">' +
  'Cats and dogs each hate the other.' +
  '</a></span></span></h1>';
var parsed;
var options;

var validateNuggets = function(nuggets) {
  nuggets.should.all.have.property('timestamp');
  nuggets.should.all.have.property('text');
  nuggets.should.all.have.property('keywords');
  nuggets.should.all.have.property('href');
  nuggets.should.all.have.property('tag');
  nuggets.should.all.have.property('position');
  nuggets.should.all.have.property('source');
  nuggets.should.all.have.property('total');
  nuggets.should.all.have.property('uuid');
  nuggets.should.all.have.property('batch');
};

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

  it('returns nuggets with a deep href', function() {
    var testOptions = {
      selector: 'h1',
      url: 'http://www.catsanddogs.com'
    };
    parsed = goldwasher(testContentDeepHref, testOptions);
    parsed.should.all.have.property('href');
    parsed.should.all.satisfy(function(nugget) {
      return validator.isURL(nugget.href);
    });
    parsed[0].href.should.equal('http://www.catsanddogs.com/hate');
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

  it('preserves accented characters', function() {
    parsed = goldwasher(testContentAccents);
    parsed[0].keywords[0].word.should.equal('rødgrød');
  });

  it('preserves integers', function() {
    parsed = goldwasher(testContentIntegers);
    parsed[0].keywords[0].word.should.equal('0123456789');
  });

  it('replaces dashes with spaces', function() {
    parsed = goldwasher(testContentDash);
    parsed[0].keywords[0].word.should.equal('hello');
    parsed[0].keywords[1].word.should.equal('world');
  });

  it('works with strings with elements with no text', function() {
    parsed = goldwasher(testContentNone);
    parsed.should.be.an('array');
  });

  it('works with strings with elements with no text, for feeds', function() {
    parsed = goldwasher(testContentNone, { output: 'atom', url: 'foo.com' });
    parsed.should.contain('<?xml version="1.0" encoding="utf-8"?>');
  });

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

  it('throws on unknown input types', function(done) {
    should.throw(function() {
      parsed = goldwasher('foo');
    });

    should.throw(function() {
      parsed = goldwasher({foo: 'bar'});
    });

    should.throw(function() {
      parsed = goldwasher([{foo: 'bar'}]);
    });

    done();
  });

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
});

describe('conversion', function() {

  it('can receive an array of goldwasher objects as input', function(done) {
    parsed = goldwasher(testContentMeta, {url: 'foo.com'});
    var parsedArray = goldwasher(parsed);
    validateNuggets(parsedArray);
    done();
  });

  it('can receive XML as input', function(done) {
    parsed = goldwasher(testContentXml, {
      url: 'foo.com',
      selector: 'baz'
    });
    validateNuggets(parsed);
    parsed.length.should.equal(1);
    parsed[0].keywords.length.should.equal(7);
    parsed[0].keywords[0].word.should.equal('oak');

    done();
  });

  it('can output as XML', function() {
    parsed = goldwasher(testContentHref, {output: 'xml'});
    parsed.should.all.be.a('string');
    parsed.should.contain('<?xml version="1.0" encoding="UTF-8"?>');
    parsed.should.contain('<nugget>');
    parsed.should.contain('<href>/oak/strong</href>');
    parsed.should.contain('<tag>h1</tag>');
    parsed.should.contain('<text>Oak is strong and also gives shade.</text>');
    parsed.should.contain('<position>0</position>');
    parsed.should.contain('<timestamp>');
    parsed.should.contain('<uuid>');
    parsed.should.contain('<total>3</total>');
    parsed.should.contain('<keywords>');
    parsed.should.contain('<keyword>');
    parsed.should.contain('<source>');
    parsed.should.contain('<word>oak</word>');
    parsed.should.contain('<count>1</count>');
  });

  it('can output as Atom feed', function() {
    parsed = goldwasher(testContentMeta, {
      output: 'atom',
      url: 'foo.com'
    });

    parsed.should.all.be.a('string');
    parsed.should.contain('<?xml version="1.0" encoding="utf-8"?>');
    parsed.should.contain('<feed');
    parsed.should.contain('<title>foo title</title>');
    parsed.should.contain('<subtitle>Foo Bar Baz</subtitle>');
    parsed.should.contain('<link rel="alternate" href="foo.com"/>');
    parsed.should.contain('<name>Baz Barfoo</name>');
    parsed.should.contain('<category term="oak">');
    parsed.should.contain('<entry>');
    parsed.should.contain(
      '<title type="html">' +
      '<![CDATA[Oak is strong and also gives shade.]]>' +
      '</title>'
    );
    parsed.should.contain(
      '<summary type="html">' +
      '<![CDATA[Oak is strong and also gives shade.]]>' +
      '</summary>'
    );
    parsed.should.contain('<link href="foo.com/oak/strong">');
    parsed.should.contain('<id>foo.com/oak/strong</id>');
  });

  it('can output as RSS feed', function() {
    parsed = goldwasher(testContentMeta, {
      output: 'rss',
      url: 'foo.com'
    });

    parsed.should.all.be.a('string');
    parsed.should.contain('<?xml version="1.0" encoding="utf-8"?>');
    parsed.should.contain('<channel>');
    parsed.should.contain('<title>foo title</title>');
    parsed.should.contain('<description>Foo Bar Baz</description>');
    parsed.should.contain('<link>foo.com</link>');
    parsed.should.contain('<name>Baz Barfoo</name>');
    parsed.should.contain('<category>oak</category>');
    parsed.should.contain('<item>');
    parsed.should.contain(
      '<title><![CDATA[Oak is strong and also gives shade.]]></title>'
    );
    parsed.should.contain(
      '<description>' +
      '<![CDATA[Oak is strong and also gives shade.]]>' +
      '</description>'
    );
    parsed.should.contain('<link>foo.com/oak/strong</link>');
    parsed.should.contain('<guid>foo.com/oak/strong</guid>');
  });
});