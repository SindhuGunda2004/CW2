// import dependencies modules
const express = require('express');
const app = express();
var path = require("path");
var fs = require("fs");

// CORS middleware
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    next();
});

app.use((req, res, next) => {
    console.log(req.method, req.originalUrl);
    next(); // Call next middleware in the chain
})

// creating express instance 
app.use(express.json());
app.set('port', 3000);

// connecting to MongoDB
const MongoClient = require("mongodb").MongoClient;

let db;

MongoClient.connect('mongodb+srv://sg1592:9SGO6VoIXmX0GKAv@cluster1.ls1e43h.mongodb.net', (err, client) => {
    db = client.db('AfterSchool');
});

// display a message for root path to show that API is working
app.get('/', (req, res, next) => {
    res.send('Select a collection /collection/messages');
});

// get collection name
app.param('collectionName', (req, res, next, collectionName) => {
    req.collection = db.collection(collectionName);
    return next();
});

app.get('/collection/:collectionName', (req, res, next) => {
    // finding the collection and converting it to readable format using toArray
    // the e is if there is an error else it will give the results 
    req.collection.find({}).toArray((e, results) => {
        if (e) return next(e);
        res.send(results);
    })
});

app.get('/lessons', (req, res, next) => {
    // finding the collection and converting it to readable format using toArray
    // the e is if there is an error else it will give the results 
    req.collection = db.collection("Lessons");
    req.collection.find({}).toArray((e, results) => {
        if (e) return next(e);
        res.send(results);
    })
});

app.post('/collection/:collectionName', (req, res, next) => {
    req.collection.insert(req.body, (e, results) => {
        if (e) return next(e)
        // this .ops is written so that when data is stored into mongoDB it will be given the unique ID for each product
        res.send(results.ops)
    });
});

const ObjectID = require("mongodb").ObjectID;

app.get('/collection/:collectionName/search/:searchQuery', (req, res, next) => {
    // Extracting the search query from the request parameters and converting to lowercase
    const searchQuery = req.params.searchQuery.toLowerCase();

    // Using the find method with case-insensitive search on both subject and location fields
    req.collection.find({
        $or: [
            { subject: { $regex: new RegExp(searchQuery, 'i') } },
            { location: { $regex: new RegExp(searchQuery, 'i') } }
        ]
    }).toArray((err, results) => {
        if (err) return next(err);

        // Sending the filtered results as the response
        res.send(results);
    });
});


// Serve images using express.static
app.use('/images', express.static(path.join(__dirname, 'static', 'images')));

// Error handling for images
app.use(function (request, response, next) {
    response.status(404).send("Image not found");
    console.log("file not found");
});

app.get('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.findOne({ _id: new ObjectID(req.params.id) },
        (e, result) => {
            if (e) next(e)
            res.send(result)
        })
});


app.put('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.update(
        { _id: new ObjectID(req.params.id) },
        { $set: req.body },
        { safe: true, multi: false },
        (e, result) => {
            if (e) return next(e)
            res.send((result.result.n === 1) ? { msg: "success" } : { msg: "error" })
        }
    );
});

app.delete('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.deleteOne(
        { _id: new ObjectID(req.params.id) }, (e, result) => {
            if (e) return next(e)
            res.send((result.result.n === 1) ? { msg: "success" } : { msg: "error" });
        }
    );
});

// for AWS
const port = process.env.PORT || 3000
app.listen(port)
