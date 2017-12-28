const key = require('./config.js'); //require the Auth tokens
const express = require('express'); //require express module
const bodyParser = require('body-parser'); //using the middleware for req.body, this is for the POST method
const Twit = require('twit'); //require Twit
const moment = require('moment'); //use the moment package to display time
const app = express();
const http = require('http').Server(app); //create the http server
const io = require('socket.io')(http);//The require('socket.io')(http) creates a new socket.io instance attached to the http server.
moment().format();



const T = new Twit({
  consumer_key: key.consumer_key,
  consumer_secret: key.consumer_secret,
  access_token: key.access_token,
  access_token_secret: key.access_token_secret,
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
})

app.use(bodyParser.urlencoded({ //use body parser for POST req.body
  extended: false
}));

//We are going to user pug as our template engine
app.set('view engine', 'pug'); //set the view engine to pug so we can user it
//static assets middleware
app.use('/static', express.static('public')); //public is the folder name, to access css file inside for example in the browser, search static/stylesheets/style.css


//to use promise all checkout https://stackoverflow.com/questions/40643386/promise-all-in-javascript-how-to-get-resolve-value-for-all-promises
//basic format is like:
/* Promise.all([promise1,promise2,...])
   .then(function([first, second,...]) {

}); */

//GET
app.get('/', (req, res) => {
  const template = {}; //our template object to store all related information from twitter API
  Promise.all([ //see twitter API for usage https://developer.twitter.com/en/docs
    T.get('account/verify_credentials', {
      skip_status: true
    }),
    T.get('friends/list', {
      count: 5
    }),
    T.get('statuses/user_timeline', {
      count: 5
    }),
    T.get('direct_messages', {
      count: 5
    }),
  ]).then(function([userInfo, followingInfo, timelineInfo, directMsgInfo]) { //to see the reason why we use .data on the param checkout the documentation https://github.com/ttezel/twit on promises
    getAllData(template, userInfo, followingInfo, timelineInfo, directMsgInfo); //use the helper function to collect raw data and store in template
    getRecentTweets(template, template.tweets); //using the template.tweets property, get the recent tweets text and store them in template.recentTweets
    getRecentFriends(template, template.following.users); ///using the template.following.users property, get the recent following store them in template.recentFriends
    getRecentDirectMsg(template, template.directMsg); //using the template.directMsg property, get the recent Dms store them in template.recentDirectMsg
    res.render('main', { //render main.pug with given params
      username: template.user.name,
      screen_name: template.user.screen_name,
      profile_image_url: template.user.profile_image_url_https,
      profile_background_url: template.user.profile_banner_url,
      following_count: template.user.friends_count,
      recentTweets: template.recentTweets,
      recentFriends: template.recentFriends,
      recentDirectMsg: template.recentDirectMsg
    });
  });
});

//POST
app.post('/new', (req, res) => {
  T.post('statuses/update', { //check out https://github.com/ttezel/twit
    status: req.body.userinput
  }).then(function(result) {
    res.redirect('/');
  });
});

//Custom Error Handlers
app.use((req, res, next) => {
  const err = new Error('Opps, this is not a valid page!');
  err.status = 404;
  next(err); //any request that makes it this far will trigger this function, meaning still cant find the req url
});

app.use((err, req, res, next) => { //the err object has properties that holds data about the error
  res.status(err.status);
  res.render('error', {
    err: err
  }); //render a template back to client
});

//Socket.io
//Whenever someone connects this gets executed
io.on('connection', function(socket) {
   console.log('A user connected');

   //Whenever someone disconnects this piece of code executed
   socket.on('disconnect', function () {
      console.log('A user disconnected');
   });
});

const getAllData = (result, item1, item2, item3, item4) => { //helper function to retrieve all needed data and store them in the result object
  result.user = item1.data;
  result.following = item2.data;
  result.tweets = item3.data;
  result.directMsg = item4.data;
};

const getRecentTweets = (result, data) => { // a helper function to grab recent 5 tweets  from data and store them in result.recentTweets
  result.recentTweets = [];
  data.forEach(function(item) { //checkout https://developer.twitter.com/en/docs/tweets/timelines/api-reference/get-statuses-user_timeline
    result.recentTweets.push({
      TweetText: item.text,
      Retweet: item.retweet_count,
      Like: item.favorite_count,
      CreatedAt: moment(item.created_at, 'ddd MMM DD HH:mm:ss Z YYYY').fromNow()
    });
  });
  //console.log(result.recentTweets);
};

const getRecentFriends = (result, data) => { // a helper function to grab recent 5 followings from data and store them in result.recentFriends
  result.recentFriends = [];
  data.forEach(function(item) { //checkout https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/get-friends-list
    result.recentFriends.push({
      friendName: item.name,
      friendScreenName: item.screen_name,
      friendProfileIMG: item.profile_image_url_https
    });
  });
  //console.log(result.recentFriends);
};

const getRecentDirectMsg = (result, data) => { // a helper function to grab recent 5 Dms from data and store them in result.recentFriends
  result.recentDirectMsg = [];
  data.forEach(function(item) { //checkout https://developer.twitter.com/en/docs/direct-messages/sending-and-receiving/api-reference/get-messages
    result.recentDirectMsg.push({
      recipientName: item.sender.name,
      createdAt: moment(item.created_at, 'ddd MMM DD HH:mm:ss Z YYYY').fromNow(),
      message: item.text,
      recipientProfileImg: item.sender.profile_image_url_https
    });
  });
  //console.log(result.recentDirectMsg);
};

//create the server
http.listen(3000, () => {
  console.log("The application is running on localhost:3000 !");
}); //this will create a server
