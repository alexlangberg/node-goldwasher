'use strict';

var initializer = function (input) {
	if (typeof input !== 'object' || typeof input === 'undefined') {
		throw new Error('Input was not an object.');
	}
	if (typeof input.url === 'undefined') {
		throw new Error('Input did not contain a URL.');
	}
	return input;
};

module.exports = initializer;