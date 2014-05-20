'use strict';

var expect = require('chai').expect;
var server = require('./server.js');
var fetcher = require('../lib/fetcher.js');

before(function (done) {
	server.run();
	done();
});

describe('fetcher', function() {

		it('should fetch the response of the URI', function () {
			var toFetch = { url: server.testUrl };
			fetcher(toFetch, function (error, body) {
				expect(body).to.equal(server.testContent);
			});
		});

		it('should return an error if the server is not found', function () {
			fetcher({ url: '127.0.0.0' }, function (error) {
				expect(error).to.be.an.instanceof(Error);
			});
		});

		it('should return an error if the response is not 200', function () {
			var toFetch = { url: server.testUrl + '?status=404' };
			fetcher(toFetch, function (error) {
				expect(error).to.be.an.instanceof(Error);
			});
		});

});