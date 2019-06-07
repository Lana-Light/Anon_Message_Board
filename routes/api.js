/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

'use strict';

const expect = require('chai').expect;
const MongoClient = require('mongodb');
const ObjectId = require('mongodb').ObjectID;
const express = require('express');

const CONNECTION_STRING = process.env.DB;

module.exports = function() {
  const app = express.Router();
  return MongoClient.connect(CONNECTION_STRING, {
    useNewUrlParser: true,
  }).then(
    client => {
      const boards = client.db('cloud').collection('boards');
      /*boards
          .deleteMany({})
          .then(
            res => console.log("success"),
            err => console.log("error", err)
          ).then(res=>boards
              .insertOne({board:'b'})).then(res=>
          boards.findOneAndUpdate({board:'b'},{$set:{text:'b1'}},{returnOriginal:false})
        ).then(res=>{console.log('updated',res.value);
          boards.findOne({board:'b2'}).then(b=>console.log('board',b));
        },console.log);*/
      app
        .route('/api/threads/:board')
        .get(async function(req, res) {
          const board = req.params.board;
          try {
            const threadDocs = await boards
              .find({
                board,
              })
              .project({
                reported: 0,
                delete_password: 0,
              })
              .limit(10)
              .sort({
                bumped_on: -1,
              })
              .toArray();
            let threads = [];
            for (let val of threadDocs) {
              const repl = await boards
                .find({
                  thread_id: val._id,
                })
                .project({
                  thread_id: 0,
                  delete_password: 0,
                  reported: 0,
                })
                .sort({
                  created_on: 1,
                })
                .toArray();
              const sliceStart = repl.length > 3 ? repl.length - 3 : 0;
              threads.push({
                _id: val._id,
                text: val.text,
                created_on: val.created_on,
                bumped_on: val.bumped_on,
                replies: repl.slice(sliceStart),
                replycount: repl.length,
              });
            }
            res.json(threads);
          } catch (err) {
            console.log(err);
            res.json('error');
          }
        })
        .post(function(req, res) {
          const board = req.params.board;
          boards
            .insertOne({
              board: board,
              text: req.body.text,
              delete_password: req.body.delete_password,
              reported: false,
              created_on: new Date(),
              bumped_on: new Date(),
            })
            .then(doc => res.redirect('/b/' + board), err => res.json('error'));
        })
        .put(async function(req, res) {
          let _id = req.body.thread_id;
          try {
            _id = ObjectId(_id);
            try {
              const thread = await boards.findOneAndUpdate(
                {
                  _id,
                },
                {
                  $set: {
                    reported: true,
                  },
                }
              );
              thread.value ? res.json('reported') : res.json('incorrect_id');
            } catch (err) {
              res.json('error');
            }
          } catch (e) {
            res.json('incorrect id');
          }
        })
        .delete(async function(req, res) {
          let _id = req.body.thread_id;
          const delete_password = req.body.delete_password;
          try {
            _id = ObjectId(_id);
            try {
              const thread = await boards.findOne({
                _id,
              });
              if (!thread) {
                return res.json('incorrect id');
              } else if (thread.delete_password !== delete_password) {
                return res.json('incorrect password');
              }
              await boards.deleteOne({
                _id,
                delete_password,
              });
              await boards.deleteMany({
                thread_id: _id,
              });
              res.json('success');
            } catch (err) {
              res.json('error');
            }
          } catch (err) {
            res.json('incorrect id');
          }
        });

      app
        .route('/api/replies/:board')
        .get(async function(req, res) {
          let _id = ObjectId(req.query.thread_id);
          try {
            const thread = await boards.findOne({
              _id,
            });
            if (!thread) {
              return res.json({
                text: 'no thread exists',
              });
            }
            const repl = await boards
              .find({
                thread_id: _id,
              })
              .project({
                thread_id: 0,
                delete_password: 0,
                reported: 0,
              })
              .sort({
                created_on: 1,
              })
              .toArray();
            res.json({
              _id: thread._id,
              text: thread.text,
              created_on: thread.created_on,
              bumped_on: thread.bumped_on,
              replies: repl,
            });
          } catch (err) {
            res.json('error');
          }
        })
        .post(async function(req, res) {
          const board = req.params.board;
          let thread_id = req.body.thread_id;
          try {
            thread_id = ObjectId(thread_id);
            try {
              const thread = await boards.findOne({
                _id: thread_id,
              });
              if (!thread) {
                return res.json('incorrect id');
              }
              await boards.insertOne({
                thread_id,
                text: req.body.text,
                created_on: new Date(),
                delete_password: req.body.delete_password,
                reported: false,
              });
              await boards.updateOne(
                {
                  _id: thread_id,
                },
                {
                  $currentDate: {
                    bumped_on: {
                      $type: 'date',
                    },
                  },
                }
              );
              res.redirect('/b/' + board + '/' + req.body.thread_id);
            } catch (err) {
              res.json('error');
            }
          } catch (e) {
            res.json('incorrect id');
          }
        })
        .put(async function(req, res) {
          let thread_id = req.body.thread_id;
          let _id = req.body.reply_id;
          try {
            thread_id = ObjectId(thread_id);
            _id = ObjectId(_id);
            try {
              const reply = await boards.findOneAndUpdate(
                {
                  _id,
                  thread_id,
                },
                {
                  $set: {
                    reported: true,
                  },
                }
              );
              reply.value ? res.json('reported') : res.json('incorrect id');
            } catch (err) {
              res.json('error');
            }
          } catch (e) {
            res.json('incorrect id');
          }
        })
        .delete(async function(req, res) {
          let { thread_id, reply_id: _id, delete_password } = req.body;
          try {
            thread_id = ObjectId(thread_id);
            _id = ObjectId(_id);
            try {
              const reply = await boards.findOne({
                _id,
                thread_id,
              });
              if (!reply) {
                return res.json('incorrect id');
              } else if (reply.delete_password !== delete_password) {
                return res.json('incorrect password');
              }
              await boards.findOneAndUpdate(
                {
                  _id,
                },
                {
                  $set: {
                    text: '[deleted]',
                  },
                }
              );
              res.json('success');
            } catch (err) {
              res.json('error');
            }
          } catch (e) {
            res.json('incorrect id');
          }
        });
      return app;
    },
    err => {
      console.log(err);
    }
  );
};
