'use strict';
var should = require('should'); // jshint ignore:line
var assert = require('assert');
var config = require('./config');

var AV = config.getAV();

AV.Cloud.define('foo', function(request, response) {
  assert.ok(request.meta.remoteAddress);
  response.success("bar");
});

AV.Cloud.define('hello', function(request, response) {
  response.success({action: "hello", name: request.params.name});
});

AV.Cloud.define('choice', function(req, res) {
  if (req.params.choice) {
    res.success('OK~');
  } else {
    res.error('OMG...');
  }
});

AV.Cloud.define('complexObject', function(request, response) {
  var query = new AV.Query('ComplexObject');
  query.include('fileColumn');
  query.ascending('createdAt');
  query.find({
    success: function(results) {
      response.success({
        foo: 'bar',
        i: 123,
        obj: {
          a: 'b',
          as: [1, 2, 3],
        },
        t: new Date('2015-05-14T09:21:18.273Z'),
        avObject: results[0],
        avObjects: results,
      });
    }
  });
});

AV.Cloud.define('bareAVObject', function(request, response) {
  var query = new AV.Query('ComplexObject');
  query.include('fileColumn');
  query.ascending('createdAt');
  query.find({
    success: function(results) {
      response.success(results[0]);
    }
  });
});

AV.Cloud.define('AVObjects', function(request, response) {
  var query = new AV.Query('ComplexObject');
  query.include('fileColumn');
  query.ascending('createdAt');
  query.find({
    success: function(results) {
      response.success(results);
    }
  });
});

AV.Cloud.define('testAVObjectParams', function(request, response) {
  request.params.avObject.should.be.instanceof(AV.Object);
  request.params.avObject.get('name').should.be.equal('avObject');
  request.params.avObject.get('pointerColumn').should.be.instanceof(AV.User);

  request.params.avFile.should.be.instanceof(AV.File);

  request.params.avObjects.forEach(function(object) {
    object.should.be.instanceof(AV.Object);
    object.get('name').should.be.equal('avObjects');
  });

  response.success();
});

AV.Cloud.define('testBareAVObjectParams', function(request, response) {
  request.params.should.be.instanceof(AV.Object);
  request.params.get('name').should.be.equal('avObject');
  request.params.get('avFile').should.be.instanceof(AV.File);
  request.params.get('avFile').name().should.be.equal('hello.txt');
  response.success();
});

AV.Cloud.define('testAVObjectsArrayParams', function(request, response) {
  request.params.forEach(function(object) {
    object.get('name').should.be.equal('avObject');
    object.get('avFile').should.be.instanceof(AV.File);
    object.get('avFile').name().should.be.equal('hello.txt');
  });
  response.success();
});

AV.Cloud.define('testUser', function(request, response) {
  assert.equal(request.user.className, '_User');
  assert.equal(request.user.id, '54fd6a03e4b06c41e00b1f40');
  assert.equal(request.user.get('username'), 'admin');
  assert.equal(request.user, AV.User.current());
  response.success("ok");
});

AV.Cloud.define('testRun', function(request, response) {
  AV.Cloud.run('hello', {name: '李四'}, {
    success: function(data) {
      assert.deepEqual(data, {action: "hello", name: '李四'});
      response.success();
    }
  });
});

AV.Cloud.define('testRun_options_callback', function(request, response) {
  AV.Cloud.run('choice', {choice: true}, {
    success: function(data) {
      assert.equal('OK~', data);
      AV.Cloud.run('choice', {choice: false}, {
        success: function(data) {
          assert.ifError(data);
        },
        error: function(err) {
          assert.equal('OMG...', err);
          response.success();
        }
      });
    },
    error: function(err) {
      assert.ifError(err);
    }
  });
});

AV.Cloud.define('testRun_promise', function(request, response) {
  AV.Cloud.run('choice', {choice: true}).then(function(data) {
    assert.equal('OK~', data);
    AV.Cloud.run('choice', {choice: false}).then(function(data) {
      assert.ifError(data);
    }, function(err) {
      assert.equal('OMG...', err);
      response.success();
    });
  },
  function(err) {
    assert.ifError(err);
  });
});

AV.Cloud.define('testRunWithUser', function(request, response) {
  AV.Cloud.run('testUser', {}, {
    success: function(data) {
      assert.equal('ok', data);
      response.success();
    }
  });
});

AV.Cloud.define('testRunWithAVObject', function(request, response) {
 AV.Cloud.run('complexObject', {}, {
   success: function(datas) {
     response.success(datas);
   }
 });
});

AV.Cloud.onVerified('sms', function(request) {
  assert.equal(request.object.className, '_User');
  assert.equal(request.object.id, '54fd6a03e4b06c41e00b1f40');
  assert.equal(request.object.get('username'), 'admin');
});

AV.Cloud.define('testThrowError', function(request, response) {
  var stderr_write = process.stderr.write;
  var strings = [];
  global.process.stderr.write = function(string) {
    strings.push(string);
  };
  setTimeout(function() {
    assert.deepEqual('Execute \'testThrowError\' failed with error: ReferenceError: noThisMethod is not defined', strings[0].split('\n')[0]);
    assert.equal(1, strings.length);
    global.process.stderr.write = stderr_write;
  }, 0);
  /* jshint ignore:start */
  noThisMethod();
  /* jshint ignore:end */
  response.success();
});

AV.Cloud.define("userMatching", function(req, res) {
  assert.equal(req.user, AV.User.current());
  if(req.params.assertName) {
    assert.equal(req.params.assertName, req.user.get('username'));
  } else {
    assert.equal(req.user, null);
    assert.equal(AV.User.current(), null);
  }
  setTimeout(function() {
    // 为了更加靠谱的验证串号问题，走一次网络 IO
    var query = new AV.Query('TestObject');
    query.get('55069f5be4b0c93838ed9b17', {
      success: function(obj) {
        assert.equal(req.user, AV.User.current());
        if(req.params.assertName) {
          assert.equal(req.params.assertName, req.user.get('username'));
        } else {
          assert.equal(req.user, null);
          assert.equal(AV.User.current(), null);
        }
        assert.equal(obj.get('foo'), 'bar');
        res.success({reqUser: req.user, currentUser: AV.User.current()});
      }, error: function() {
        res.success({reqUser: req.user, currentUser: AV.User.current()});
      }
    });
  }, Math.floor((Math.random() * 500) + 1));
});

AV.Insight.on('end', function(err, result) {
  assert.deepEqual({
    "id" : "job id",
    "status": "OK/ERROR",
    "message": "当 status 为 ERROR 时的错误消息"
  }, result);
});
