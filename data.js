var _ = require('lodash'),
    MongoClient = require('mongodb').MongoClient,
    port = process.env.VCAP_SERVICES || 27017,
    mongoURL = 'mongodb://localhost:' + port + '/listlinks',
    connect;

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

exports.readAll = function(collectionName, next) {
  connect(function(db) {
    var collection = db.collection(collectionName);

    collection.find().toArray(function(err, result) {
      db.close();

      next(err, result);
    });
  });
};