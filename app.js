require('dotenv').config({silent: true});

var express = require('express');
var compression = require('compression');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs  = require('express-handlebars');
var helpers = require('handlebars-helpers')();
var mcapi = require('mailchimp-api/mailchimp');
var helmet = require('helmet');
var session = require('express-session');
var MemoryStore = require('memorystore')(session);
recaptcha = require('express-recaptcha');

// routes
var indexRoute = require('./routes/index');
var conductRoute = require('./routes/code_of_conduct');
var subscribeRoute = require('./routes/subscribe');
var contactRoute = require('./routes/contact');
var scheduleRoute = require('./routes/schedule');
var rossRoute = require('./routes/ross');

var app = express();

// set enviroment variable
var env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';
app.locals.APP_NAME = 'Hackers Congress Paralelní Polis 2016';
app.locals.GMAP_KEY = process.env.GMAP_KEY;

var sessionSecret = process.env.SESSION_SECRET;

if (typeof sessionSecret === 'undefined') {
  throw new Error('Session key is not set');
}

// init recaptcha
recaptcha.init(process.env.CAPTCHA_SITE_KEY, process.env.CAPTCHA_SECRET_KEY);

// compress all requests
app.use(compression());

// security middleware
app.use(helmet());

// set MailChimp API key here
mc = new mcapi.Mailchimp(process.env.MAILCHIMP_KEY || undefined);

// view engine setup

app.engine('handlebars', exphbs({
  defaultLayout: 'main',
  partialsDir: ['views/partials/'],
  helpers: helpers
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

app.use(favicon(__dirname + '/assets/media/favicon/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser(sessionSecret));
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 86400000 },
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  })
}));
app.use(express.static(path.join(__dirname, 'assets'), { maxAge: 31536000 }));

app.use('/', indexRoute);
app.use('/code-of-conduct', conductRoute);
app.use('/subscribe', subscribeRoute);
app.use('/contact', contactRoute);
app.use('/schedule', scheduleRoute);
app.use('/ross', rossRoute);

// redirect old address
app.get('/eng', function(req, res) {
  res.redirect('/');
});

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace

if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
            title: 'error'
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {},
        title: 'error'
    });
});


module.exports = app;
