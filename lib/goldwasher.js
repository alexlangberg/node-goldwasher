'use strict';

var initializer = require('./initializer');
var fetcher = require('./fetcher');
var parser = require('./parser');

var goldwasher = function (settings, callback) {
	var initializedSettings = initializer(settings);
	fetcher(initializedSettings, function (error, dom) {
		if (error) {
			return callback(error);
		}
		else {
			var nuggets = parser(initializedSettings, dom);
			return callback(null, nuggets);
		}
	});
};

module.exports = goldwasher;