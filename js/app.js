const key = require('./config.js'); //require the Auth tokens
const express = require('express'); //require express module
const bodyParser = require('body-parser'); //using the middleware for req.body, this is for the POST method
const Twit = require('twit'); //require Twit

const app = express();

const T = new Twit({
  consumer_key: key.consumer_key,
  consumer_secret: key.consumer_secret,
  access_token: key.access_token,
  access_token_secret: key.access_token_secret,
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
})

app.use(bodyParser.urlencoded({
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
      following_count: template.user.friends_count,
      recentTweets: template.recentTweets,
      recentFriends: template.recentFriends,
      recentDirectMsg: template.recentDirectMsg
    });
  });
});

//POST
app.post('/new', (req, res) => {
  T.post('statuses/update', {
    status: req.body.userinput
  }).then(function(result){
     res.redirect('/');
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
      CreatedAt: item.created_at
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
      createdAt: item.created_at,
      message: item.text,
      recipientProfileImg: item.sender.profile_image_url_https
    });
  });
  //console.log(result.recentDirectMsg);
};

//create the server
const server = app.listen(3000, () => {
  console.log("The application is running on localhost:3000 !");
}); //this will create a server
