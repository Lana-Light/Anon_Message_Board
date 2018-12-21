/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;
 
const CONNECTION_STRING = process.env.DB;

module.exports = function(app) {

    return MongoClient.connect(CONNECTION_STRING, {
            useNewUrlParser: true
        })
        .then(client => {
            var boards = client.db('cloud').collection('boards');

            app.route('/api/threads/:board')
                .get(function(req, res) {
                    var board = req.params.board;
                    boards.find({
                        board
                    }).project({
                        reported: 0,
                        delete_password: 0
                    }).limit(10).sort({
                        bumped_on: -1
                    }).toArray(async function(err, docs) {
                        if(err) {
                            res.json(err);
                        } else {
                            var threads = [];
                            var value = 0;
                            for(var val of docs) {
                                await boards.find({
                                        thread_id: val._id
                                    }).project({
                                        thread_id: 0,
                                        delete_password: 0,
                                        reported: 0
                                    }).sort({
                                        created_on: 1
                                    }).toArray().then(repl => {
                                        threads.push({
                                            _id: val._id,
                                            text: val.text,
                                            created_on: val.created_on,
                                            bumped_on: val.bumped_on,
                                            replies: repl.slice(repl.length - 3),
                                            replycount: repl.length
                                        });
                                    }, err => {
                                        threads = err.toString();
                                        value = 1;
                                    });
                                if(value) {
                                    break;
                                }
                            } 
                                res.json(threads);
                        }
                    });
                })
                .post(function(req, res) {
                    var board = req.params.board;
                    boards.insertOne({
                        board: board,
                        text: req.body.text,
                        delete_password: req.body.delete_password,
                        reported: false,
                        created_on: (new Date()),
                        bumped_on: (new Date())
                    }, function(err, doc) {
                        err? res.json(err.toString()) : res.redirect('/b/' + board);
                    });

                })
                .put(function(req, res) {
                    var _id = req.body.thread_id;
                    var error;
                    if(typeof _id == 'string') {
                        try {
                            _id = ObjectId(_id);
                        } catch (e) {
                            error = e;
                        }
                        if(!error) {
                            return boards.find({
                                _id
                            }).toArray(function(err, doc) {
                                if(err) {
                                    res.json(err);
                                } else if(!doc.length) {
                                    res.json('incorrect _id');
                                } else {
                                    boards.updateOne({
                                        _id
                                    }, {
                                        $set: {
                                            reported: true
                                        }
                                    }, function(err, doc) {
                                        err? res.json(err.toString()) : res.json('reported');
                                    });
                                }
                            });
                        }
                    }
                    res.json('incorrect id');
                })
                .delete(function(req, res) {
                    var _id = req.body.thread_id;
                    var delete_password = req.body.delete_password;
                    var error;
                    if(typeof _id == 'string') {
                        try {
                            _id = ObjectId(_id);
                        } catch (e) {
                            error = e;
                        }
                        if(!error) {
                            return boards.find({
                                _id
                            }).toArray(function(err, doc) {
                                if(err) {
                                    res.json(err);
                                } else if(!doc.length) {
                                    res.json('incorrect id');
                                } else if(doc[0].delete_password === delete_password) {
                                    boards.deleteOne({
                                        _id,
                                        delete_password
                                    }, function(err, doc) {
                                        if(err) {
                                            res.json(err);
                                        } else {
                                            boards.deleteMany({
                                                thread_id: _id
                                            }, function(err, doc) {
                                                err? res.json(err.toString()) : res.json('success');
                                            });
                                        }
                                    });
                                } else {
                                    res.json('incorrect password');
                                }
                            });
                        }
                    }
                    res.json('incorrect id');
                });

            app.route('/api/replies/:board')
                .get(function(req, res) {
                    var _id = ObjectId(req.query.thread_id);
                    boards.find({
                        _id
                    }).toArray(function(err, thread) {
                        if(err) {
                            res.json(err);
                        } else if(!thread.length) {
                            res.json({
                                text: 'no thread exists'
                            });
                        } else {
                            boards.find({
                                thread_id: _id
                            }).project({
                                thread_id: 0,
                                delete_password: 0,
                                reported: 0
                            }).sort({
                                created_on: 1
                            }).toArray(function(err, repl) {
                                if(err) {
                                    res.json(err);
                                } else {
                                    res.json({
                                        _id: thread[0]._id,
                                        text: thread[0].text,
                                        created_on: thread[0].created_on,
                                        bumped_on: thread[0].bumped_on,
                                        replies: repl
                                    });
                                }
                            });
                        }
                    });
                })
                .post(function(req, res) {
                    var board = req.params.board;
                    var thread_id = req.body.thread_id;
                    var error;
                    if(typeof thread_id == 'string') {
                        try {
                            thread_id = ObjectId(thread_id);
                        } catch (e) {
                            error = e;
                        }
                        if(!error) {
                            return boards.find({
                                _id: thread_id
                            }).toArray(function(err, doc) {
                                if(err) {
                                    res.json(err);
                                } else if(!doc.length) {
                                    res.json('incorrect id');
                                } else {
                                    boards.insertOne({
                                        thread_id,
                                        text: req.body.text,
                                        created_on: new Date(),
                                        delete_password: req.body.delete_password,
                                        reported: false
                                    }, function(err, doc) {
                                        if(err) {
                                            res.json(err);
                                        } else {
                                            boards.updateOne({
                                                _id: thread_id
                                            }, {
                                                $currentDate: {
                                                    bumped_on: {
                                                        $type: 'date'
                                                    }
                                                }
                                            }, function(err, doc) {
                                                err? res.json(err.toString()) : res.redirect('/b/' + board + '/' + req.body.thread_id);
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    }
                    res.json('incorrect id');
                })
                .put(function(req, res) {
                    var thread_id = req.body.thread_id;
                    var _id = req.body.reply_id;
                    var error;
                    if(typeof thread_id == 'string' && typeof _id == 'string') {
                        try {
                            thread_id = ObjectId(thread_id);
                            _id = ObjectId(_id);
                        } catch (e) {
                            error = e;
                        }
                        if(!error) {
                            return boards.find({
                                _id,
                                thread_id
                            }).toArray(function(err, doc) {
                                if(err) {
                                    res.json(err);
                                } else if(!doc.length) {
                                    res.json('incorrect id');
                                } else {
                                    boards.updateOne({
                                        _id
                                    }, {
                                        $set: {
                                            reported: true
                                        }
                                    }, function(err, doc) {
                                        err? res.json(err.toString()) : res.json('reported');
                                    });
                                }
                            });
                        }
                    }
                    res.json('incorrect id');
                })
                .delete(function(req, res) {
                    var thread_id = req.body.thread_id;
                    var _id = req.body.reply_id;
                    var error;
                    var delete_password = req.body.delete_password;
                    if(typeof thread_id == 'string' && typeof _id == 'string') {
                        try {
                            thread_id = ObjectId(thread_id);
                            _id = ObjectId(_id);
                        } catch (e) {
                            error = e;
                        }
                        if(!error) {
                            return boards.find({
                                _id,
                                thread_id
                            }).toArray(function(err, doc) {
                                if(err) {
                                    res.json(err);
                                } else if(!doc.length) {
                                    res.json('incorrect id');
                                } else if(doc[0].delete_password === delete_password) {
                                    boards.findOneAndUpdate({
                                        _id
                                    }, {
                                        $set: {
                                            text: '[deleted]'
                                        }
                                    }, function(err, doc) {
                                        err? res.json(err.toString()) : res.json('success');
                                    });

                                } else {
                                    res.json('incorrect password');
                                }
                            });
                        }
                    }
                    res.json('incorrect id');
                });

        }, err => {
            console.log(err);
        });

};