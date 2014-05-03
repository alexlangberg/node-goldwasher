'use strict';

var myStepDefinitionsWrapper = function () {
	
	var assert = require('assert');
	var first;
	var second;
	var result;

	this.World = require("../support/world.js").World;

	this.Given(/^the number (\d+) is my first number$/, function(number, callback) {
		first = number;
		callback();
	});

	this.Given(/^the number (\d+) is my second number$/, function(number, callback) {
		second = number;
		callback();
	});

	this.When(/^I add the numbers$/, function(callback) {
		result = this.goldwasher.sum(first, second);
		callback();
	});

	this.Then(/^the result should be the sum should be (\d+)$/, function(number, callback) {
		assert.equal(result, number);
		callback();
	});

};

module.exports = myStepDefinitionsWrapper;