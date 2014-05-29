'use strict';

var chai = require('chai');
var server = require('./server');
var setup = {};

chai.use(require('chai-things'));

before(function (done) {
	server.listen('<html><body><h1>foo</h1><h2>bar</h2></body></html>');
	done();
});

after(function (done) {
	server.close(function () {
		console.log('Test server closed.');
		done();
	});
});

setup.chai = chai;
setup.server = server;
module.exports = setup;