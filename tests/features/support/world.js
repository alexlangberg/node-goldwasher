'use strict';

var World = function (callback) {
	this.goldwasher = require(process.cwd() + '/goldwasher');
	callback(this);
};

exports.World = World;