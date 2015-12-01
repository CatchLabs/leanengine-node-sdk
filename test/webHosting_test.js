'use strict';
var config = require('./example/config'),
  request = require('supertest'),
  should = require('should');

var appId = config.appId;
var appKey = config.appKey;

var app = config.getApp();

describe('webHosting', function() {
  it('index', function(done) {
    request(app)
      .get('/')
      .expect(200)
      .expect("Hello World!", done);
  });

  it('function_is_ok', function(done) {
    request(app)
      .post('/1/functions/foo')
      .set('X-AVOSCloud-Application-Id', appId)
      .set('X-AVOSCloud-Application-Key', appKey)
      .expect(200)
      .expect({result: "bar"}, done);
  });
  it("Should return profile.", function(done) {
    this.timeout(20000);
    return request(app).get("/profile").expect(200, function(err, res) {
      if (err) {
        throw err;
      }
      res.body.should.eql({});
      return request(app).post("/login").send({
        username: "admin",
        password: "admin"
      }).expect(302, function(err, res) {
        if (err) {
          throw err;
        }
        res.headers.location.should.equal('/profile');
        res.headers['set-cookie'][0].indexOf('avos:sess=eyJfdWlkIjoiNTRmZDZhMDNlNGIwNmM0MWUwMGIxZjQwIiwiX3Nlc3Npb25Ub2tlbiI6IncyanJ0a2JlaHAzOG90cW1oYnF1N3liczkifQ==; path=/; expires=').should.equal(0);
        res.headers['set-cookie'][1].indexOf('avos:sess.sig=jMYF3Iwhmw903-K1K12MVdAFOh0; path=/; expires=').should.equal(0);
        return request(app).get("/profile")
          .set('Cookie', 'avos:sess=eyJfdWlkIjoiNTRmZDZhMDNlNGIwNmM0MWUwMGIxZjQwIiwiX3Nlc3Npb25Ub2tlbiI6IncyanJ0a2JlaHAzOG90cW1oYnF1N3liczkifQ==; avos:sess.sig=jMYF3Iwhmw903-K1K12MVdAFOh0')
          .expect(200, function(err, res) {
          if (err) {
            throw err;
          }
          should.exist(res.body.objectId);
          return request(app).get("/logout").expect(302, function(err, res) {
            if (err) {
              throw err;
            }
            res.headers['set-cookie'][0].indexOf('avos:sess=; path=/; expires=').should.equal(0);
            res.headers.location.should.equal('/profile');
            return request(app).get("/profile").set('Cookie', 'avos:sess=; avos:sess.sig=qRTO8CJG5Ccg4ZftDVoGbuhUH90').expect(200).expect({}, done);
          });
        });
      });
    });
  });

  it("test cookie session", function(done) {
    this.timeout(20000);
    return request(app).post("/testCookieSession")
      .send({
        username: 'admin',
        password: 'admin'
      }).expect(200, done);
  });

});
