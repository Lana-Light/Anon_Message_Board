/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);
var id1;
var id2;
var id3;
var id4;

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      test('Required fields filled in', async function() {
        
        await chai.request(server)
        .post('/api/threads/test').send({
          text: 'First thread',
          delete_password: 'a'
        })
        .then(function(res) {
          assert.equal(res.status, 200);
          assert.equal(res.type, 'text/html');
          assert.equal(res.redirects[0].slice(-7), '/b/test'); 
          assert.equal(res.request._redirects, 1);     
          assert.equal(res.req.path, '/b/test');
        });
        
        await chai.request(server)
        .post('/api/threads/test')
        .send({
          text: 'Second thread',
          delete_password: 'b'
        })
        .then(function(res) {
          assert.equal(res.status, 200);
          assert.equal(res.type, 'text/html');
          assert.equal(res.redirects[0].slice(-7), '/b/test'); 
          assert.equal(res.request._redirects, 1);     
          assert.equal(res.req.path, '/b/test');
        });
       }); 
    });
    
    suite('GET', function() {
      test('Get board with threads', function(done) {
       chai.request(server)
        .get('/api/threads/test')
        .end(function(err, res) {
          assert.equal(res.status, 200);
          id1 = res.body[1]._id;
          id2 = res.body[0]._id;
          assert.property(res.body[0], '_id');
          assert.property(res.body[0], 'text');
          assert.property(res.body[0], 'created_on');
          assert.property(res.body[0], 'bumped_on');
          assert.property(res.body[0], 'replies');
          assert.notProperty(res.body[0], 'reported');
          assert.notProperty(res.body[0], 'delete_password');
          assert.isArray(res.body[0].replies);
          assert.isAtMost(res.body.length, 10);
          assert.isAtMost(res.body[0].replies.length, 3);
          done();
        });
      }); 
    });
    
    suite('DELETE', function() {
      test('Incorrect delete_password', function(done) {
       chai.request(server)
        .delete('/api/threads/test')
        .send({
          thread_id: id1,
          delete_password: 'any'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body, 'incorrect password');
          done();
        });
      }); 
      
      test('Missing required fields', function(done) {
       chai.request(server)
        .delete('/api/threads/test')
        .send({
          thread_id: id1
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body, 'incorrect password');
          done();
        });
      }); 
      
      test('Required fields filled in', function(done) {
       chai.request(server)
        .delete('/api/threads/test')
        .send({
          thread_id: id2,
          delete_password: 'b'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body, 'success');
          done();
        });
      }); 
    });
    
    suite('PUT', function() {
      test('Required fields filled in', function(done) {
       chai.request(server)
        .put('/api/threads/test')
        .send({
          thread_id: id1
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body, 'reported');
          done();
        });
      }); 
    });
    

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      test('Required fields filled in', async function() {
      
        await chai.request(server)
        .post('/api/replies/test').send({
          text: 'First reply to first thread',
          delete_password: 'c',
          thread_id: id1
        })
        .then(function(res) {
          assert.equal(res.status, 200);
          assert.equal(res.type, 'text/html');
          assert.equal(res.redirects[0].slice(-32), '/b/test/'+id1); 
          assert.equal(res.request._redirects, 1);     
          assert.equal(res.req.path, '/b/test/'+id1);
          
        });
        await chai.request(server)
        .post('/api/replies/test').send({
          text: 'Second reply to first thread',
          delete_password: 'd',
          thread_id: id1
        })
        .then(function(res) {
          assert.equal(res.status, 200);
          assert.equal(res.type, 'text/html');
          assert.equal(res.redirects[0].slice(-32), '/b/test/'+id1); 
          assert.equal(res.request._redirects, 1);     
          assert.equal(res.req.path, '/b/test/'+id1);
          
        });
       });
      test('Missing required fields', async function() {  
        await chai.request(server)
        .post('/api/replies/test')
        .send({
          text: 'Second reply',
          delete_password: 'e'
        })
        .then(function(res) {
          assert.equal(res.status, 200);
          assert.equal(res.body, 'incorrect id');
          
        });
       }); 
    });
    
    suite('GET', function() {
      test('Get thread with replies', function(done) {
       chai.request(server)
        .get('/api/replies/test')
        .query({thread_id: id1})
        .end(function(err, res) {console.log(res.body.replies[1]);
          assert.equal(res.status, 200);
          id3 = res.body.replies[0]._id;
          id4 = res.body.replies[1]._id;
          assert.property(res.body, '_id');
          assert.property(res.body, 'text');
          assert.property(res.body, 'created_on');
          assert.property(res.body, 'bumped_on');
          assert.property(res.body, 'replies');
          assert.notProperty(res.body, 'reported');
          assert.notProperty(res.body, 'delete_password');
          assert.isArray(res.body.replies);
          assert.equal(res.body.replies.length, 2);
          done();
        });
      }); 
    });
    
    suite('PUT', function() {
      test('Required fields filled in', function(done) {
       chai.request(server)
        .put('/api/threads/test')
        .send({
          thread_id: id1,
          reply_id: id4
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body, 'reported');
          done();
        });
      }); 
    });
    
    suite('DELETE', function() {
      test('Incorrect delete_password', function(done) {
       chai.request(server)
        .delete('/api/replies/test')
        .send({
          thread_id: id1,
          reply_id: id3,
          delete_password: 'any'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body, 'incorrect password');
          done();
        });
      }); 
      
      test('Missing required fields', function(done) {
       chai.request(server)
        .delete('/api/replies/test')
        .send({
          thread_id: id1
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body, 'incorrect id');
          done();
        });
      }); 
      
      test('Required fields filled in', function(done) {
       chai.request(server)
        .delete('/api/replies/test')
        .send({
          thread_id: id1,
          reply_id: id3,
          delete_password: 'c'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body, 'success');
          done();
        });
      }); 
    });
    
  });

});
