'use strict';

var fs = require('fs');
var http = require('http');
var url = require('url');
var ip = '127.0.0.1';
var port = '1337';
var testUrl = 'http://' + ip + ':' + port;
var testContent  = fs.readFileSync('test/testPage.html', 'utf8');

var server = {
	testUrl: testUrl,
	testContent: testContent
};

server.run = function() {	
	http.createServer(function (req, res) {
		var statusCode = 200;
		var parts = url.parse(req.url, true);
		if (parts.query.status) {
			statusCode = parts.query.status;
		}
	  res.writeHead(statusCode, {'Content-Type': 'text/html'});
	  res.end(testContent);
	}).listen(1337, '127.0.0.1');
};

module.exports = server;