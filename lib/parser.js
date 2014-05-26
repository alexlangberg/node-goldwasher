'use strict';

var _ = require('underscore');
var validator = require('validator');
var cheerio = require('cheerio');

var sanitizeText = function (settings, text) {
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

var getText = function (settings, text)	{
	// trim text
	var sanitized = text.trim();
	// remove newlines
	sanitized = sanitized.replace(/(\r\n|\n|\r)/gm,' ');
	// replace double spaces with single spaces
	sanitized = sanitized.replace(/\s+/g,' ');
	return sanitized;
};

var isStopText = function (settings, text) {
	// remove stop texts
	if (typeof settings.filterTexts !== 'undefined') {
		if (settings.filterTexts instanceof Array) {
			return _(settings.filterTexts).contains(text);
		}
		else {
			throw new Error('filterTexts must be an array.');
		}
	}
};

var getStopwords = function (settings) {
	var stopWords = [];
	// add locale stop words
	if (_(settings).has('filterLocale')) {
		if (_(settings.filterLocale).isString()) {
			var localeStopWords = require(
				'../stop_words/' + settings.filterLocale + '.json'
			);
			stopWords = stopWords.concat(localeStopWords.stopWords);
		}
		else {
			throw new Error('filterLocale must be a string.');
		}
	}
	// add custom stop words
	if (_(settings).has('filterKeywords')) {
		if (_(settings.filterKeywords).isArray()) {
			stopWords = stopWords.concat(settings.filterKeywords);
		}
		else {
			throw new Error('filterKeywords must be an array.');
		}
	}
	stopWords = _(stopWords).map(
		function (word) { 
			return sanitizeText(settings, word); 
		}
	);
	return stopWords;
};

var getKeywords = function (settings, text) {
	// make text lowercase
	var sanitized = sanitizeText(settings, text);
	// split sanitized text into an array of keywords
	var keywords = sanitized.split(' ');
	// remove empty items
	keywords = _(keywords).compact();
	// remove stop words
	var stopWords = getStopwords(settings);
	keywords = _(keywords).difference(stopWords);
	return keywords;
};

var getHref = function (settings, domObject) {
	var link = '';
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
	if (link !== '' && !validator.isURL(link)) {
		link = settings.url + link;
	}
	return link;
};

var parser = function (settings, dom) {
	var nuggets = [];
	var $ = cheerio.load(dom);
	var scraped = $(settings.targets);
	var index = 0;
	scraped.each(function() {
		var text = $(this).text();
		if (!isStopText(settings, text)) {
			nuggets.push({
				timestamp: Date.now(),
				text: getText(settings, text),
				keywords: getKeywords(settings, text),
				href: getHref(settings, $(this)),
				tag: $(this)[0].name,
				index: index
			});
			index++;
		}
	});
	return nuggets;
};


module.exports = parser;