'use strict';
/* global describe, it */

var nodeEnv = process.env.NODE_ENV || 'development';

if(nodeEnv === 'development') {
} else {
  var should = require('should'),
    request = require('request'),
    async = require('async');
  var config = require('./example/config');
  
  var appId = config.appId;
  var appKey = config.appKey;
  var sessionToken_admin = "w2jrtkbehp38otqmhbqu7ybs9";
  var app = config.getApp();

  // 用户串号测试
  describe('user matching', function() {
    it('cloud_func', function(done) {
      this.timeout(50000);
      async.timesLimit(200, 10, function(n, next) {
        async.parallel([
          function(cb) {
            request({
              url: app + '/1.1/functions/userMatching',
              method: 'POST',
              headers: {
                'X-AVOSCloud-Application-Id': appId,
                'X-AVOSCloud-Application-Key': appKey,
                'X-AVOSCloud-session-token': sessionToken_admin
              },
              json: {assertName: 'admin'}
            }, function(err, res, body) {
              should.not.exist(err);
              res.statusCode.should.equal(200);
              body.result.reqUser.username.should.equal('admin');
              body.result.currentUser.username.should.equal('admin');
              cb(err);
            });
          },
          function(cb) {
            request({
              url: app + '/1.1/functions/userMatching',
              method: 'POST',
              headers: {
                'X-AVOSCloud-Application-Id': appId,
                'X-AVOSCloud-Application-Key': appKey,
                'X-AVOSCloud-session-token': '3267fscy0q4g3i4yc9uq9rqqv'
              },
              json: {assertName: 'zhangsan'}
            }, function(err, res, body) {
              should.not.exist(err);
              res.statusCode.should.equal(200);
              body.result.reqUser.username.should.equal('zhangsan');
              body.result.currentUser.username.should.equal('zhangsan');
              cb(err);
            });
          },
          function(cb) {
            request({
              url: app + '/1.1/functions/userMatching',
              method: 'POST',
              headers: {
                'X-AVOSCloud-Application-Id': appId,
                'X-AVOSCloud-Application-Key': appKey,
              },
              json: {}
            }, function(err, res, body) {
              should.not.exist(err);
              res.statusCode.should.equal(200);
              should.not.exist(body.result.reqUser);
              should.not.exist(body.result.currentUser);
              cb(err);
            });
          }
        ], function(err) {
          next(err);
        });
      }, done);
    });

    it('web_hosting', function(done) {
      this.timeout(50000);
      async.timesLimit(200, 10, function(n, next) {
        async.parallel([
          function(cb) {
            request({
              url: app + '/userMatching',
              method: 'POST',
              headers: {
                'Cookie': 'avos:sess=eyJfdWlkIjoiNTRmZDZhMDNlNGIwNmM0MWUwMGIxZjQwIiwiX3Nlc3Npb25Ub2tlbiI6IncyanJ0a2JlaHAzOG90cW1oYnF1N3liczkifQ==; avos:sess.sig=jMYF3Iwhmw903-K1K12MVdAFOh0' // admin
              },
              json: {assertName: 'admin'}
            }, function(err, res, body) {
              should.not.exist(err);
              if (res.statusCode === 302) {
                console.log(app)
                console.log(body)
              }
              res.statusCode.should.equal(200);
              body.reqUser.username.should.equal('admin');
              body.currentUser.username.should.equal('admin');
              cb(err);
            });
          },
          function(cb) {
            request({
              url: app + '/userMatching',
              method: 'POST',
              headers: {
                'Cookie': 'avos:sess=eyJfdWlkIjoiNTUwNjllNWJlNGIwYzkzODM4ZWQ4ZTZjIiwiX3Nlc3Npb25Ub2tlbiI6IjMyNjdmc2N5MHE0ZzNpNHljOXVxOXJxcXYifQ==; avos:sess.sig=ibxmCzbQvavgn5aWa0tjhAkOYXc' // zhangsan
              },
              json: {assertName: 'zhangsan'}
            }, function(err, res, body) {
              should.not.exist(err);
              if (res.statusCode === 302) {
                console.log(app)
                console.log(body)
              }
              res.statusCode.should.equal(200);
              body.reqUser.username.should.equal('zhangsan');
              body.currentUser.username.should.equal('zhangsan');
              cb(err);
            });
          },
          function(cb) {
            request({
              url: app + '/userMatching',
              method: 'POST',
              json: {}
            }, function(err, res, body) {
              should.not.exist(err);
              if (res.statusCode === 302) {
                console.log(app)
                console.log(body)
              }
              res.statusCode.should.equal(200);
              should.not.exist(body.reqUser);
              should.not.exist(body.currentUser);
              cb(err);
            });
          }
        ], function(err) {
          next(err);
        });
      }, done);
    });
  });
}

