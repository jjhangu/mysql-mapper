# mysql-mapper

- [Introduction](#introduction)


## Introduction

This is a node.js driver for mysql + pool + transaction + mapper pattern 
and is 100% MIT licensed.
very easy usage and powerful.
this library updates continuously.


Here is an example on how to use it:

```js
var mysql      = require('mysql');
pool      =    mysql.createPool({
    connectionLimit : config.connectionLimit, //important
    host     : config.host,
    user     : config.user,
    password : config.password,
    database : config.database,
    debug    :  config.debug
});

var mysqlMapper= require('./user_modules/sanghwa/mysql-mapper');
mysqlMapper.setPool(dbCon);
mysqlMapper.setPath("query");
mysqlMapper.parsingStart(['test']);



... router.js
var taskM = require('.task');
var executeManager = require('.execute-manager');


router.get('/query/test', function(req, res, next) {
  var taskContext= taskM.makeTasks();
  var field = {'content': 'yaho'};

  taskContext.tasks.push(taskM.getTask('test.insert_tb_board', field, function(result){}));
  taskContext.tasks.push(taskM.getTask('test.insert_tb_board_reply', field, function(result){
    console.log('lastInsertId : ' + result.insertId);
    for(var i=0; i<4; i++){
      taskContext.tasks.unshift(taskM.getTask('test.insert_tb_board', field)); //  
    }
  }));
  taskContext.tasks.push(taskM.getTask('test.select_tb_board_reply', field, function(result){}));


  executeManager.start(res, taskContext, true);
});

```

## Query file

this show how to write querys

```
{test:insert_tb_board}
	INSERT INTO `node`.`tb_board`
		(CONTENT)
	VALUES
		('#content')
{/}

{test:insert_tb_board_reply}
	INSERT INTO `node`.`tb_board_reply`
		(`CONTENT`,  `BOARD_SEQ`)
	VALUES
		('data2', 6)
{/}

{test:select_tb_board_reply}
	select * from  tb_board
	where
		1=1
	[content]
		and content = '#content'
	[/]
	[board_seq]
       	and board_seq = '#board_seq'
	[/]
	limit 0, 100
{/}

{test:select_sleep}
	select sleep(10)
{/}


```
