'use strict';
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var multiparty = require('multiparty');
var assert = require('assert');
var cloud = require('./cloud'); // jshint ignore:line
var hook = require('./hook'); // jshint ignore:line
var config = require('./config');

var AV = config.getAV();

var app = express();
app.use(express.static('public'));
app.use(AV.Cloud);
app.use(bodyParser.json());
app.use(AV.Cloud.CookieSession({ secret: 'my secret', maxAge: 3600000, fetchUser: true }));

app.get('/', function (req, res) {
  res.send('Hello World!');
});

AV.Cloud.define('foo', function(req, res) {
  res.success('bar');
});

app.all('/login', function(req, res) {
    AV.User.logIn(req.body.username || req.query.username, req.body.password || req.query.password).then(
    function(user) {
        res.send(user.get('username'));
    },
    function(error) {
      res.status = 500;
      res.send(error);
    }
  );
});

app.all('/user/info', function(req, res) {
    setTimeout(function() {
        res.send(req.AV.user.get('username'));
    }, 3000);
});

app.get('/logout', function(req, res) {
  AV.User.logOut();
  res.redirect('/profile');
});

app.post('/testCookieSession', function(req, res) {
  AV.User.logIn(req.body.username, req.body.password).then(function(user) {
    assert.equal(req.body.username, user.get('username'));
    assert.equal(AV.User.current(), user);
    AV.User.logOut();
    assert(!AV.User.current());
    // 登出再登入不会有问题
    return AV.User.logIn(req.body.username, req.body.password);
  }).then(function(user) {
    assert.equal(AV.User.current(), user);
    // 在已登录状态，直接用另外一个账户登录
    return AV.User.logIn('zhangsan', 'zhangsan');
  }).then(function(user) {
    assert.equal('zhangsan', user.get('username'));
    assert.equal(AV.User.current(), user);
    res.send('ok');
  }, function(err) {
    assert.ifError(err);
  });
});

app.get('/profile', function(req, res) {
  if (req.AV.user) {
    res.send(req.AV.user);
  } else {
    res.send({});
  }
});

app.post("/userMatching", function(req, res) {
  assert.equal(req.AV.user, AV.User.current());
  if(req.body.assertName) {
    assert.equal(req.body.assertName, req.AV.user.get('username'));
  } else {
    assert.equal(req.AV.user, null);
    assert.equal(AV.User.current(), null);
  }
  setTimeout(function() {
    // 为了更加靠谱的验证串号问题，走一次网络 IO
    var query = new AV.Query('TestObject');
    query.get('55069f5be4b0c93838ed9b17', {
      success: function(obj) {
        assert.equal(req.AV.user, AV.User.current());
        if(req.body.assertName) {
          assert.equal(req.body.assertName, req.AV.user.get('username'));
        } else {
          assert.equal(req.AV.user, null);
          assert.equal(AV.User.current(), null);
        }
        assert.equal(obj.get('foo'), 'bar');
        res.send({reqUser: req.AV.user, currentUser: AV.User.current()});
      }
    });
  }, Math.floor((Math.random() * 500) + 1));
});

app.post('/upload', function(req, res){
  var form = new multiparty.Form();
  form.parse(req, function(err, fields, files) {
    var iconFile = files.iconImage[0];
    if(iconFile.size !== 0){
      fs.readFile(iconFile.path, function(err, data){
        if(err) {
          return res.send('读取文件失败');
        }
        var base64Data = data.toString('base64');
        var theFile = new AV.File(iconFile.originalFilename, {base64: base64Data});
        theFile.save().then(function(){
          res.send('上传成功！');
        }, function(err) {
          res.send(err.message);
        });
      });
    } else {
      res.send('请选择一个文件。');
    }
  });
});

module.exports = app;
