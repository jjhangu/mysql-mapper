/**
 * Created by ddavid on 2015-08-06.
 */
var dbCon= require("./dbcon");
var queryStorage= require('./query-storage');
var queryParser= require('./query-parser');

var ExecuteManager = function(){
};
ExecuteManager.prototype.start = function (res, tasks, isTransaction, model ){
    if(isTransaction){
        console.log('transaction true');
        this.executeTransaction(res, tasks);
    }else{
        console.log('transaction false');
        // request start
        this.execute(res, tasks);
    }
}

/**
 * Trasaction Task Run
 * @param tasks
 */
ExecuteManager.prototype.executeTransaction = function(res, tasks){
    dbCon.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.json({"code": 100, "status": "Error in connection database"});
            return;
        }
        if(tasks.length>0){
            connection.beginTransaction(function(err) {
                if(tasks.length>0){
                    // query를 날리지요
                    try{
                        executeManager.query(res, connection , tasks, true );
                    }catch(e){
                        connection.rollback(function() {
                            console.error("commit error");
                        });
                        console.log("from try catch");
                        console.error(e);
                    }
                }
            });
        }else{
            connection.release();
        }
        connection.on('error', function (err) {
            res.json({"code": 100, "status": "Error in connection database"});
            return;
        });
    });};

/**
 * just Tasks Run without Transaction
 * @param res
 * @param tasks
 */
ExecuteManager.prototype.execute = function(res, tasks){
    dbCon.getConnection(function (err, connection) {

        if (err) {
            console.log(err);
            res.json({"code": 100, "status": "Error in connection database"});
            return;
        }

        if(tasks.length>0){
            // Send Query
            try{
                executeManager.query(res, connection , tasks , false);
            }catch(e){
                console.log(e);
            }
        }else{
            connection.release();
        }

        connection.on('error', function (err) {
            res.json({"code": 100, "status": "Error in connection database"});
            return;
        });
    });
};

ExecuteManager.prototype.query = function(res, connection, tasks, isTransaction){
    // get
    if(tasks.length> 0){
        // to use queue
        var task = tasks.shift();
        //console.time(tasks.length);
        var query = executeManager.getQuery(task);
        //console.timeEnd(tasks.length);
       // var query = task.testQuery;
        //console.time("query"+tasks.length);

        connection.query(query
            , function (err, rows) {
                console.timeEnd("query"+tasks.length);
                console.log(rows);
                if (!err) {
                    //res.json(list);
                        if(tasks.length> 0){
                            if(task.callback != null) {
                                try{
                                    task.callback(rows);
                                }catch(e){
                                    console.log("try catch error");
                                    if(isTransaction){
                                        connection.rollback(function() {
                                            connection.release();
                                            throw new Error('stop pc in transaction because of error');
                                        });
                                    }else{
                                        connection.release();
                                        throw new Error('stop server in not transaction because of error');
                                    }
                                }
                            }
                            executeManager.query(res, connection, tasks, isTransaction);
                        }else{
                            // if every task finish successfully
                            if(isTransaction){
                                connection.commit(function(err) {
                                    if (err) {
                                        connection.rollback(function() {
                                           console.error("commit error");
                                        });
                                    }
                                    console.log('Transaction Complete.');
                                    connection.release();
                                    res.send('completely finish inserts');
                                });
                            }else{
                                connection.release();
                                res.send('completely finish inserts');
                            }
                        }
                }else{
                    // error
                    if(isTransaction){
                        connection.rollback(function() {
                            console.error("rollback");
                            res.json({"code": 100, "status": "Error in connection database"});
                            connection.release();
                        });
                    }else{
                        console.log(err);
                        res.json({"code": 100, "status": "Error in connection database"});
                        connection.release();
                    }
                }
            });
    }
};

ExecuteManager.prototype.getQuery = function (task){
    var id = task.queryId.split('.');
    var queryMenu = id[0];
    var queryId = id[1];
    var filed = task.filed;

    var query = queryStorage.queryMap[queryMenu][queryId];
    console.log("queryMenu : " + queryMenu);
    console.log("queryId : " + queryId);
    console.log("query: " + query);
    console.log("filed : " + filed);

    var query  = queryParser.parsingQuery(query, filed);
    console.log("null filtered query: " + query);
    query = queryParser.replacingQuery(query, filed);
    console.log("changed query: " + query);
    return query;
};

var executeManager= new ExecuteManager();
module.exports = executeManager;