// jscs:disable requirePaddingNewLinesAfterBlocks
'use strict';

var v = require('validator');
var S = require('string');
var R = require('ramda');
var Joi = require('joi');
var cheerio = require('cheerio');
var uuid = require('node-uuid');
var js2xmlparser = require('js2xmlparser');
var Feed = require('feed');

/**
 * Gets an object with the default options.
 * @returns {{
 *  filterKeywords: Array,
 *  filterLocale: boolean,
 *  filterTexts: Array,
 *  limit: null,
 *  output: string,
 *  search: Array,
 *  selector: string,
 *  url: null
 *}}
 */
var getDefaultOptions = function() {
  return {
    filterKeywords: [],
    filterLocale: false,
    filterTexts: [],
    limit: null,
    output: 'json',
    search: [],
    selector: 'h1, h2, h3, h4, h5, h6, p',
    url: null
  };
};

/**
 * Gets the validation schema for Joi.
 * @returns {*|Array}
 */
var getOptionsSchema = function() {
  return Joi.object().keys({
    filterKeywords: Joi.array(),
    filterLocale: Joi.string().valid('en'),
    filterTexts: Joi.array(),
    limit: Joi.number().integer(),
    output: Joi.string().valid('json', 'xml', 'atom', 'rss'),
    search: Joi.array(),
    selector: Joi.string(),
    url: Joi.string(),
    contractAdjecent: Joi.boolean()
  });
};

/**
 * Validates options passed by the user and merges them with defaults
 * @param options
 * @returns {Object|*}
 */
var getOptions = function(options) {
  // create default options object if none is provided or test schema
  if (options === undefined) {
    options = {};
  } else {
    Joi.validate(options, getOptionsSchema(), function(error) {
      if (error) {
        throw error;
      }
    });
  }

  // overwrite default options if options object is provided
  return R.merge(getDefaultOptions(), options);
};

/**
 * Finds the closest <a> tag and returns the HREF of it.
 * Also converts relative URLs to absolute.
 * @param domObject
 * @param url
 * @returns {*}
 */
var getCheerioClosestHref = function(domObject, url) {
  var href = null;

  // has HREF itself
  if (domObject[0].name && domObject[0].name === 'a') {
    href = domObject.attr('href');
  }

  // child node that has a HREF
  else if (domObject.children('a').length > 0) {
    href = domObject.children('a').attr('href');
  }

  // successor node that has a HREF
  else if (domObject.find('a').length > 0) {
    href = domObject.find('a').attr('href');
  }

  // parent that has a HREF
  else if (domObject.closest('a').length > 0) {
    href = domObject.closest('a').attr('href');
  }

  // adjecent node that has a HREF
  else if (domObject.next('a').length > 0) {
    href = domObject.next('a').attr('href');
  }

  // no valid href here, return url
  if (href === '#') {
    return url;
  }

  // check for relative URLs and append URL if relative
  if (url &&
      href &&
      !v.isURL(href) &&
      href.indexOf('http') !== 0) {
    href = url + href;
  }

  // if still no href, just return url
  if (!href) {
    return url;
  }

  return href;
};

/**
 * Gets the text of a cheerio DOM object.
 * @param text
 * @returns {String.s|*}
 */
var sanitizeText = function(text) {
  return S(text)
    .unescapeHTML()
    .stripTags()
    .collapseWhitespace()
    .s
    .trim();
};

/**
 * Remove special characters
 * Courtesy of Seagull: http://stackoverflow.com/a/26482650
 * @param text
 * @returns {string}
 */
var removeSpecials = function(text) {
  var whitelist = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', ' '];
  var spacelist = ['-'];
  var lower = text.toLowerCase();
  var upper = text.toUpperCase();
  var result = '';

  for (var i = 0; i < lower.length; ++i) {
    if (lower[i] !== upper[i] || whitelist.indexOf(lower[i]) > -1) {
      result += (spacelist.indexOf(lower[i]) > -1 ? ' ' : text[i]);
    }
  }

  return result;
};

/**
 * Simplifies a text to make comparisons easy.
 * @param text
 * @returns {*}
 */
var simplifyText = function(text) {
  var result;

  if (R.isArrayLike(text)) {
    return R.map(simplifyText, text);
  }

  result = removeSpecials(text).toLowerCase();
  result = S(result).collapseWhitespace().s.trim();
  return result;
};

