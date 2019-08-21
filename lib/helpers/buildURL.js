'use strict';

var utils = require('./../utils');

// URI转移后的部分转译特殊字符编码还原
function encode(val) {
  return encodeURIComponent(val).
    replace(/%40/gi, '@').
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @param  params的自定义序列化函数
 * @returns {string} The formatted url
 */
module.exports = function buildURL(url, params, paramsSerializer) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }

  var serializedParams;
  // 如果传入参数的自定义序列化函数，则直接调用进行序列化处理
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  //  如果params是内置的URL查询字符串对象，则直接调用其方法
  } else if (utils.isURLSearchParams(params)) {
    serializedParams = params.toString();
    /**
     * 否则，按统一方法进行处理：
     * 1、去除掉所有的值为null或"undefined"项
     * 2、将值value为数组的项，键key修改为key[]；
     * 3、值value不为数组的值修改为临时的数组，对值value进行遍历，把日期值转换为时间字符串，把对象直接string化，
     * 生成键值对并分别进行URI编码后修改部分特殊字符，生成组值：key=value或key[]=value(这种可能会存在多个)
     * 4、把所有的生成结果用&符号拼接
     */
  } else {
    var parts = [];

    utils.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        return;
      }

      if (utils.isArray(val)) {
        key = key + '[]';
      } else {
        val = [val];
      }

      utils.forEach(val, function parseValue(v) {
        // 是否是日期
        if (utils.isDate(v)) {
          v = v.toISOString();
        //  是否是对象：直接序列化未字符串
        } else if (utils.isObject(v)) {
          v = JSON.stringify(v);
        }
        parts.push(encode(key) + '=' + encode(v));
      });
    });

    serializedParams = parts.join('&');
  }
  // 如果序列化结果不为空，则进一步进行处理
  if (serializedParams) {
    // 如果传入的url中含有hash符号，则只取其前半段
    var hashmarkIndex = url.indexOf('#');
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }
    // 如果URL中已包含?，则直接加上&进行拼接；如果没有，则加上？进行拼接
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};
