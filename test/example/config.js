'use strict';

exports.appId = process.env.LC_APP_ID || '4h2h4okwiyn8b6cle0oig00vitayum8ephrlsvg7xo8o19ne';
exports.appKey = process.env.LC_APP_KEY || '3xjj1qw91cr3ygjq9lt0g8c3qpet38rrxtwmmp0yffyoy2t4';
exports.masterKey = process.env.LC_APP_MASTER_KEY || '3v7z633lzfec9qzx8sjql6zimvdpmtwypcchr2gelu5mrzb0';

var env = process.env.NODE_ENV || 'development';

exports.getAV = function() {
  var AV;
  switch(env) {
    case 'development':
      AV = require('../..');
      break;
    case 'test':
    case 'stage':
    case 'production':
      AV = require('leanengine');
      break;
    default:
      throw new Error('Unsupported env: ', env);
  }
  AV.initialize(exports.appId, exports.appKey, exports.masterKey);
  return AV;
};

exports.getApp = function() {
  switch(env) {
    case 'development':
      return require('./app');
    case 'test':
      return 'http://localhost:3000';
    case 'stage':
      return 'http://dev.leanengine-unit-test.avosapps.com';
    case 'production':
      return 'https://leanengine-unit-test.avosapps.com';
    default:
      throw new Error('Unsupported env: ', process.env.NODE_ENV);
  }
};
