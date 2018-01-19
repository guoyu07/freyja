'use strict';
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { createBundleRenderer } = require('vue-server-renderer')
const fs = require('fs')

const app = express();
app.set('trust proxy', 'loopback');

if (app.get('env') === 'development'){
  app.use(logger('dev'));
} else {
  app.use(logger('combined'));
}

const session = require('express-session');
const RedisStore = require('connect-redis')(session);

app.use(cookieParser());
app.use(session(Object.assign({
    store: new RedisStore({
      prefix: 'freyja:session:',
      ...require('../config').database.redis
    })
  }, require('./config').session)
));

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(require('helmet')())

app.use('/', require('./route/index'));

require('express-simple-route')(path.join(__dirname, 'route'), app)
app.use(express.static(path.join(__dirname, 'public')));


const template = fs.readFileSync(path.join(__dirname, './client/src/html/index.html'), 'utf-8')
function createRenderer (bundle, options) {
  return createBundleRenderer(bundle, Object.assign(options, {
    template,
    runInNewContext: false
  }))
}

if (app.get('env') === 'production') {
  // In production: create server renderer using built server bundle.
  // The server bundle is generated by vue-ssr-webpack-plugin.
  const bundle = require('./client/dist/vue-ssr-server-bundle.json')
  // The client manifests are optional, but it allows the renderer
  // to automatically infer preload/prefetch links and directly add <script>
  // tags for any async chunks used during render, avoiding waterfall requests.
  const clientManifest = require('./client/dist/vue-ssr-client-manifest.json')
  const LRU = require('lru-cache')
  const renderer = createRenderer(bundle, {
    clientManifest,
    cache: LRU({
      max: 10000
    })
  })
  app.get('*', require('./middleware/server-render')(renderer))

  app.use(express.static(path.join(__dirname, 'client/dist')));
} else {
  let renderer
  const renderPromise = require('./setup-dev-server')(app)
  renderPromise.then(({bundle, options}) => {
    renderer = require('./middleware/server-render')(createRenderer(bundle, options))
  }).catch(console.error)
  app.get('*', function (req, res, next) {
    if (renderPromise && renderPromise.isFulfilled) {
      renderer(req, res, next)
    } else {
      renderPromise.then(() => {
        renderer(req, res, next)
      })
    }
  })
}


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(404).json({
    message: 'not found'
  })
});

// error handler
if (app.get('env') === 'development'){
  app.use(function (err, req, res, next) {
    console.error(err);
    if (res.headersSent) return;
    res.status(500).json({
      message: err.message,
      err,
    })
  })
} else {
  const config = require('./config')
  if (config.freyja.fundebug.enable) {
    const fundebug = require('fundebug-nodejs')
    fundebug.apikey = config.freyja.fundebug.apikey
    app.use(function (err, req, res, next) {
      res.status(500)
      next(err)
    })
    app.use(fundebug.ExpressErrorHandler)
  }
  app.use(function(err, req, res, next) {
    console.error(err);
    if (res.headersSent) return;
    res.status(500).json({
      message: err.message,
    })
  });
}

module.exports = app;
