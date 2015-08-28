
// mode has dev, deploy
/**
 * Properties 파일 입니다.
 *
 * mode 에서 바꿔주면 한번에 값들이 변환됩니다.
 * 테스트 할때 mode 를 꼭 바꾸어주길
 * @type {string}
 */
var mode = 'dev'

    var properties_deploy ={
        port : '80', // 서버포트
        fileServerPath : '/nodetemp/', // 파일서버 경로
        // db
        connectionLimit : '100',
        host     : 'localhost',
        user     : 'node',
        password : 'barusoft11',
        database : 'node',
        debug    :  false
}

var properties_dev ={
    port : '3000',
    fileServerPath : '/nodetemp/',
    // db
    connectionLimit : '100',
    host     : 'localhost',
    user     : 'node',
    password : 'barusoft11',
    database : 'node',
    debug    :  false
}

if(mode =='dev'){
    properties_deploy = properties_dev;
}

module.exports = properties_deploy;
