var _ = require('lodash'),
    MongoClient = require('mongodb').MongoClient,
    port = 27017,
    mongoURL,
    connect;

var generateUrl = function(obj) {
  obj.hostname = (obj.hostname || 'localhost');
  obj.port = (obj.port || 27017);
  obj.db = (obj.db || 'test');
  if (obj.username && obj.password){
    return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
  } else {
    return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
  }
};

exports.init = function(config) {
  mongoURL = generateUrl(config);
};

connect = function(callback) {
  MongoClient.connect(mongoURL, function(err, db) {
    if (err) {
      throw err;
    }

    callback(db);
  });
};

exports.upsert = function(collectionName, params, next) {
  connect(function(db) {
    var collection = db.collection(collectionName);

    collection.ensureIndex({url: 1}, {unique: true, dropDups: true}, function(err, result) {
      if (err) {
        return next(err, null);
      }
      collection.update(
        {url: params.url},
        {$inc: {count: 1}},
        {w: true, upsert: true},
        function(err, result) {
          db.close();

          next(err, result);
      });
    });
  });
};

exports.readPopular = function(collectionName, next) {
  connect(function(db) {
    var collection = db.collection(collectionName);

    collection.find().sort({count: -1}).limit(3).toArray(function(err, result) {
      db.close();

      next(err, result);
    });
  });
};
