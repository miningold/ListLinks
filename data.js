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

// connect(function(db) {
//   var collection = db.collection('floor'),
//       data = [
//         {
//           totalRooms: 5,
//           specialRooms: 1,
//           combatRooms: 5,
//           minibossRooms: 1
//         },
//         {
//           totalRooms: 6,
//           specialRooms: 0,
//           combatRooms: 6,
//           minibossRooms: 1
//         },
//         {
//           totalRooms: 7,
//           specialRooms: 2,
//           combatRooms: 5,
//           minibossRooms: 0
//         },
//         {
//           totalRooms: 5,
//           specialRooms: 0,
//           combatRooms: 5,
//           minibossRooms: 1
//         }
//       ];

//   // data = [];


//   collection.remove(function(err) {
//     // db.close();

//     if (err) {
//       throw err;
//     }

//     if (!data || !data.length) {
//       db.close();
//       return;
//     }
//     collection.insert(data, {w: 1}, function(err, result) {
//       db.close();

//       if (err) {
//         throw err;
//       }
//     });
//   });
// });

// exports.create = function(collectionName, body, next) {
//   connect(function(db) {
//     var collection = db.collection(collectionName);

//     collection.insert(body, {w:1}, function(err, result) {
//       db.close();

//       next(err, result);
//     });
//   });
// };

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

// exports.readAll = function(collectionName, next) {
//   connect(function(db) {
//     var collection = db.collection(collectionName);

//     collection.find().toArray(function(err, result) {
//       db.close();

//       next(err, result);
//     });
//   });
// };

exports.readPopular = function(collectionName, next) {
  connect(function(db) {
    var collection = db.collection(collectionName);

    collection.find().sort({count: -1}).limit(3).toArray(function(err, result) {
      db.close();

      next(err, result);
    });
  });
}
