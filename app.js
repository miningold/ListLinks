
/**
 * Module dependencies.
 */

var express = require('express'),
    hbs = require('hbs'),
    fs = require('fs'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path'),
    app = express();

/////////////////////////////////////////////////
// Config Handlebars

// Expose handlebars partials registry
hbs.partials = hbs.handlebars.partials;

hbs.loadPartial = function(name) {
  var partial = hbs.partials[name];
  if (typeof partial === 'string') {
    partial = hbs.compile(partial);
    hbs.partials[name] = partial;
  }

  return partial;
};

//////////////////////////////////////////////////
// Handlebar Helpers

hbs.registerHelper("debug", function(optionalValue) {
  console.log("Current Context");
  console.log("====================");
  console.log(this);

  if (optionalValue) {
    console.log("Value");
    console.log("====================");
    console.log(optionalValue);
  }
});

hbs.registerHelper('block', function(name, options) {
  // Default to options.fn if no partial exists
  var partial = hbs.loadPartial(name) || options.fn;
  return partial(this, { data: options.hash });
});

hbs.registerHelper('partial', function(name, options) {
  hbs.registerPartial(name, options.fn);
});

//////////////////////////////////////////////////
// Handlebar Partials

hbs.registerPartial('base', fs.readFileSync(__dirname + '/views/base.hbs', 'utf8'));

/////////////////////////////////////////////////
// Config express

app.configure(function() {
  app.set('port', process.env.VMC_APP_PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hbs');
  app.use(express.favicon(__dirname + '/public/favicon.png'));
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use('/static', express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
  app.use(express.errorHandler());
});

///////////////////////////////////////////////////
// Routes



app.get('/', routes.index);

app.get('/*', routes.list);



///////////////////////////////////////////////////
// Start the app

http.createServer(app).listen(app.get('port'), function() {
  console.log("Express server listening on port " + app.get('port'));
});
