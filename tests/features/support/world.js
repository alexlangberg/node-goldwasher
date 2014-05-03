'use strict';

var World = function (callback) {
	this.goldwasher = require(process.cwd() + '/index');
	callback(this);
};

exports.World = World;