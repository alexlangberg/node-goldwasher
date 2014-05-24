'use strict';

var cheerio = require('cheerio');

var getHref = function (url, domObject) {
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
	if (link !== '' && link.indexOf('http://') === -1) {
		link = url + link;
	}
	return link;
};

var parser = function (settings, input) {
	var nuggets = [];
	var $ = cheerio.load(input);
	var scraped = $(settings.targets);

	scraped.each(function(i) {
		nuggets.push({
			timestamp: Date.now(),
			text: $(this).text().trim(),
			keywords: [],
			href: getHref(settings.url, $(this)),
			tag: $(this)[0].name,
			count: scraped.length,
			index: i
		});
	});

	return nuggets;
};


module.exports = parser;