var express = require('express');
var app = express();
var path=require('path')
const {ObjectId} = require('mongodb'); // or ObjectID 
//var router = express.Router();
var userAuth=require('./user_controller/userVerify.js')
var orderFs=require("./db_controller/dbOrders.js")
var menuFs=require("./db_controller/dbMenu.js")


var publicPath=path.resolve(__dirname, "static" );
app.use(express.static(publicPath))

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

var session=require('express-session')

var sess = {
  secret: 'keyboard cat',
  cookie: {}
}


app.use(session(sess))

var MongoClient = require('mongodb').MongoClient;
var db,menu;
var dbURL="mongodb://pizza1:pizza1@localhost:27017/pizzadb"

var args = process.argv.slice(2)

if(args=="dev"){
  var dbURL="mongodb://pizza1:pizza1@localhost:27017/pizzadb"

  MongoClient.connect(dbURL, 
          function(err, database) {
  if(err) throw err;

  db=database.db("pizzadb")
 
  // Start the application after the database connection is ready
  app.listen(8000);
  console.log("Listening on port 8000");
});
}
  else
  {
    console.log("production")
    const PORT = process.env.PORT || 8000
    var dbURL = "mongodb://pizza1:pizza1@ds225010.mlab.com:25010/heroku_t3r61w1t"
    MongoClient.connect(dbURL, function(err, database){
      if(err) throw err;

      db=database.db("heroku_jvbbsrsm")
      app.listen(PORT);
      console.log("listening on port "+PORT)
    });
  }

app.get('/', function(req, res){
  res.sendFile(`${publicPath}/orders.html`)
});

app.get('/menus', function(req,res) {
  console.log('/menus from admin')
  if (req.session.user)
    res.sendFile(`${publicPath}/adminMenus.html`)
  else
    res.sendFile(`${publicPath}/adminLogin.html`)
});
//demo destroy session when get /logout
app.get('/logout',function(req,res){
  req.session.destroy(function(){
    console.log('destroy the session')
    res.redirect('/orders.html')
  })
  /* body...*/
})
app.get('/showOrders',function(req,res){
  console.log(req.query.date)
  var day=new Date(req.query.date)
  console.log("day:"+day)
  var nextDay=new Date()
  nextDay.setDate(day.getDate()+1)
  console.log(nextDay)
  var strDay=day.toISOString().slice(0,10);
  var strNextDay=nextDay.toISOString().slice(0,10);
  console.log(strDay+" "+strNextDay)
var query={$and:
      [
        {date:{$gt:new Date(strDay)}},
        {date:{$lt:new Date(strNextDay)}}
      ]
    }
    console.log(query)
      orderFs.findOrderItems(res,query)
});
app.post("/updateMenu",function(req,res) {
  console.log(req.body)
  var data=req.body
  var query={_id:ObjectId(data._id)}
  var update={$set:{pizzaName:data.pizzaName,
                              description:data.description,
                              price:data.price,
                              imgName:data.imgName}}
  menuFs.updateMenu(res,query,update)
});

app.use('/adminLogin',userAuth)

app.post("/deleteOrder",function (req,res) {
  var data=req.body
 console.log("deleted:"+JSON.stringify(data))
 console.log(data._id)
 var query={_id:ObjectId(data._id)}
 orderFs.deleteOrders(res,query)
});

var getDb = function() {
  return db
};

var getPublicPath=function(){
  return publicPath
};
// module.exports.dbFunc = getDb;
module.exports.getDb=getDb
module.exports.getPublicPath=getPublicPath


