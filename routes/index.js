var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectId;
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://mondaysafternooninventoryassignment:fAxdi5s9zTiCSMLdbAKchzzAPs3g6bYnXPJIcMGVtVm5CBrrkQ55iiVrrazcnMkz6RgHeUnA4Ls8ACDbdcaf2g==@mondaysafternooninventoryassignment.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@mondaysafternooninventoryassignment@';
var jwt = require('jsonwebtoken');
const auth = require("../middlewares/auth");
const { v4: uuidv4 } = require('uuid');
var db;

MongoClient.connect(url, function (err, client) {
  db = client.db('inventoryDB');
  console.log("DB connected");
});
/* GET home page. */
router.get('/', function (req, res, next) {
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

  // var results = await db.collection("inventory").find({ type: req.query.type }, {
  //   limit: perPage,
  //   skip: perPage * (Math.max(req.query.page - 1, 0) || 0)
  // }).toArray();
  if (req.query.type == "Book" || req.query.type == "Game") {
    var pipelines = [
      { $match: { type: req.query.type } },
      {
        $lookup:
        {
          from: "user",
          localField: "borrow",
          foreignField: "_id",
          as: "borrow"
        }
      },
      {
        $skip: perPage * (Math.max(req.query.page - 1, 0) || 0)
      },
      {
        $limit: perPage,
      }
    ];
  } else if (req.query.type == "Gift" || req.query.type == "Material") {
    var pipelines = [
      { $match: { type: req.query.type } },
      {
        $lookup:
        {
          from: "join",
          localField: "_id",
          foreignField: "itemId",
          as: "consume"
        }
      },
      {
        $skip: perPage * (Math.max(req.query.page - 1, 0) || 0)
      },
      {
        $limit: perPage,
      }
    ];
  }
  

  var results = await db.collection("inventory").aggregate(pipelines).toArray();
  // var results = await db.collection("inventory").find({ type: req.query.type }, {
  //   limit: perPage,
  //   skip: perPage * (Math.max(req.query.page - 1, 0) || 0)
  // }).toArray();
  if (req.query.type == "Book" || req.query.type == "Game") {

    var countpipelines = [
      { $match: { type: req.query.type } },
      {
        $lookup:
        {
          from: "user",
          localField: "borrow",
          foreignField: "_id",
          as: "borrow"
        }
      },
      {
        $count: "_id"
      }
    ];

  } else if (req.query.type == "Gift" || req.query.type == "Material") {
    var countpipelines = [
      { $match: { type: req.query.type } },
      {
        $lookup:
        {
          from: "join",
          localField: "_id",
          foreignField: "itemId",
          as: "consume"
        }
      },
      {
        $count: "_id"
      }
    ];

  }
 
  var pages = Math.ceil((await db.collection("inventory").aggregate(countpipelines).toArray())[0]._id);
console.log(pages);
  return res.json({ inventory: results, pages: pages })

});

/* Insert an item */
router.post('/api/inventory', async function (req, res) {

  if (req.body.year) req.body.year = parseInt(req.body.year);
  if (req.body.quantity) req.body.quantity = parseInt(req.body.quantity);
  if (req.body.amount) req.body.amount = parseInt(req.body.amount);
  if (req.body.unitPrice) req.body.unitPrice = parseInt(req.body.unitPrice);

  await db.collection("inventory").insertOne(req.body);
  res.send("Item added.");

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
    whereClause = {
      $or: [
        { title: { $regex: req.query.keyword } },
        { description: { $regex: req.query.keyword } }
      ]
    }

  }

  var perPage = Math.max(req.query.perPage, 2) || 2;

  var results = await db.collection("inventory").find(whereClause, {
    limit: perPage,
    skip: perPage * (Math.max(req.query.page - 1, 0) || 0)
  }).toArray();

  var pages = Math.ceil(await db.collection("inventory").count(whereClause) / perPage);

  return res.json({ inventory: results, pages: pages });

});

/* Login */

router.post("/api/login", async function (req, res) {

  let user = await db.collection("user").findOne({email: req.body.email,  password: req.body.password })

  if (user) {

    // const user = {};

    const token = jwt.sign(
      user, "process.env.TOKEN_KEY", {
      expiresIn: "2h",
    }
    );

    user.token = token;

    console.log(user.token)

    return res.json(user);

  } else {
    res.status(401).send("Invalid Credentials");

  }

});

/* Ajax-Pagination */
router.get('/api/user', async function (req, res) {

  var perPage = Math.max(req.query.perPage, 12) || 12;

  var results = await db.collection("user").find({}, {
    limit: perPage,
    skip: perPage * (Math.max(req.query.page - 1, 0) || 0)
  }).toArray();

  var pages = Math.ceil(await db.collection("user").count() / perPage);

  return res.json({ users: results, pages: pages })

});

/* Insert a user */
router.post('/api/user', async function (req, res) {

  await db.collection("user").insertOne(req.body);
  res.send("User added.");

});

// Form for updating a single user 
router.get('/api/user/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  let result = await db.collection("user").findOne({ _id: ObjectId(req.params.id) });

  if (!result) return res.status(404).send('Unable to find the requested resource!');

  res.json(result);

});

// Updating a single user - Ajax
router.put('/api/user/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  var result = await db.collection("user").findOneAndReplace(
    { _id: ObjectId(req.params.id) }, req.body
  );

  if (!result.value)
    return res.status(404).send('Unable to find the requested resource!');

  res.send("User updated.");

});

// Delete a single user
router.delete('/api/user/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  let result = await db.collection("user").findOneAndDelete({ _id: ObjectId(req.params.id) })

  if (!result.value) return res.status(404).send('Unable to find the requested resource!');

  return res.status(204).send();

});

// Updating borrow for single user - Ajax
router.put('/api/user/borrow/:id', auth, async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  var result = await db.collection("inventory").findOne({ _id: ObjectId(req.params.id) });
console.log(result);
  result.borrow = ObjectId(req.user._id);

  var result = await db.collection("inventory").findOneAndReplace(
    { _id: ObjectId(req.params.id) }, result
  );

  if (!result.value)
    return res.status(404).send('Unable to find the requested resource!');

  res.send("Borrow updated.");

});

// Updating return for single user - Ajax
router.put('/api/user/return/:id', auth, async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  var result = await db.collection("inventory").findOne({ _id: ObjectId(req.params.id) });
console.log(result);
  result.borrow = null;

  var result = await db.collection("inventory").findOneAndReplace(
    { _id: ObjectId(req.params.id) }, result
  );

  if (!result.value)
    return res.status(404).send('Unable to find the requested resource!');

  res.send("Item returned.");

});

/* Insert Consume record */
router.post('/api/user/consume/:id', auth, async function (req, res) {

console.log("hfdskj")

  await db.collection("join").insertOne({ userId: ObjectId(req.user._id), itemId: ObjectId(req.params.id) });

  // db.collection("join").count({itemId: req.params.id})
  res.send("Item consumed.");

});

module.exports = router;
