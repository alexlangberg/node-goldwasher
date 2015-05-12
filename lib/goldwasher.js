// jscs:disable requirePaddingNewLinesAfterBlocks
// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
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
 * Determines whether passed html is a string or a cheerio object.
 * Ensures that we always return a cheerio object.
 * @param {string|object} html
 * @returns {object}
 */
var getHtml = function(html) {
  if (R.is(String, html)) {
    return cheerio.load(html);
  } else {
    return html;
  }
};

/**
 * Gets an object with the default options.
 * @returns {object}
 */
var getDefaultOptions = function() {
  return {
    filterKeywords: [],
    filterLocale: false,
    filterTexts: [],
    output: 'json',
    href: true,
    keywords: true,
    limit: null,
    position: true,
    search: [],
    selector: 'h1, h2, h3, h4, h5, h6, p',
    tag: true,
    text: true,
    timestamp: true,
    total: true,
    url: null,
    uuid: true
  };
};

/**
 * Validates options passed by the user and merges them with defaults
 * @param {object} options
 * @returns {object}
 */
var getOptions = function(options) {
  var schema = Joi.object().keys({
    filterKeywords: Joi.array(),
    filterLocale: Joi.string().valid('en'),
    filterTexts: Joi.array(),
    output: Joi.string().valid('json', 'xml', 'atom', 'rss'),
    href: Joi.boolean(),
    keywords: Joi.boolean(),
    limit: Joi.number().integer(),
    position: Joi.boolean(),
    search: Joi.array(),
    selector: Joi.string(),
    tag: Joi.boolean(),
    text: Joi.boolean(),
    timestamp: Joi.boolean(),
    total: Joi.boolean(),
    url: Joi.string(),
    uuid: Joi.boolean()
  });

  // create default options object if none is provided or test schema
  if (options === undefined) {
    options = {};
  } else {
    Joi.validate(options, schema, function(error) {
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
 * @param {object} domObject
 * @param {string} url
 * @returns {string}
 */
var getClosestHref = function(domObject, url) {
  var href = null;

  // has HREF itself
  if (domObject[0].name && domObject[0].name === 'a') {
    href = domObject.attr('href');
  }

  // child node that has a HREF
  else if (domObject.children('a').length > 0) {
    href = domObject.children('a').attr('href');
  }

  // parent that has a HREF
  else if (domObject.closest('a').length > 0) {
    href = domObject.closest('a').attr('href');
  }

  // adjecent node that has a HREF
  else if (domObject.next('a').length > 0) {
    href = domObject.next('a').attr('href');
  }

  // check for relative URLs and append URL if relative
  if (url && href && !v.isURL(href)) {
    href = url + href;
  }

  return href;
};

/**
 * Gets the text of a cheerio DOM object.
 * @param {object} domObject
 * @returns {string}
 */
var getText = function(domObject) {
  var text = domObject.text();
  return S(text)
    .unescapeHTML()
    .stripTags()
    .collapseWhitespace()
    .trim()
    .s;
};

/**
 * Gets the contant of a meta tag.
 * @param {object} $
 * @param {string} name
 * @returns {string|jQuery}
 */
var getMetaTag = function($, name) {
  return $('meta').filter(function() {
    return $(this).attr('name') === name;
  }).map(function() {
    return $(this).attr('content');
  }).get().join();
};

/**
 * Returns a slugified version of the text or an array of texts.
 * Often used for comparison.
 * @param {string|string[]} text
 * @returns {string}
 */
var slugify = function(text) {
  if (R.isArrayLike(text)) { return R.map(slugify, text); }
  return S(text).slugify().s;
};

/**
 * Checks whether a list contains provided text.
 * @param {string} text
 * @param {string[]} list
 * @returns {boolean}
 */
var slugifiedArrayContains = function(text, list) {
  return !!R.contains(slugify(text), slugify(list));
};

/**
 * Checks whether a text contains any text in a list
 * @param {string} text
 * @param {string[]} list
 * @returns {boolean}
 */
var slugifiedStringContains = function(text, list) {
  return !!R.filter(function(listItem) {
    return S(slugify(text)).contains(slugify(listItem));
  }, list).length;
};

/**
 * Reversed slugifiedArrayContains.
 * @param {string} text
 * @param {string[]} blacklist
 * @returns {boolean}
 */
var slugifiedFilter = function(text, blacklist) {
  return !slugifiedArrayContains(text, blacklist);
};

/**
 * Returns array of keywords not in the blacklist.
 * @param {string[]} keywords
 * @param {string[]} blacklist
 * @returns {string[]}
 */
var filterKeywords = function(keywords, blacklist) {
  return R.filter(function(item) {
    return slugifiedFilter(item, blacklist);
  }, keywords);
};

/**
 * Counts keyword occurences in text.
 * @param {string} text
 * @param {string[]} keywords
 * @returns {object[]}
 */
var countKeywords = function(text, keywords) {
  return R.map(function(keyword) {
    return {
      word: keyword,
      count: S(text).slugify().count(keyword)
    };
  }, keywords);
};

/**
 * Get keywords from text.
 * @param {string} text
 * @param {string[]} blacklist
 * @returns {string[]}
 */
var getKeywords = function(text, blacklist) {
  var keywords = R.uniq(slugify(text).split('-'));

  return countKeywords(text, filterKeywords(keywords, blacklist));
};

/**
 * Get meta data for building feeds.
 * @param {object} $
 * @param {object} options
 * @returns {object}
 */
var getMeta = function($, options) {
  return {
    author: getMetaTag($, 'author'),
    description: getMetaTag($, 'description'),
    url: options.url,
    time: Date.now(),
    title: getText($('title'))
  };
};

/**
 * Get all keywords from an array of nuggets.
 * @param {object[]}
 */
var getNuggetsKeywordStrings = R.pipe(
  R.map(function(nugget) { return nugget.keywords; }),
  R.flatten(),
  R.map(function(keyword) { return keyword.word; }),
  R.uniq()
);

/**
 * Converts a batch of nuggets to a string of XML.
 * @param nuggets
 * @returns {string}
 */
var convertToXml = function(nuggets) {
  nuggets = R.forEach(function(nugget) {
    nugget.keyword = nugget.keywords;
    delete nugget.keywords;
  }, nuggets);

  return js2xmlparser('goldwasher', {nugget: nuggets});
};

/**
 * Converts an array of nuggets to a feed.
 * @param {object[]} nuggets
 * @param {object} meta
 * @param {string} output
 * @returns {xml}
 */
var convertToFeed = function(nuggets, meta, output) {
  var feed = new Feed({
    description: meta.description,
    link: meta.url,
    title: meta.title
  });

  R.forEach(function(keyword) {
    feed.addCategory(keyword);
  }, getNuggetsKeywordStrings(nuggets));

  R.forEach(function(nugget) {
    feed.addItem({
      author: [{
        name: meta.author,
        link: meta.url
      }],
      date: new Date(),
      description: nugget.text,
      guid: nugget.href,
      link: nugget.href,
      title:  nugget.text
    });
  }, nuggets);

  return feed.render(output);
};

/**
 * Receives html as string or cheerio DOM, along with optional options object.
 * Outputs an array of objects in goldwasher output.
 * @param {string|object} html
 * @param {object} userOptions
 * @returns {object[]}
 */
var goldwasher = function(html, userOptions) {
  var options = getOptions(userOptions);
  var $ = getHtml(html);
  var meta = getMeta($, options);
  var scraped = $(options.selector);
  var nuggets = [];

  scraped.each(function(index) {
    var nugget = {};
    var text = getText($(this));
    var localeStopwords;
    var stopwords;

    if (options.limit && index >= options.limit) {
      return;
    }

    if (slugifiedArrayContains(text, options.filterTexts)) {
      return;
    }

    if (options.search.length > 0) {
      if (!slugifiedStringContains(text, options.search)) {
        return;
      }
    }

    if (options.href) {
      nugget.href = getClosestHref($(this), options.url);
    }

    if (options.keywords) {
      stopwords = options.filterKeywords;

      if (options.filterLocale) {
        localeStopwords = require(
          '../stop_words/' + options.filterLocale + '.json'
        );
        stopwords = R.concat(stopwords, localeStopwords.stopWords);
      }

      nugget.keywords = getKeywords(text, stopwords);
    }

    if (options.tag) {
      nugget.tag = $(this)[0].name;
    }

    if (options.text) {
      nugget.text = text;
    }

    if (options.position) {
      nugget.position = index;
    }

    if (options.timestamp) {
      nugget.timestamp = meta.time;
    }

    if (options.uuid) {
      nugget.uuid = uuid.v1();
    }

    // return if object is not empty
    if (R.keys(nugget).length > 0) {
      nuggets.push(nugget);
    }
  });

  if (options.total) {
    nuggets = R.forEach(function(nugget) {
      nugget.total = nuggets.length;
    }, nuggets);
  }

  if (options.output === 'xml') {
    return convertToXml(nuggets);
  }

  if (options.output === 'atom') {
    return convertToFeed(nuggets, meta, 'atom-1.0');
  }

  if (options.output === 'rss') {
    return convertToFeed(nuggets, meta, 'rss-2.0');
  }

  return nuggets;
};

module.exports = goldwasher;