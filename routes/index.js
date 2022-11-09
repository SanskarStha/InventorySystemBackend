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

// GroupBy
router.get('/api/inventory/aggregate/groupby', async function (req, res) {

  const pipeline = [
    { $match: { type: { $ne: null } } },
    { $group: { _id: "$type", count: { $sum: 1 } } }
  ];

  const results = await db.collection("inventory").aggregate(pipeline).toArray();

  return res.json(results);

});

/* Ajax-Pagination */
router.get('/api/inventory', async function (req, res) {

  var perPage = Math.max(req.query.perPage, 2) || 2;

  var results = await db.collection("inventory").find({type:req.query.type}, {
    limit: perPage,
    skip: perPage * (Math.max(req.query.page - 1, 0) || 0)
  }).toArray();

  var pages = Math.ceil(await db.collection("inventory").count({type:req.query.type}) / perPage);

  return res.json({ inventory: results, pages: pages })

});

/* Insert an item */
router.post('/api/inventory', async function (req, res) {

  if (req.body.year) req.body.year = parseInt(req.body.year);
  if (req.body.quantity) req.body.quantity = parseInt(req.body.quantity);
  if (req.body.amount) req.body.amount = parseInt(req.body.amount);
  if (req.body.unitPrice) req.body.unitPrice = parseInt(req.body.unitPrice);

  let result = await db.collection("inventory").insertOne(req.body);
  res.status(201).json({ id: result.insertedId });

});

// Form for updating a single item 
router.get('/api/inventory/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  let result = await db.collection("inventory").findOne({ _id: ObjectId(req.params.id) });

  if (!result) return res.status(404).send('Unable to find the requested resource!');

  res.json(result);

});

// Updating a single Item - Ajax
router.put('/api/inventory/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  if (req.body.year) req.body.year = parseInt(req.body.year);
  if (req.body.quantity) req.body.quantity = parseInt(req.body.quantity);
  if (req.body.amount) req.body.amount = parseInt(req.body.amount);
  if (req.body.unitPrice) req.body.unitPrice = parseInt(req.body.unitPrice);

  var result = await db.collection("inventory").findOneAndReplace(
    { _id: ObjectId(req.params.id) }, req.body
  );

  if (!result.value)
    return res.status(404).send('Unable to find the requested resource!');

  res.send("Item updated.");

});

// Delete a single item
router.delete('/api/inventory/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  let result = await db.collection("inventory").findOneAndDelete({ _id: ObjectId(req.params.id) })

  if (!result.value) return res.status(404).send('Unable to find the requested resource!');

  return res.status(204).send();

});

/* Searching inventory */
router.get('/api/search/inventory', async function (req, res) {

  var whereClause = {};

  if (req.query.keyword) {
    whereClause = {$or:[
      {title: { $regex: req.query.keyword }},
      {description:{ $regex: req.query.keyword }}
    ]}

  }

  var perPage = Math.max(req.query.perPage, 2) || 2;

  var results = await db.collection("inventory").find(whereClause, {
    limit: perPage,
    skip: perPage * (Math.max(req.query.page - 1, 0) || 0)
  }).toArray();

  var pages = Math.ceil(await db.collection("inventory").count(whereClause) / perPage);
  
  return res.json({ inventory: results, pages: pages });

});

module.exports = router;
