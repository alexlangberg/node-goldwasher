'use strict';

var http = require('http');
var url = require('url');
var ip = '127.0.0.1';
var port = '1337';
var testUrl = 'http://' + ip + ':' + port;
var testContent  = '<html><body><h1>foo</h1><h2>bar</h2></body></html>';
var testTargets = 'h1, h2';

var http = require('http');

var server = {
	testUrl: testUrl,
	testContent: testContent,
	testTargets: testTargets,
	testIp: ip,
	testPort: port
};

server.connection = http.createServer(function (req, res) {
	var statusCode = 200;
	var parts = url.parse(req.url, true);
	if (parts.query.status) {
		statusCode = parts.query.status;
	}
  res.writeHead(statusCode, {'Content-Type': 'text/html'});
  res.end(server.testContent);
});

server.listen = function (content) {
	server.testContent = content || server.testContent;
	server.testUrl = 'http://' + server.testIp + ':' + server.testPort;
	console.log('Test server started on ' + server.testUrl);
	server.connection.listen(server.testPort, server.testIp);
};

server.close = function (callback) {
	console.log('Test server stopped.');
	server.connection.close(callback);
};

module.exports = server;