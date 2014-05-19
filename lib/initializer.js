'use strict';

var initializer = function(input) {
	if (typeof input !== 'object' || typeof input === 'undefined') {
		throw new Error('Input was not an object.');
	}
	if (typeof input.uri === 'undefined') {
		throw new Error('Input did not contain a URI.');
	}
	return input;
};

module.exports = initializer;