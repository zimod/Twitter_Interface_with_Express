const key = require('/config.js');//require the Auth tokens
const express = require('express'); //require express module
const bodyParser = require('body-parser'); //using the middleware for req.body, this is for the POST method
const Twit = require('twit');//require Twit

const app = express();

app.use(bodyParser.urlencoded({
  extended: false
}));

//We are going to user pug as our template engine
app.set('view engine', 'pug'); //set the view engine to pug so we can user it
//static assets middleware
app.use('/static',express.static('public'));//public is the folder name, to access css file inside for example in the browser, search static/stylesheets/style.css








var T = new Twit({
  consumer_key:         key.consumer_key,
  consumer_secret:      key.consumer_secret,
  access_token:         key.access_token,
  access_token_secret:  key.access_token_secret,
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})


//
//  get the list of followers, count is the limit per page
//
T.get('followers/list', {count:5},function (err, data, response) {
  //console.log(data)
})


//
//  get the list of following, count is the limit per page
//
T.get('friends/list',{count:5}, function (err, data, response) {
  //console.log(data)
})

//
//  get the recent tweets, count is the limit per page
//
T.get('statuses/user_timeline', function (err, data, response) {
  //console.log(data);
})

//
//get the recent direct messages, count is the limit per page
//
T.get('direct_messages', function (err, data, response) {
  //console.log(data);
})
