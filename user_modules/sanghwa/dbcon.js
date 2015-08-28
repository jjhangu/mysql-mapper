/**
 * Created by ddavid on 2015-04-16.
 */
var mysql     =    require('mysql');
var config     =    require('./properties');
var pool = null;
pool      =    mysql.createPool({
    connectionLimit : config.connectionLimit, //important
    host     : config.host,
    user     : config.user,
    password : config.password,
    database : config.database,
    debug    :  config.debug
});
console.log('createdPool');

module.exports = pool;