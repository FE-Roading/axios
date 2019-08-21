'use strict';

var utils = require('./../utils');
var transformData = require('./transformData'); // 数据转换：可以进行多次转换
var isCancel = require('../cancel/isCancel'); // __CANCEL__是否为true
var defaults = require('../defaults');  // 获取默认配置
var isAbsoluteURL = require('./../helpers/isAbsoluteURL');  // 是否时绝对url
var combineURLs = require('./../helpers/combineURLs');  // url拼接

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 * 发送请求到服务端
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest(config) {
  // 如果已设置为取消，则运行取消程序
  throwIfCancellationRequested(config);

  // Support baseURL config
  // 如果请求的url不是绝对url且存在baseURL，则拼接生成新的URL
  if (config.baseURL && !isAbsoluteURL(config.url)) {
    config.url = combineURLs(config.baseURL, config.url);
  }

  // Ensure headers exist 确保请求头不是undefined
  config.headers = config.headers || {};

  // Transform request data：对请求数据，依次调用所有的transformRequest进行处理
  config.data = transformData(
    config.data,
    config.headers,
    config.transformRequest
  );

  // Flatten headers：对请求头对象进行整理，扁平化为一维
  config.headers = utils.merge(
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers || {}
  );
  // 删除部分请求头字段
  utils.forEach(
    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
    function cleanHeaderConfig(method) {
      delete config.headers[method];
    }
  );

  var adapter = config.adapter || defaults.adapter;

  return adapter(config).then(function onAdapterResolution(response) {
    // 如果已设置为取消，则运行取消程序
    throwIfCancellationRequested(config);

    // Transform response data
    response.data = transformData(
      response.data,
      response.headers,
      config.transformResponse
    );

    return response;
  }, function onAdapterRejection(reason) {
    // 如果请求未被取消
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData(
          reason.response.data,
          reason.response.headers,
          config.transformResponse
        );
      }
    }

    return Promise.reject(reason);
  });
};
