/**
 * Created by ddavid on 2015-08-28.
 */
var executeManager= require('./execute-manager');
var queryParser= require('./query-parser');

var mysqlMapper= function(){
};

mysqlMapper.prototype.setPath = function(path){
    queryParser.setPath(path);
}

mysqlMapper.prototype.setPool = function(pool){
    executeManager.setPool(pool);
}

mysqlMapper.prototype.parsingStart= function(arr){
    queryParser.start(arr);
}

module.exports = new mysqlMapper();