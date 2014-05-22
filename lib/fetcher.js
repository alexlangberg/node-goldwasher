'use strict';

var request = require('request');

var fetcher = function(input, callback) {
	request(input.url, function (error, response, body) {
		if (!error && response.statusCode === 200) {
			callback(null, body);
		} 
		else {
			if (error) {
				callback(error);
			}
			else {
				callback(new Error('Server did not respond with 200.'));
			}
		}
	});
};

module.exports = fetcher;