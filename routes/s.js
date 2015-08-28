var express = require('express');
var router = express.Router();
var mysql = require('mysql');

var taskM = require('../user_modules/sanghwa/task');
var executeManager = require('../user_modules/sanghwa/execute-manager');
var queryParser= require('../user_modules/sanghwa/query-parser');
var queryStorage= require('../user_modules/sanghwa/query-storage');

/**
 *  test url
 *  1. 127.0.0.1:3000/s/nottransactionTest/test1
 *  2.http://172.16.234.38:3000/s/query/test4
 */

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* GET s */
router.get('/insert/user', function(req, res, next) {
  res.send('this first time to check url pattern');
});

router.get('/file/read', function(req, res, next) {


  var queryarr = queryStorage.queryMap['test'];
  console.log(queryarr['select_tb_board_reply']);

  res.send('fileRead Complete');
  // time check
  console.time('1');
  for(var i=0; i<5; i++){

  }
  console.timeEnd('1');
});

router.get('/nottransactionTest/test1', function(req, res, next) {
  var tasks = taskM.makeTasks();

  var query = "INSERT INTO `node`.`tb_board` (CONTENT)   VALUES  ('hoho2')";
  var query2 = "INSERT INTO `node`.`tb_board_reply` (`CONTENT`,  `BOARD_SEQ`)  VALUES  (      'data2',      6)";

  tasks.push(taskM.getTask('','','',function(){}, query));
  tasks.push(taskM.getTask('','','',function(){}, query2));

  executeManager.start(res, tasks, false);
});

router.get('/nottransactionTest/test2', function(req, res, next) {
  var tasks = taskM.makeTasks();

  var query = "INSERT INTO `node`.`tb_board` (CONTENT)   VALUES  ('hoho2')";
  var query2 = "INSERT INTO `node`.`tb_board_reply` (`CONTENT`,  `BOARD_SEQ`)  VALUES  (      'data2',      6)";

  tasks.push(taskM.getTask('','','',function(){}, query));
  tasks.push(taskM.getTask('','','',function(){}, query2));

  executeManager.start(res, tasks, false);
});

router.get('/query/test3', function(req, res, next) {
  var tasks = taskM.makeTasks();
  //var field = {'content': 'yaho', 'board_seq' : 45};
  var field = {'content': 'yaho'};

  tasks.push(taskM.getTask('test','insert_tb_board', field, function(){}));
  tasks.push(taskM.getTask('test','select_tb_board_reply', field, function(){}));

  executeManager.start(res, tasks, false);
});

router.get('/query/test4', function(req, res, next) {
  var tasks = taskM.makeTasks();
  var field = {'content': 'yaho'};

  tasks.push(taskM.getTask('test.insert_tb_board', field, function(result){}));
  tasks.push(taskM.getTask('test.insert_tb_board_reply', field, function(result){
    console.log('lastInsertId : ' + result.insertId);

    for(var i=0; i<4; i++){
      //tasks.push(taskM.getTask('test.insert_tb_board', field));  // tasks의 마지막에 쿼리를 추가
      tasks.unshift(taskM.getTask('test.insert_tb_board', field)); // tasks의 처음에 쿼리를 추가
    }
  }));
  tasks.push(taskM.getTask('test.select_tb_board_reply', field, function(result){}));

  executeManager.start(res, tasks, false);
});

router.get('/query/test5', function(req, res, next) {
  var tasks = taskM.makeTasks();
  var field = {'content': 'yaho'};

  tasks.push(taskM.getTask('test.insert_tb_board', field, function(result){}));
  tasks.push(taskM.getTask('test.insert_tb_board_reply', field, function(result){
    for(var i=0; i<4; i++){
      //tasks.push(taskM.getTask('test.insert_tb_board', field));  // tasks의 마지막에 쿼리를 추가
      tasks.unshift(taskM.getTask('test.insert_tb_board', field)); // tasks의 처음에 쿼리를 추가
    }
  }));
  tasks.push(taskM.getTask('test.select_tb_board_reply', field, function(result){}));

  executeManager.start(res, tasks, true);
});


