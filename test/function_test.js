'use strict';
/* global describe, it */
var should = require('should'); // jshint ignore:line
var request = require('supertest');
var config = require('./example/config');

var appId = config.appId;
var appKey = config.appKey;
var masterKey = config.masterKey;

var sessionToken_admin = "w2jrtkbehp38otqmhbqu7ybs9";

var app = config.getApp();

describe('functions', function() {
  it('ping', function(done) {
    request(app)
      .get('/__engine/1/ping')
      .expect(200)
      .expect('{"runtime":"nodejs-' + process.version + '","version":"' + require('../package.json').version + '"}', done);
  });

  // 测试最基本方法的有效性
  it('foo', function(done) {
    request(app)
      .post('/1/functions/foo')
      .set('X-AVOSCloud-Application-Id', appId)
      .set('X-AVOSCloud-Application-Key', appKey)
      .expect(200)
      .expect({result: "bar"}, done);
  });

  // 测试 api version 1.1 的有效性
  it('version_1.1', function(done) {
    request(app)
      .post('/1.1/functions/foo')
      .set('X-AVOSCloud-Application-Id', appId)
      .set('X-AVOSCloud-Application-Key', appKey)
      .expect(200)
      .expect({result: "bar"}, done);
  });

  // 测试参数的正确解析
  it('hello', function(done) {
    request(app)
      .post('/1/functions/hello')
      .set('X-AVOSCloud-Application-Id', appId)
      .set('X-AVOSCloud-Application-Key', appKey)
      .send({name: "张三"})
      .expect(200)
      .expect({result: {action: "hello", name: "张三"}}, done);
  });

  // 测试返回包含 AVObject 的复杂对象
  it('return_complexObject', function(done) {
    request(app)
      .post('/1.1/call/complexObject')
      .set('X-AVOSCloud-Application-Id', appId)
      .set('X-AVOSCloud-Application-Key', appKey)
      .expect(200, function(err, res) {
        var result = res.body.result;

        result.foo.should.equal('bar');
        result.t.should.eql({
          __type: 'Date',
          iso: '2015-05-14T09:21:18.273Z'
        });

        result.avObject.__type.should.equal('Object');
        result.avObject.className.should.equal('ComplexObject');
        result.avObject.numberColumn.should.equal(1.23);
        result.avObject.arrayColumn.should.eql([1, 2, 3]);
        result.avObject.objectColumn.should.eql({foo: 'bar'});
        result.avObject.stringColumn.should.equal('testString');
        result.avObject.anyColumn.should.equal('');
        result.avObject.booleanColumn.should.equal(true);
        result.avObject.pointerColumn.should.eql({
          __type: 'Pointer',
          className: '_User',
          objectId: '55069e5be4b0c93838ed8e6c'
        });
        result.avObject.relationColumn.should.be.eql({
          __type: 'Relation',
          className: 'TestObject'
        });
        result.avObject.geopointColumn.should.be.eql({
          __type: 'GeoPoint',
          latitude: 0,
          longitude: 30
        });
        result.avObject.dateColumn.should.be.eql({
          __type: 'Date',
          iso: '2015-05-14T06:24:47.000Z'
        });
        result.avObject.fileColumn.should.eql({
          __type: 'File',
          id: '55543fc2e4b0846760bd92f3',
          name: 'ttt.jpg',
          url: 'http://ac-4h2h4okw.clouddn.com/4qSbLMO866Tf4YtT9QEwJwysTlHGC9sMl7bpTwhQ.jpg'
        });

        result.avObjects.forEach(function(object) {
          object.__type.should.equal('Object');
          object.className.should.equal('ComplexObject');
        });

        done();
      })
  });

  // 返回单个 AVObject
  it('return_bareAVObject', function(done) {
    request(app)
      .post('/1.1/call/bareAVObject')
      .set('X-AVOSCloud-Application-Id', appId)
      .set('X-AVOSCloud-Application-Key', appKey)
      .expect(200, function(err, res) {
        res.body.result.__type.should.be.equal('Object');
        res.body.result.className.should.be.equal('ComplexObject');
        res.body.result.fileColumn.__type.should.be.equal('File');
        done();
      });
  });

  // 返回 AVObject 数组
  it('return_AVObjectsArray', function(done) {
    request(app)
      .post('/1.1/call/AVObjects')
      .set('X-AVOSCloud-Application-Id', appId)
      .set('X-AVOSCloud-Application-Key', appKey)
      .expect(200, function(err, res) {
        res.body.result.forEach(function(object) {
          object.__type.should.be.equal('Object');
          object.className.should.be.equal('ComplexObject');
        });
        done();
      });
  });

  // 测试发送包含 AVObject 的请求
  it('testAVObjectParams', function(done) {
    request(app)
      .post('/1.1/call/testAVObjectParams')
      .set('X-AVOSCloud-Application-Id', appId)
      .set('X-AVOSCloud-Application-Key', appKey)
      .send({
        avObject: {
          __type: 'Object',
          className: 'ComplexObject',
          name: 'avObject',
          pointerColumn: {
            __type: 'Pointer',
            className: '_User',
            objectId: '55069e5be4b0c93838ed8e6c'
          }
        },
        avFile: {
          __type: 'File',
          url: 'http://ac-1qdney6b.qiniudn.com/3zLG4o0d27MsCQ0qHGRg4JUKbaXU2fiE35HdhC8j.txt',
          name: 'hello.txt'
        },
        avObjects: [{
          __type: 'Object',
          className: 'ComplexObject',
          name: 'avObjects'
        }]
      })
      .expect(200, function(err, res) {
        done(err);
      });
  });

  // 测试发送单个 AVObject 作为请求参数
  it('testBareAVObjectParams', function(done) {
    request(app)
      .post('/1.1/call/testBareAVObjectParams')
      .set('X-AVOSCloud-Application-Id', appId)
      .set('X-AVOSCloud-Application-Key', appKey)
      .send({
        __type: 'Object',
        className: 'ComplexObject',
        name: 'avObject',
        avFile: {
          __type: 'File',
          url: 'http://ac-1qdney6b.qiniudn.com/3zLG4o0d27MsCQ0qHGRg4JUKbaXU2fiE35HdhC8j.txt',
          name: 'hello.txt'
        },
      })
      .expect(200, function(err, res) {
        done(err);
      });
  });

  // 测试发送 AVObject 数组作为请求参数
  it('testAVObjectsArrayParams', function(done) {
    var object = {
      __type: 'Object',
      className: 'ComplexObject',
      name: 'avObject',
      avFile: {
        __type: 'File',
        url: 'http://ac-1qdney6b.qiniudn.com/3zLG4o0d27MsCQ0qHGRg4JUKbaXU2fiE35HdhC8j.txt',
        name: 'hello.txt'
      }
    };

    request(app)
      .post('/1.1/call/testAVObjectsArrayParams')
      .set('X-AVOSCloud-Application-Id', appId)
      .set('X-AVOSCloud-Application-Key', appKey)
      .send([object, object])
      .expect(200, function(err, res) {
        done(err);
      });
  });

  // 测试 run 方法的有效性
  it('testRun', function(done) {
    request(app)
      .post('/1/functions/testRun')
      .set('X-AVOSCloud-Application-Id', appId)
      .set('X-AVOSCloud-Application-Key', appKey)
      .expect(200)
      .expect({}, done);
  });

  it('testRun_AVObjects', function(done) {
   request(app)
     .post('/1.1/call/testRunWithAVObject')
     .set('X-AVOSCloud-Application-Id', appId)
     .set('X-AVOSCloud-Application-Key', appKey)
     .expect(200, function(err, res) {
       res.body.result.avObjects[0].__type.should.equal('Object');
       res.body.result.avObjects[0].className.should.equal('ComplexObject');
       done();
     })
  });

  it('testRun_text_plain', function(done) {
    request(app)
      .post('/1/functions/testRun')
      .set('Content-Type', 'text/plain; charset=utf-8')
      .send(JSON.stringify({
        '_ApplicationId': appId,
        '_ApplicationKey': appKey,
        '_OtherParams': 'asdfg'
      }))
      .expect(200)
      .expect({}, done);
  });

  it('no_this_method', function(done) {
    request(app)
      .post('/1/functions/noThisMethod')
      .set('X-AVOSCloud-Application-Id', appId)
      .set('X-AVOSCloud-Application-Key', appKey)
      .expect(404, done);
  });

  // 测试带有 sessionToken 时，user 对象的正确解析
  it('testUser', function(done) {
    this.timeout(5000);
    request(app)
      .post('/1/functions/testUser')
      .set('X-AVOSCloud-Application-Id', appId)
      .set('X-AVOSCloud-Application-Key', appKey)
      .set('x-avoscloud-session-token', sessionToken_admin)
      .expect(200, done);
  });

  // 无效 sessionToken 测试
  it('testUser_invalid_sessionToken', function(done) {
    this.timeout(5000);
    request(app)
      .post('/1/functions/testUser')
      .set('X-AVOSCloud-Application-Id', appId)
      .set('X-AVOSCloud-Application-Key', appKey)
      .set('x-avoscloud-session-token', '00000000000000000000')
      .expect(400)
      .end(function(err, res) {
        res.body.should.eql({ code: 211, error: 'Could not find user' });
        done();
      });
  });

  // 测试调用 run 方法时，传递 user 对象的有效性
  it('testRunWithUser', function(done) {
    this.timeout(5000);
    request(app)
      .post('/1/functions/testRunWithUser')
      .set('X-AVOSCloud-Application-Id', appId)
      .set('X-AVOSCloud-Application-Key', appKey)
      .set('x-avoscloud-session-token', sessionToken_admin)
      .expect(200, done);
  });

  // 测试调用 run 方法 options callback
  it('testRun_options_callback', function(done) {
    this.timeout(5000);
    request(app)
      .post('/1/functions/testRun_options_callback')
      .set('X-AVOSCloud-Application-Id', appId)
      .set('X-AVOSCloud-Application-Key', appKey)
      .set('x-avoscloud-session-token', sessionToken_admin)
      .expect(200, done);
  });

  // 测试调用 run 方法，返回值是 promise 类型
  it('testRun_promise', function(done) {
    this.timeout(5000);
    request(app)
      .post('/1/functions/testRun_promise')
      .set('X-AVOSCloud-Application-Id', appId)
      .set('X-AVOSCloud-Application-Key', appKey)
      .set('x-avoscloud-session-token', sessionToken_admin)
      .expect(200, done);
  });

  // 测试 onVerified hook 的有效性
  it('onVerified', function(done) {
    request(app)
      .post("/1/functions/onVerified/sms")
      .set('X-Uluru-Application-Id', appId)
      .set('X-Uluru-Application-Key', appKey)
      .send({
        object: {
          objectId: '54fd6a03e4b06c41e00b1f40',
          username: 'admin'
        }
      })
      .expect(200)
      .expect({ result: 'ok'}, done);
  });

  // 测试抛出异常时的处理
  it('throw_error', function(done) {
    request(app)
      .post('/1/functions/testThrowError')
      .set('X-AVOSCloud-Application-Id', appId)
      .set('X-AVOSCloud-Application-Key', appKey)
      .expect(500)
      .expect({code: 1, error: 'noThisMethod is not defined'}, done);
  });

  it('_metadatas', function(done) {
    request(app)
      .get('/1/functions/_ops/metadatas')
      .set('X-AVOSCloud-Application-Id', appId)
      .set('X-AVOSCloud-Master-Key', masterKey)
      .expect(200, function(err, res) {
        res.body.result.should.containDeep([
          'foo',
          'hello',
          'testUser',
          'testRun',
          'testRunWithUser',
          '__on_verified_sms',
          'testThrowError',
          'userMatching' ]);
        done();
      });
  });

  it('CORS', function(done) {
    request(app)
      .options('/1/functions')
      .set('Origin', 'http://foo.bar')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'X-AVOSCloud-Application-Id, X-AVOSCloud-Application-Key')
      .expect('access-control-allow-origin', 'http://foo.bar')
      .expect(200, done);
  });

  it('onCompleteBigqueryJob', function(done) {
    request(app)
      .post('/1.1/functions/BigQuery/onComplete')
      .set('X-AVOSCloud-Application-Id', appId)
      .set('X-AVOSCloud-Application-Key', appKey)
      .send({
        id : "job id",
        status: "OK/ERROR",
        message: "当 status 为 ERROR 时的错误消息"
      })
      .expect(200, done);
  });

});
