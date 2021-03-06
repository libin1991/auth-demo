const Koa = require('koa');
const app = new Koa();
const router = require('koa-router')();
const http = require('http');
const json = require('koa-json');
const bodyparser = require('koa-bodyparser');
const debug = require('debug')('demo:server');
const logger = require('koa-logger')
const koajwt = require('koa-jwt');

const config = require('./config');
const logUtil = require('./utils/log_util');

require('./lib/config/mongoose-client');

const Api = require('./lib/routes/route');

app.use(bodyparser({
    enableTypes:['json', 'form', 'text']
}));

app.use(json());
app.use(logger());

app.use(async (ctx, next) => {
    const start = new Date()
    let ms;
    try {
      await next();
      ms = new Date() - start;
      // 记录响应日志
      logUtil.logResponse(ctx, ms);
    } catch (error) {
      ms = new Date() - start;
      // 记录异常日志
      logUtil.logError(ctx, error, ms);
    }
});

app.use((ctx, next) => {
  return next().catch((err) => {
    if(err.status === 401) {
      ctx.status = 401;
      ctx.body = 'use Authorization header to get access';
    } else {
      throw err;
    }
  })
});
app.use(koajwt({
  secret: 'my_token'
}).unless({
  path: [/\/api\/v1\/login/, /\/api\/v1\/signup/]
}));

const checkToken = require('./lib/middleware/check-token');
app.use(checkToken);

router.use('/api/v1', Api.routes(), Api.allowedMethods);
app.use(Api.routes(), Api.allowedMethods());
  
const server = http.createServer(app.callback());
server.listen(config.port);
server.on('error', onError);
server.on('listening', onListening);

function onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }
  
    var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;
  
    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  }

  function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    debug('Listening on ' + bind);
  }