/**
 * Gets the contant of a meta tag.
 * @param $
 * @param name
 * @returns {*|string|String|jQuery}
 */
var getCheerioMetaTag = function($, name) {
  return $('meta').filter(function() {
    return $(this).attr('name') === name;
  }).map(function() {
    return $(this).attr('content');
  }).get().join();
};

/**
 * Counts keyword occurences in text.
 * @param text
 * @param keywords
 * @returns {Array|*}
 */
var countKeywords = function(text, keywords) {
  return R.map(function(keyword) {
    return {
      word: keyword,
      count: S(text).count(keyword)
    };
  }, keywords);
};

/**
 * Get keywords from text.
 * @param text
 * @param stopWords
 * @returns {Array|*}
 */
var getKeywordsFromText = function(text, stopWords) {
  var simplifiedText = simplifyText(text);
  var keywords = R.uniq(simplifiedText.split(' '));
  var filtered = R.difference(keywords, stopWords);

  return countKeywords(simplifiedText, filtered);
};

/**
 * Get meta data from cheerio for building feeds.
 * @param $
 * @param url
 * @returns {{
 *  author: (*|string|String|jQuery),
 *  description: (*|string|String|jQuery),
 *  url: *,
 *  time: (number|*),
 *  title: (String.s|*)
 *}}
 */
var getCheerioMeta = function($, url) {
  return {
    author: getCheerioMetaTag($, 'author'),
    description: getCheerioMetaTag($, 'description'),
    url: url,
    time: Date.now(),
    title: sanitizeText($('title').text())
  };
};

/**
 * Get meta data from nuggets for building feeds.
 * @param nuggets
 * @returns {{
 *   url: string,
 *   time: (timestamp|*|Number|number)
 * }}
 */
var getNuggetsMeta = function(nuggets) {
  return {
    url: nuggets[0].source,
    time: nuggets[0].timestamp
  };
};

/**
 * Get all keywords from an array of nuggets.
 * @type {Function|*}
 */
var getNuggetsKeywordTexts = R.pipe(
  R.map(function(nugget) { return nugget.keywords; }),
  R.flatten(),
  R.map(function(keyword) { return keyword.word; }),
  R.uniq()
);

/**
 * Converts a batch of nuggets to a string of XML.
 * @param batch
 * @returns {*}
 */
var outputToXml = function(batch) {
  var nuggets = R.forEach(function(nugget) {
    nugget.temp = nugget.keywords;
    nugget.keywords = {};
    nugget.keywords.keyword = [];
    nugget.keywords.keyword.push(nugget.temp);
    delete nugget.temp;
  }, batch.nuggets);

  return js2xmlparser('goldwasher', {nugget: nuggets});
};

/**
 * Converts an array of nuggets to a feed.
 * @param batch
 * @param output
 * @returns {*}
 */
var outputToFeed = function(batch, output) {
  var feed = new Feed({
    description: batch.meta.description,
    link: batch.meta.url,
    title: batch.meta.title
  });

  R.forEach(function(keyword) {
    feed.addCategory(keyword);
  }, getNuggetsKeywordTexts(batch.nuggets));

  R.forEach(function(nugget) {
    feed.addItem({
      author: [{
        name: batch.meta.author,
        link: batch.meta.url
      }],
      date: new Date(),
      description: nugget.text,
      guid: nugget.href,
      link: nugget.href,
      title: nugget.text
    });
  }, batch.nuggets);

  return feed.render(output);
};

/**
 * returns true if "text" contains any of the texts in "list"
 * @param text
 * @param list
 * @returns {boolean}
 */
var textSearch = function(text, list) {
  return !!R.filter(function(listItem) {
    return S(text).contains(listItem);
  }, list).length;
};

/**
 * returns true if nugget should be removed.
 * @param text
 * @param stopTexts
 * @param index
 * @param limit
 * @param search
 * @returns {boolean}
 */
var nuggetFilter = function(text, stopTexts, search) {
  if (R.difference([text], stopTexts).length === 0) {
    return true;
  }

  if (search.length > 0) {
    if (!textSearch(text, search)) {
      return true;
    }
  }
};

/**
 * Gets all stop words.
 * @param filterKeywords
 * @param filterLocale
 * @returns {*}
 */
