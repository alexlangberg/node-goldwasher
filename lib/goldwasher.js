'use strict';

//var _ = require('underscore');
var v = require('validator');
var S = require('string');
var R = require('ramda');
var Joi = require('joi');
var cheerio = require('cheerio');

//var sanitizeText = function (options, text) {
//  // make text lowercase
//  var sanitized = text.toLowerCase();
//  // trim text
//  sanitized = sanitized.trim();
//  // replace ' with nothing
//  sanitized = sanitized.replace(/[']/g, '');
//  // convert anything but alphanumeric characters to spaces
//  sanitized = sanitized.replace(/[^A-ZÆØÅa-zæøå0-9 ]/g, ' ');
//  return sanitized;
//};
//
//var getText = function (options, text) {
//  // trim text
//  var sanitized = text.trim();
//  // remove newlines
//  sanitized = sanitized.replace(/(\r\n|\n|\r)/gm, ' ');
//  // replace double spaces with single spaces
//  sanitized = sanitized.replace(/\s+/g, ' ');
//  return sanitized;
//};
//
//var isStopText = function (options, text) {
//  // remove stop texts
//  if (typeof options.filterTexts !== 'undefined') {
//    if (options.filterTexts instanceof Array) {
//      return _(options.filterTexts).contains(text);
//    }
//    else {
//      throw new Error('filterTexts must be an array.');
//    }
//  }
//};
//
//var getStopwords = function (options) {
//  var stopWords = [];
//  // add locale stop words
//  if (_(options).has('filterLocale')) {
//    if (_(options.filterLocale).isString()) {
//      var localeStopWords = require(
//        '../stop_words/' + options.filterLocale + '.json'
//      );
//      stopWords = stopWords.concat(localeStopWords.stopWords);
//    }
//    else {
//      throw new Error('filterLocale must be a string.');
//    }
//  }
//  // add custom stop words
//  if (_(options).has('filterKeywords')) {
//    if (_(options.filterKeywords).isArray()) {
//      stopWords = stopWords.concat(options.filterKeywords);
//    }
//    else {
//      throw new Error('filterKeywords must be an array.');
//    }
//  }
//  stopWords = _(stopWords).map(
//    function (word) {
//      return sanitizeText(options, word);
//    }
//  );
//  return stopWords;
//};
//
//var getKeywords = function (options, text) {
//  // make text lowercase
//  var sanitized = sanitizeText(options, text);
//  // split sanitized text into an array of keywords
//  var keywords = sanitized.split(' ');
//  // remove empty items
//  keywords = _(keywords).compact();
//  // remove stop words
//  var stopWords = getStopwords(options);
//  keywords = _(keywords).difference(stopWords);
//  keywords = _(keywords).countBy(function (word) {
//    return word;
//  });
//  keywords = _(keywords).map(function (value, key) {
//    return {
//      word: key,
//      count: value
//    };
//  });
//  return keywords;
//};
//
//var getHref = function (options, domObject) {
//  var link = null;
//  // if the object is a link itself
//  if (domObject[0].name && domObject[0].name === 'a') {
//    link = domObject.attr('href');
//  }
//  // if the object has a child node that is a link
//  else if (domObject.children('a').length > 0) {
//    link = domObject.children('a').attr('href');
//  }
//  // if the object has an adjecent node that is a link
//  else if (domObject.closest('a').length > 0) {
//    link = domObject.closest('a').attr('href');
//  }
//  // check for relative urls and append baseUrl if relative
//  if (link && !v.isURL(link)) {
//    if (_(options).has('url')) {
//      link = options.url + link;
//    }
//  }
//  return link;
//};

var getDom = function(dom) {
  if (R.is(String, dom)) {
    return cheerio.load(dom);
  } else {
    return dom;
  }
};

var getOptions = function(options) {
  var schema = Joi.object().keys({
    count: Joi.boolean(),
    filterKeywords: Joi.array(),
    filterLocale: Joi.string().max(2),
    filterTexts: Joi.array(),
    href: Joi.boolean(),
    keywords: Joi.boolean(),
    position: Joi.boolean(),
    tag: Joi.boolean(),
    targets: Joi.string(),
    text: Joi.boolean(),
    timestamp: Joi.boolean(),
    url: Joi.string()
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
  return R.merge({
    count: true,
    filterKeywords: false,
    filterLocale: false,
    filterTexts: false,
    href: true,
    keywords: true,
    position: true,
    tag: true,
    targets: 'h1, h2, h3, h4, h5, h6, p',
    text: true,
    timestamp: true,
    url: null
  }, options);
};

var getClosestHref = function(domObject, url) {
  var link = null;

  // link itself
  if (domObject[0].name && domObject[0].name === 'a') {
    link = domObject.attr('href');
  }

  // child node that is a link
  else if (domObject.children('a').length > 0) {
    link = domObject.children('a').attr('href');
  }

  // parent that is a link
  else if (domObject.closest('a').length > 0) {
    link = domObject.closest('a').attr('href');
  }

  // adjecent node that is a link
  else if (domObject.next('a').length > 0) {
    link = domObject.next('a').attr('href');
  }

  // check for relative urls and append baseUrl if relative
  if (url && link && !v.isURL(link)) {
    link = url + link;
  }

  return link;
};

var getText = function(domObject) {
  var text = domObject.text();
  return S(text)
    .unescapeHTML()
    .stripTags()
    .collapseWhitespace()
    .trim()
    .s;
};

var slugifiedContains = function(text, textArray) {
  var slugifyText = S(text).slugify().s;
  var slugifyArray = R.map(function(text) {
    return S(text).slugify().s;
  });

  return !!R.contains(slugifyText, slugifyArray(textArray));
};

var getKeywords = function(text, filterArray) {
  var keywords = S(text)
    .slugify()
    .s
    .split('-');

  //var filteredKeywords = R.filter(slugifiedContains());

  var countKeywords = R.map(function(keyword) {
    //if (filterArray) {
    //  if (slugifiedContains(keyword, filterArray)) return;
    //}
    return {
      word: keyword,
      count: S(text).slugify().count(keyword)
    };
  });

  return countKeywords(R.uniq(keywords));
};

var goldwasher = function(dom, userOptions) {
  var options = getOptions(userOptions);
  var $ = getDom(dom);
  var nuggets = [];
  var scraped = $(options.targets);
  var time = Date.now();

  scraped.each(function(index) {
    var nugget = {};
    var text = getText($(this));

    if (options.filterTexts) {
      if (slugifiedContains(text, options.filterTexts)) {
        return;
      }
    }

    if (options.href) {
      nugget.href = getClosestHref($(this), options.url);
    }

    if (options.keywords) {
      nugget.keywords = getKeywords(text, options.filterKeywords);
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
      nugget.timestamp = time;
    }

    nuggets.push(nugget);
  });

  return nuggets;
};

module.exports = goldwasher;

//var goldwasher = function (options, dom) {
//  var $;
//  if (_.isFunction(dom)) {
//    $ = dom;
//  }
//  else {
//    $ = cheerio.load(dom);
//  }
//  var nuggets = [];
//  var scraped = $(options.targets);
//  var position = 0;
//  scraped.each(function () {
//    var text = $(this).text();
//    if (!isStopText(options, text)) {
//      nuggets.push({
//        href: getHref(options, $(this)),
//        keywords: getKeywords(options, text),
//        text: getText(options, text),
//        position: position
//        tag: $(this)[0].name,
//        timestamp: Date.now(),
//      });
//      position++;
//    }
//  });
//  return nuggets;
//};