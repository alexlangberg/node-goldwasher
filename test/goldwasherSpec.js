'use strict';

var setup = require('./testSetup');
var should; should = setup.chai.should();
var goldwasher = require('../lib/goldwasher');

describe('goldwasher', function() {

	it('returns nuggets', function (done) {
		goldwasher({
			url: setup.server.testUrl,
			targets: setup.server.testTargets
		}, function (error, nuggets) {
			if (error) {
				throw error;
			}
			nuggets.should.have.length(2);
			done();
		});
	});

	it('fails on invalid url', function () {
		goldwasher({
			url: '127.0.0.0',
			targets: setup.server.testTargets
		}, function (error) {
			error.should.be.an.instanceof(Error);
		});
	});

});