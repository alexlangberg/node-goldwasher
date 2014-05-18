node-template-grunt-mocha-travis-coveralls
==========
[![Build Status](https://travis-ci.org/alexlangberg/goldwasher.svg?branch=master)](https://travis-ci.org/alexlangberg/goldwasher)
[![Coverage Status](https://coveralls.io/repos/alexlangberg/goldwasher/badge.png?branch=master)](https://coveralls.io/r/alexlangberg/goldwasher?branch=master)

Test project to show how to set up a project with:

-	Node.js
-	grunt (run tasks):
	- grunt-contrib-watch (run jshint and mocha on file change)
	- grunt-clear (clear console, used when watch is fired)
	- grunt-contrib-jshint (lint javascript)
	- grunt-mocha-cov (run mocha from grunt)
-	Mocha + Chai (BDD testing)
-	Travis CI (CI testing)
- Coveralls (code coverage)