'use strict';

var _ = require('underscore');
var validator = require('validator');
var cheerio = require('cheerio');

var sanitizeText = function (options, text) {
  // make text lowercase
  var sanitized = text.toLowerCase();
  // trim text
  sanitized = sanitized.trim();
  // replace ' with nothing
  sanitized = sanitized.replace(/[']/g, '');
  // convert anything but alphanumeric characters to spaces
  sanitized = sanitized.replace(/[^A-ZÆØÅa-zæøå0-9 ]/g, ' ');
  return sanitized;
};

var getText = function (options, text) {
  // trim text
  var sanitized = text.trim();
  // remove newlines
  sanitized = sanitized.replace(/(\r\n|\n|\r)/gm, ' ');
  // replace double spaces with single spaces
  sanitized = sanitized.replace(/\s+/g, ' ');
  return sanitized;
};

var isStopText = function (options, text) {
  // remove stop texts
  if (typeof options.filterTexts !== 'undefined') {
    if (options.filterTexts instanceof Array) {
      return _(options.filterTexts).contains(text);
    }
    else {
      throw new Error('filterTexts must be an array.');
    }
  }
};

var getStopwords = function (options) {
  var stopWords = [];
  // add locale stop words
  if (_(options).has('filterLocale')) {
    if (_(options.filterLocale).isString()) {
      var localeStopWords = require(
        '../stop_words/' + options.filterLocale + '.json'
      );
      stopWords = stopWords.concat(localeStopWords.stopWords);
    }
    else {
      throw new Error('filterLocale must be a string.');
    }
  }
  // add custom stop words
  if (_(options).has('filterKeywords')) {
    if (_(options.filterKeywords).isArray()) {
      stopWords = stopWords.concat(options.filterKeywords);
    }
    else {
      throw new Error('filterKeywords must be an array.');
    }
  }
  stopWords = _(stopWords).map(
    function (word) {
      return sanitizeText(options, word);
    }
  );
  return stopWords;
};

var getKeywords = function (options, text) {
  // make text lowercase
  var sanitized = sanitizeText(options, text);
  // split sanitized text into an array of keywords
  var keywords = sanitized.split(' ');
  // remove empty items
  keywords = _(keywords).compact();
  // remove stop words
  var stopWords = getStopwords(options);
  keywords = _(keywords).difference(stopWords);
  keywords = _(keywords).countBy(function (word) {
    return word;
  });
  keywords = _(keywords).map(function (value, key) {
    return {
      word: key,
      count: value
    };
  });
  return keywords;
};

var getHref = function (options, domObject) {
  var link = null;
  // if the object is a link itself
  if (domObject[0].name && domObject[0].name === 'a') {
    link = domObject.attr('href');
  }
  // if the object has a child node that is a link
  else if (domObject.children('a').length > 0) {
    link = domObject.children('a').attr('href');
  }
  // if the object has an adjecent node that is a link
  else if (domObject.closest('a').length > 0) {
    link = domObject.closest('a').attr('href');
  }
  // check for relative urls and append baseUrl if relative
  if (link && !validator.isURL(link)) {
    if (_(options).has('url')) {
      link = options.url + link;
    }
  }
  return link;
};

var goldwasher = function (options, dom) {
  var $;
  if (_.isFunction(dom)) {
    $ = dom;
  }
  else {
    $ = cheerio.load(dom);
  }
  var nuggets = [];
  var scraped = $(options.targets);
  var position = 0;
  scraped.each(function () {
    var text = $(this).text();
    if (!isStopText(options, text)) {
      nuggets.push({
        timestamp: Date.now(),
        text: getText(options, text),
        keywords: getKeywords(options, text),
        href: getHref(options, $(this)),
        tag: $(this)[0].name,
        position: position
      });
      position++;
    }
  });
  return nuggets;
};

module.exports = goldwasher;