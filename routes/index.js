var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectId;
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://mondaysafternooninventoryassignment:fAxdi5s9zTiCSMLdbAKchzzAPs3g6bYnXPJIcMGVtVm5CBrrkQ55iiVrrazcnMkz6RgHeUnA4Ls8ACDbdcaf2g==@mondaysafternooninventoryassignment.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@mondaysafternooninventoryassignment@';

var db;

MongoClient.connect(url, function (err, client) {
  db = client.db('inventoryDB');
  console.log("DB connected");
});
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
