'use strict';

var utils = require('../utils');
/**
 * 对对象的指定字段名进行替换[格式化]
 * @param headers [object]
 * @param normalizedName [string]
 */
module.exports = function normalizeHeaderName(headers, normalizedName) {
  utils.forEach(headers, function processHeader(value, name) {
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = value;
      delete headers[name];
    }
  });
};
