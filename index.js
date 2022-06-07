let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let cors = require('cors');
let dotenv = require('dotenv');
dotenv.config();
let port = process.env.PORT || 9870;
let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;
//let mongoUrl = process.env.MongoUrl;
let mongoUrl = process.env.MongoLiveUrl;
let db;

// middleware(supporting lib)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
// app.use(express.json());
//1 for checking is server is on or not
app.get('/', (req, res) => {
    res.send("Express server is running");
});

//2 to check each collection
app.get('/items/:collections', (req, res) => {
    db.collection(req.params.collections).find().toArray((err, result) => {
        if (err) throw err;
        res.send(result)
    });
});
//3 to get data of particular product
app.get('/details/:id', (req, res) => {
    let id = Number(req.params.id)
    db.collection('products').find({ id: id }).toArray((err, result) => {
        if (err) throw err;
        res.send(result)
    });
});
// 4 to check all products
app.get('/products', (req, res) => {
    db.collection('products').find().toArray((err, result) => {
        if (err) throw err;
        res.send(result)
    });
});
//5. to check orderplaced collection
app.get('/orderplaced', (req, res) => {
    db.collection('orderplaced').find().toArray((err, result) => {
        if (err) throw err;
        res.send(result)
    });
});
//6 to check products on cart
app.get('/cart', (req, res) => {
    db.collection('cart').find().toArray((err, result) => {
        if (err) throw err;
        res.send(result)
    });
});
//7 to check product on the basis or category
app.get('/products_on_category_basis', (req, res) => {
    let query = {}
    if (req.query.category && req.query.sub_category) {
        query = { category: req.query.category, sub_category: req.query.sub_category }
    } else if (req.query.category) {
        query = { category: req.query.category }
    } else if (req.query.sub_category) {
        query = { sub_category: req.query.sub_category }
    }
    db.collection('products').find(query).toArray((err, result) => {
        if (err) throw err;
        res.send(result)
    });
});
//8 to filter products on the basis of cost or category
app.get('/category_and_filter', (req, res) => {
    let query = {};
    let sort = { cost: 1 }; //-1 for decent cost and 1 for ascending cost
    let lcost = Number(req.query.lcost);
    let hcost = Number(req.query.hcost);
    if (req.query.category && req.query.sub_category) {
        query = { category: req.query.category, sub_category: req.query.sub_category, $and: [{ cost: { $gt: lcost, $lt: hcost } }] }
    } else if (req.query.category) {
        query = { category: req.query.category, $and: [{ cost: { $gt: lcost, $lt: hcost } }] }
    } else if (req.query.sub_category) {
        query = { sub_category: req.query.sub_category, $and: [{ cost: { $gt: lcost, $lt: hcost } }] }
    }
    db.collection('products').find(query).sort(sort).toArray((err, result) => {
        if (err) throw err;
        res.send(result)
    });
});
//9 to placeorder
app.post('/placeOrder', (req, res) => {
    db.collection('orderplaced').insertMany(req.body, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});
//10 to delete order
app.delete('/deleteOrder/:id', (req, res) => {
    let oid = mongo.ObjectId(req.params.id)
    db.collection('orderplaced').remove({ _id: oid }, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});
//11 to addcart of a user
app.post('/addcart', (req, res) => {
    db.collection('cart').insertMany(req.body, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});
// db.coll.update({"_id": 1}, {$push :{"array": 1}})
// db.coll.update({"_id": 1}, {$push: {scores: {$each: [90, 92, 85]}}})
//12 to add products to cart of user
app.put('/addtocart/:cartId/:productId/:quantity', (req, res) => {
    let oid = Number(req.params.cartId);
    db.collection('cart').updateOne({ cartId: oid }, {
        $push: {
            "productIds": [Number(req.params.productId), Number(req.params.quantity)]
        }
    }, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});
// db.people.update({"name":"dannie"}, {'$pull': {"interests": "guitar"}})
// db.coll.update({"_id": 1}, {$pullAll: {"array" :[3, 4, 5]}})
// db.lists.update({}, {$unset : {"interests.3" : 1 }}) 
// db.lists.update({}, {$pull : {"interests" : null}})
app.put('/removeFromCart/:cartId/:itemIndex', (req, res) => {
    let oid = Number(req.params.cartId);
    db.collection('cart').updateOne({ cartId: oid }, {
        $pull: {
            "productIds": req.params.itemIndex
        }
    }, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});
//Connection with db
MongoClient.connect(mongoUrl, (err, client) => {
    if (err) console.log(`Error While Connecting`);
    db = client.db('Amazon');
    app.listen(port, (err) => {
        if (err) throw err;
        console.log(`Express Server listening on port ${port}`)
    });
});