router.get('/query/rollback/test5', function(req, res, next) {
  var tasks = taskM.makeTasks();
  var field = {'content': 'yaho'};

  tasks.push(taskM.getTask('test.insert_tb_board', field, function(result){}));
  tasks.push(taskM.getTask('test.insert_tb_board_reply', field, function(result){
    console.log('lastInsertId : ' + result.insertId);
    throw new Error('강제발생');
    for(var i=0; i<4; i++){
      //tasks.push(taskM.getTask('test.insert_tb_board', field));  // tasks의 마지막에 쿼리를 추가
      tasks.unshift(taskM.getTask('test.insert_tb_board', field)); // tasks의 처음에 쿼리를 추가
    }
  }));
  tasks.push(taskM.getTask('test.select_tb_board_reply', field, function(result){}));

  executeManager.start(res, tasks, true);
});

router.get('/nottransactionTest/queryparser', function(req, res, next) {

  var data = [];
  queryParser.parsingQuery("INSERT INTO `node`.`tb_board_reply`  (`CONTENT`,  `BOARD_SEQ`)  VALUES  ('data2', 6)', '')", []);
  queryParser.parsingQuery("select * from  tb_board_reply where 1=1 [content] and content = '#content#' [/]", data);

  data['content'] = 'new val ';
  queryParser.parsingQuery("select * from  tb_board_reply where 1=1 [content] and content = '#content#' [/]", data);
  queryParser.parsingQuery("select * from  tb_board_reply where 1=1 [content] and content = '#content#' [/] and content ='ggg' [content] and content = '#content#' [/] [seq] and content = '#content#' [/]", data);

  res.send('transaction finished');
});

router.get('/transactionTest/rollback', function(req, res, next) {
  var connection = mysql.createConnection(
      {
        host     : 'localhost',
        user     : 'node',
        password : 'barusoft11',
        database : 'node'
      }
  );

  connection.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
    console.log('connected as id ' + connection.threadId);
  });
  connection.beginTransaction(function(err) {
    if (err) { throw err; }
    connection.query('INSERT INTO tb_board SET content=?', 'content ddd', function(err, result) {
      console.log('result ' + result);

      if (err) {
        return connection.rollback(function() {
          connection.end(function(err) {
            // The connection is terminated now
          });
          throw err;
        });
      }

      var log = 'Post ' + result.insertId + ' added';

      connection.query('INSERT INTO log SET data=?', log, function(err, result) {
        if (err) {
          return connection.rollback(function() {
            connection.end(function(err) {
              // The connection is terminated now
            });
            throw err;
          });
        }
        connection.commit(function(err) {
          if (err) {
            return connection.rollback(function() {
              connection.end(function(err) {
                // The connection is terminated now
              });
              throw err;
            });
          }else{
            connection.end(function(err) {
              // The connection is terminated now
            });
            console.log('success!');
          }
        });
      });
    });
  });
  res.send('transaction finished');
});

router.get('/transactionTest/commit', function(req, res, next) {

  var connection = mysql.createConnection(
      {
        host     : 'localhost',
        user     : 'node',
        password : 'barusoft11',
        database : 'node'
      }
  );

  connection.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
    console.log('connected as id ' + connection.threadId);
  });
  connection.beginTransaction(function(err) {
          if (err) { throw err; }
          connection.query('INSERT INTO tb_board SET content=?', 'content ddd', function(err, result) {
            if (err) {
              return connection.rollback(function() {
                connection.end(function(err) {
                  // The connection is terminated now
                });
                throw err;
              });
      }

      console.log(result);
      var log = 'Post ' + result.insertId + ' added';
      var qu = 'INSERT INTO tb_board_reply (BOARD_SEQ, CONTENT)   VALUES (?, ?)';
      connection.query(qu, [result.insertId, 'DDDED'], function(err, result) {
        if (err) {
          return connection.rollback(function() {
            connection.end(function(err) {
              // The connection is terminated now
            });
            throw err;
          });
        }
        connection.commit(function(err) {
          if (err) {
            return connection.rollback(function() {
              connection.end(function(err) {
                // The connection is terminated now
              });
              throw err;
            });
          }else{
            connection.end(function(err) {
              // The connection is terminated now
            });
            console.log('success!');
          }
        });
      });
    });
  });
  res.send('transaction finished');
});

router.get('/transactionTest/commit', function(req, res, next) {
});
module.exports = router;