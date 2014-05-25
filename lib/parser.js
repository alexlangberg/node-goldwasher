'use strict';

var _ = require('underscore');
var validator = require('validator');
var cheerio = require('cheerio');

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

var getKeywords = function (settings, text) {
	var sanitized = text;
	// make text lowercase
	sanitized = sanitized.toLowerCase();
	// trim text
	sanitized = sanitized.trim();
	// replace ' with nothing
	sanitized = sanitized.replace(/[']/g, '');
	// remove newlines
	//sanitized = sanitized.replace(/(\r\n|\n|\r)/gm,''); 
	// convert anything but alphanumeric characters to spaces
	sanitized = sanitized.replace(/[^A-ZÆØÅa-zæøå0-9 ]/g, ' ');

	// split sanitized text into an array of keywords
	var keywords = sanitized.split(' ');
	// remove empty items
	keywords = _.compact(keywords);
	// remove stop words
	if (typeof settings.filterKeywords !== 'undefined') {
		if (settings.filterKeywords instanceof Array) {
			keywords = _.difference(keywords, settings.filterKeywords);
		}
		else {
			throw new Error('filterKeywords must be an array.');
		}
	}

	return keywords;
};

var parser = function (settings, dom) {
	var nuggets = [];
	var $ = cheerio.load(dom);
	var scraped = $(settings.targets);

	scraped.each(function(index) {
		var text = $(this).text().trim();
		nuggets.push({
			timestamp: Date.now(),
			text: text,
			keywords: getKeywords(settings, text),
			href: getHref(settings, $(this)),
			tag: $(this)[0].name,
			count: scraped.length,
			index: index
		});
	});

	return nuggets;
};


module.exports = parser;