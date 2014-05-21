'use strict';

var should; should = require('./testSetup').should();
var server = require('./server');
var fetcher = require('../lib/fetcher');

before(function (done) {
	server.run();
	done();
});

describe('fetcher', function() {

		it('fetches the response of the URI', function () {
			var toFetch = { url: server.testUrl };
			fetcher(toFetch, function (error, body) {
				body.should.equal(server.testContent);
			});
		});

		it('returns an error if the server is not found', function () {
			fetcher({ url: '127.0.0.0' }, function (error) {
				error.should.be.an.instanceof(Error);
			});
		});

		it('returns an error if the response is not 200', function () {
			var toFetch = { url: server.testUrl + '?status=404' };
			fetcher(toFetch, function (error) {
				error.should.be.an.instanceof(Error);
			});
		});

});