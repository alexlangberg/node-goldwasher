'use strict';

var fs = require('fs');

var goldwasher = {
  sum: function(first, second) {
    return parseInt(first) + parseInt(second);
  }
};


/*module.exports = {
  sum: function(first, second) {
    return parseInt(first) + parseInt(second);
  }
};*/

module.exports = goldwasher;