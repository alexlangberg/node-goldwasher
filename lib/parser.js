'use strict';

var cheerio = require('cheerio');

var parser = function(input) {
	var $ = cheerio.load(input);
	var headlines = $('h1').text();
	return {
		headlines: headlines
	};
};

module.exports = parser;