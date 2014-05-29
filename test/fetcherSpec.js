'use strict';

var setup = require('./testSetup');
var should; should = setup.chai.should();
var fetcher = require('../lib/fetcher');

describe('fetcher', function() {

		it('fetches the response of the URL', function () {
			var toFetch = { url: setup.server.testUrl };
			fetcher(toFetch, function (error, body) {
				body.should.equal(setup.server.testContent);
			});
		});

		it('returns an error if the server is not found', function () {
			fetcher({ url: '127.0.0.0' }, function (error) {
				error.should.be.an.instanceof(Error);
			});
		});

		it('returns an error if the response is not 200', function () {
			var toFetch = { url: setup.server.testUrl + '?status=404' };
			fetcher(toFetch, function (error) {
				error.should.be.an.instanceof(Error);
			});
		});

});