var getStopwords = function(filterKeywords, filterLocale) {
  var stopWords = filterKeywords;
  var localeJson;

  if (filterLocale) {
    localeJson = require('../stop_words/' + filterLocale + '.json');
    stopWords = R.concat(
      stopWords,
      localeJson.stopWords);
  }

  stopWords = simplifyText(stopWords);

  return stopWords;
};

/**
 * Converts a cheerio object to a batch of nuggets.
 * @param $
 * @param options
 * @returns {{
 *   meta: {
 *     author: (*|string|String|jQuery),
 *     description: (*|string|String|jQuery),
 *     url: *,
 *     time: (number|*),
 *     title: (String.s|*)},
 *   nuggets: Array
 * }}
 */
var inputFromCheerio = function($, options) {
  var meta = getCheerioMeta($, options.url);
  var scraped = $(options.selector);
  var nuggets = [];
  var batchUuid = uuid.v1();
  var simpleSearch = simplifyText(options.search);
  var simpleStopTexts = simplifyText(options.filterTexts);
  var simpleStopWords = getStopwords(
    options.filterKeywords,
    options.filterLocale
  );

  scraped.each(function() {
    var nugget = {};
    var current = $(this)[0];
    var prev = $(this).prev()[0];
    var next = $(this).next()[0];
    var text = $(this).text();

    if (options.contractAdjecent) {
      if (next && next.name && next.name === current.name) {
        return;
      } else if (prev && prev.name && prev.name === current.name) {
        var siblings = $(this).prevAll(current.name);
        siblings.each(function() {
          text = $(this).text() + ' ' + text;
        });
      }
    }

    text = sanitizeText(text);
    var simpleText = simplifyText(text);

    if (simpleText === '' || simpleText === null) {
      return;
    }

    if (nuggetFilter(
        simpleText,
        simpleStopTexts,
        simpleSearch
      )) {
      return;
    }

    nugget.source = options.url;
    nugget.href = getCheerioClosestHref($(this), options.url);
    nugget.tag = $(this)[0].name;
    nugget.text = text;
    nugget.timestamp = meta.time;
    nugget.uuid = uuid.v1();
    nugget.batch = batchUuid;
    nugget.keywords = getKeywordsFromText(text, simpleStopWords);

    nuggets.push(nugget);
  });

  if (options.limit) {
    nuggets = R.take(options.limit, nuggets);
  }

  var index = 0;
  nuggets = R.forEach(function(nugget) {
    nugget.total = nuggets.length;
    nugget.position = index;
    index++;
  }, nuggets);

  return {
    meta: meta,
    nuggets: nuggets
  };
};

/**
 * Detects the type of input. Could be improved a lot.
 * @param input
 * @returns {string}
 */
var detectInputType = function(input) {
  if (R.is(String, input)) {

    // detect if XML
    if (S(input).contains('<?xml version="1.0" encoding="UTF-8"?>')) {
      return 'xml';
    }

    // detect if HTML. Lamest detector ever? Pretty much the default anyway.
    if (S(input).contains('<')) {
      return 'html';
    }

    throw new Error('Could not determine input type. (string)');
  } else {

    //if input is not string, it must be a goldwasher array or cheerio object
    if (R.has('parseHTML', input)) {
      return 'cheerio';
    }

    if (R.isArrayLike(input)) {
      if (R.has('timestamp', input[0])) {
        return 'array';
      }
    }

    throw new Error('Could not determine input type. (cheerio/array)');
  }
};

/**
 * Receives html as string or cheerio DOM, along with optional options object.
 * Outputs an array of objects in goldwasher output.
 * @param input
 * @param userOptions
 * @returns {*}
 */
var goldwasher = function(input, userOptions) {
  var batch;
  var options = getOptions(userOptions);
  options.input = detectInputType(input);

  // first we get the batch of nuggets and meta data
  if (options.input === 'array') {
    batch = {
      meta: getNuggetsMeta(input),
      nuggets: input
    };
  } else {
    if (options.input !== 'cheerio') {
      batch = inputFromCheerio(cheerio.load(input), options);
    } else {
      batch = inputFromCheerio(input, options);
    }
  }

  // now that we have the batch of nuggets, determine how to output them
  if (options.output === 'xml') {
    return outputToXml(batch);
  }

  if (options.output === 'atom') {
    return outputToFeed(batch, 'atom-1.0');
  }

  if (options.output === 'rss') {
    return outputToFeed(batch, 'rss-2.0');
  }

  // else default to json
  return batch.nuggets;
};

module.exports = goldwasher;