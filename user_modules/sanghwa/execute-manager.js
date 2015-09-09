/**
 * Created by ddavid on 2015-08-06.
 */

var queryStorage= require('./query-storage');
var queryParser= require('./query-parser');
var dbCon = null;


var ExecuteManager = function(){
};

ExecuteManager.prototype.setPool = function(pool){
    dbCon = pool;
}

ExecuteManager.prototype.start = function (res, taskContext, isTransaction, model ){
    if(isTransaction){
        console.log('transaction true');
        this.executeTransaction(res, taskContext);
    }else{
        console.log('transaction false');
        // request start
        this.execute(res, taskContext);
    }
}

/**
 * Trasaction Task Run
 * @param tasks
 */
ExecuteManager.prototype.executeTransaction = function(res, taskContext){

    dbCon.getConnection(function (err, connection) {
        console.log("free " + dbCon._freeConnections.length);
        console.log("all " + dbCon._allConnections.length);
        for(var i=0; i<dbCon._allConnections.length; i++){
            //console.log(dbCon._allConnections[i].threadId);
        }
        console.log('connction');
        console.error('connected as id ' + connection.threadId);
        if (err) {
            connection.release();
            res.json({"code": 100, "status": "Error in connection database"});
            return;
        }
        if(taskContext.tasks.length>0){
            connection.beginTransaction(function(err) {
                if(taskContext.tasks.length>0){
                    // query를 날리지요
                    try{
                        executeManager.query(res, connection ,taskContext, true );
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
ExecuteManager.prototype.execute = function(res, taskContext){
    dbCon.getConnection(function (err, connection) {
        if (err) {
            console.log(err);
            res.json({"code": 100, "status": "Error in connection database"});
            return;
        }

        if(taskContext.tasks.length>0){
            // Send Query
            try{
                executeManager.query(res, connection , taskContext , false);
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

ExecuteManager.prototype.query = function(res, connection, taskContext, isTransaction){
   // get
    if(taskContext.tasks.length> 0){
        // to use queue
        var task = taskContext.tasks.shift();
        //console.time(tasks.length);
        var query = executeManager.getQuery(task);
        //console.timeEnd(tasks.length);
       // var query = task.testQuery;
        //console.time("query"+tasks.length);

        connection.query(query
            , function (err, rows) {

                //console.log(rows);
                if (!err) {
                    //res.json(list);
                        if(taskContext.tasks.length> 0){
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
                            executeManager.query(res, connection, taskContext, isTransaction);
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
                                    res.json(taskContext.model);
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
    //console.log("queryMenu : " + queryMenu);
    //console.log("queryId : " + queryId);
    //console.log("query: " + query);
    //console.log("filed : " + filed);

    var query  = queryParser.parsingQuery(query, filed);
    console.log("null filtered query: " + query);
    query = queryParser.replacingQuery(query, filed);
    console.log("changed query: " + query);
    return query;
};

var executeManager= new ExecuteManager();
module.exports = executeManager;