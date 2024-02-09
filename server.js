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

// logger middleware, it will return all the operations performed by user to console
app.use((req, res, next) => {
    console.log(req.method, req.originalUrl);
    next();
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

// this middleware is to tell that where ever there is collectionName in the link, 
// this middleware has to be executed first
app.param('collectionName', (req, res, next, collectionName) => {
    req.collection = db.collection(collectionName);
    return next();
});

// get method 
app.get('/collection/:collectionName', (req, res, next) => {
    // finding the collection and converting it to readable format using toArray
    // the e is if there is an error else it will give the results 
    req.collection.find({}).toArray((e, results) => {
        if (e) return next(e);
        res.send(results);
    })
});

// this middleware returns all lessons in json format
app.get('/lessons', (req, res, next) => {
    // finding the collection and converting it to readable format using toArray
    // the e is if there is an error else it will give the results 
    req.collection = db.collection("Lessons");
    req.collection.find({}).toArray((e, results) => {
        if (e) return next(e);
        res.send(results);
    })
});

// post method to store data into orders table
app.post('/collection/:collectionName', (req, res, next) => {
    req.collection.insert(req.body, (e, results) => {
        if (e) return next(e)
        // this .ops is written so that when data is stored into mongoDB it will be given the unique ID for each product
        res.send(results.ops)
    });
});

const ObjectID = require("mongodb").ObjectID;

// get method for search funstion
app.get('/collection/:collectionName/search/:searchQuery', (req, res, next) => {
    // Extracting the search query from the request parameters and converting to lowercase
    const searchQuery = req.params.searchQuery.toLowerCase();

    // using find to get the matching records
    req.collection.find({
        $or: [
            // the regex expressions are for case insenstive search
            { subject: { $regex: new RegExp(searchQuery, 'i') } },
            { location: { $regex: new RegExp(searchQuery, 'i') } }
        ]
    }).toArray((err, results) => {
        if (err) return next(err);

        // Sending the filtered results as the response
        res.send(results);
    });
});

// app.get('/collection/:collectionName/:id', (req, res, next) => {
//     req.collection.findOne({ _id: new ObjectID(req.params.id) },
//         (e, result) => {
//             if (e) next(e)
//             res.send(result)
//         })
// });

// put method to upadte the avalibale slots of the lessons
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

// Image handler middleware
app.get('/images/:imageName', (req, res, next) => {
    // images are stored inside a file in static file, so thats why static and images are mentioned
    const imagePath = path.join(__dirname, 'static', 'images', req.params.imageName);
    res.sendFile(imagePath);
});

// Error handling for images
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Image not found, Maybe you typed the image name wrong!!');
});

// port listening format for AWS 
const port = process.env.PORT || 3000
app.listen(port)
