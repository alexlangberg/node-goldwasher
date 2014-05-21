'use strict';

var cheerio = require('cheerio');

var parser = function(input) {
	var nuggets = [];
	var $ = cheerio.load(input);

	$('h1, h2').each(function() {
		nuggets.push({
			tag: $(this)[0].name,
			text: $(this).text().trim()
		});
	});

	return nuggets;
};

module.exports = parser;