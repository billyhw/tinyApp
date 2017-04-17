// required modules
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

const methodOverride = require('method-override')
app.use(methodOverride('_method'))

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session')

app.use(cookieSession({
  name: 'session',
  keys: ['key1','key2'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

// hardcoded database
// date created is set as now whenever server starts.
let urlDatabase = {
  'b2xVn2': {
      url: 'www.lighthouselabs.ca',
      userID: 'userRandomID',
      numVisit: 0,
      uniqueVisitors: [],
      visitHistory: [],
      dateCreated: Date()
    },
  '9sm5xK': {
    url: 'www.google.com',
    userID: 'user2RandomID',
    numVisit: 0,
    uniqueVisitors: [],
    visitHistory: [],
    dateCreated: Date()
  }
};

// hardcoded user base
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    hashed_password: bcrypt.hashSync("purple-monkey-dinosaur",10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@examle.com",
    hashed_password: bcrypt.hashSync("dishwasher-funk",10)
  }
};

// function to find user-specific short urls
function urlsForUser(id) {
  let subDatabase = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      subDatabase[key] = urlDatabase[key];
    }
  }
  return subDatabase;
};

// At root directory
app.get('/', (req, res) => {
  // if user is not logged in, redirect to login page
  if (req.session.user_id === undefined) {
    res.redirect("http://localhost:8080/login");
  }
  // if user is logged in, go to the index page
  else {
    res.redirect("http://localhost:8080/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls", (req, res) => {
  // if not logged in, return status code 401 response and link to /login
  if (req.session.user_id === undefined) {
    res.status(401);
    res.send("<html><body> Error: You haven't logged in yet. <br> Please login <a href='http://localhost:8080/login'>here</a></body></html>\n");
  }
  // if logged in, return status code 200 and a page with urls,
  // edit button, delete buttons, link to create new short url.
  // plus <stretch> date created, number of visits, number of unique visitors </stretch>
  else {
    res.status(200)
    let subDatabase = urlsForUser(req.session.user_id);
    let templateVars = {
      urls: subDatabase,
      user: req.session.user_id,
      users: users
      };
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: req.session.user_id,
    users: users
  };
  // if not logged in, return status 401 and a link to login page
  if (req.session.user_id === undefined) {
    res.status(401);
    res.send("<html><body> Error: You haven't logged in yet. <br> Please login <a href='http://localhost:8080/login'>here</a></body></html>\n");
  }
  // if logged in, return status 200 and open add new link page.
  else {
    res.status(200);
    res.render("urls_new", templateVars);
  }
});

app.post("/urls", (req, res) => {
  // if user is not logged in
  if (req.session.user_id === undefined) {
    res.status(401);
    res.send("<html><body> Error: You haven't logged in yet. <br> Please login <a href='http://localhost:8080/login'>here</a></body></html>\n");
  } else {
    // if user is logged in, generate shortURL, add URL,
    // and make user the owner
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {};
    urlDatabase[shortURL].url = req.body.longURL;
    urlDatabase[shortURL].userID = req.session.user_id;
    urlDatabase[shortURL].numVisit = 0;
    urlDatabase[shortURL].uniqueVisitors = [];
    urlDatabase[shortURL].visitHistory = [];
    urlDatabase[shortURL].dateCreated = Date();
    res.redirect(`http://localhost:8080/urls/${shortURL}`);
  }
});

app.post("/urls/:id", (req, res) => {
  let shortURLList = Object.keys(urlDatabase);
  // if short URL as provided in :id does not exit,
  // return 404 and error message
  if (shortURLList.indexOf(req.params.id) === -1) {
    res.status(404);
    res.send(`${res.statusCode}: short URL does not exist.`);
  }
  // if not logged in, return 401 and error message with login link
  else if (req.session.user_id === undefined) {
    res.status(401);
    res.send("<html><body> Error: You haven't logged in yet. <br> Please login <a href='http://localhost:8080/login'>here</a></body></html>\n");
  }
  // if user does not own the queried short URL,
  // return 403 and error message
  else if (req.session.user_id !== urlDatabase[req.params.id].userID) {
    res.status(403);
    res.send(`${res.statusCode}: you do not have access to this short URL.`)
  }
  // if all is well, return 200 and the update form
  else {
    urlDatabase[req.params.id].url = req.body.longURL;
    res.redirect(`http://localhost:8080/urls/${req.params.id}`);
  }
});

app.get("/urls/:id", (req, res) => {
  let shortURLList = Object.keys(urlDatabase);
  // if short URL as provided in :id does not exit,
  // return 404 and error message
  if (shortURLList.indexOf(req.params.id) === -1) {
    res.status(404);
    res.send(`${res.statusCode}: short URL does not exist.`);
  }
  // if not logged in, return 401 and error message with login link
  else if (req.session.user_id === undefined) {
    res.status(401);
    res.send("<html><body> Error: You haven't logged in yet. <br> Please login <a href='http://localhost:8080/login'>here</a></body></html>\n");
  }
  // if user does not own the queried short URL,
  // return 403 and error message
  else if (req.session.user_id !== urlDatabase[req.params.id].userID) {
    res.status(403);
    res.send(`${res.statusCode}: you do not have access to this short URL.`)
  }
  // if all is well, return 200 and the update form
  // also display
  // <stretch> date created, number of visits, number of unique visitors and visit history </stretch>
  else {
    let templateVars = {
      shortURL: req.params.id,
      urls: urlDatabase,
      user: req.session.user_id,
      users: users
      };
    res.render("urls_show", templateVars);
  }
});

// redirect to the short URL link
app.get("/u/:shortURL", (req, res) => {
  // if short URL does not exist, return 404 and error message
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(404);
    res.send(`${res.statusCode}: short URL does not exist.`);
  }
  // if short URL exists, redirect to the long URL, and update visit statistics and history
  else {
    let longURL = urlDatabase[req.params.shortURL].url;
    urlDatabase[req.params.shortURL].numVisit +=  1;
    if (urlDatabase[req.params.shortURL].uniqueVisitors.indexOf(req.session.user_id) === -1) {
      urlDatabase[req.params.shortURL].uniqueVisitors.push(req.session.user_id);
    }
    urlDatabase[req.params.shortURL].visitHistory.push({
      user: req.session.user_id,
      time: Date()
    });
    res.redirect(`http://${longURL}`);
  }
});

// delete a url
app.delete("/urls/:id", (req, res) => {
  // only url owner can delete
  if (urlDatabase[req.params.id].userID === req.session.user_id) {
    delete urlDatabase[req.params.id];
  }
  res.redirect(`http://localhost:8080/urls`);
});

// update a url
app.put("/urls/:id", (req, res) => {
  // only url owner can update
  if (urlDatabase[req.params.id].userID === req.session.user_id) {
    urlDatabase[req.params.id].url = req.body.longURL;
  }
  res.redirect(`http://localhost:8080/urls`);
});

app.get("/login", (req, res) => {
  // if not logged in, return 200 and move to login page
  if (req.session.user_id === undefined) {
    res.status(200);
    let templateVars = {
      user: users[req.session.user_id],
      users: users
    };
    res.render("urls_login", templateVars);
  }
  // if logged in, return to root
  else {
    res.redirect("http://localhost:8080/");
  }
});

app.post("/login", (req, res) => {
  let email = req.body.email;
  let objKeys = Object.keys(users);
  let index = objKeys.map(function(x) { return users[x].email; }).indexOf(req.body.email);
  // if email does not exist, return 401
  if (index === -1) {
    res.status(401);
    res.send(`${res.statusCode}: User email does not exist.`);
  }
  else {
    // if password does not match, return 401
    // note the password must be decrypted
    if (! bcrypt.compareSync(req.body.password, users[objKeys[index]].hashed_password)) {
      res.status(401);
      res.send(`${res.statusCode}: password does not match.`);
    } else {
      // if login successful, create cookie and move to root
      req.session.user_id = users[objKeys[index]].id;
      res.redirect('http://localhost:8080/');
    }
  }
});

// logout
app.post("/logout", (req, res) => {
  // clear the cookie
  req.session = null;
  res.redirect("http://localhost:8080/")
});

app.get("/register", (req, res) => {
  // if not logged in, return 200 and move to register page
  if (req.session.user_id === undefined) {
    res.status(200);
    let templateVars = {
      user: users[req.session.user_id],
      users: users
    };
    res.render("urls_register", templateVars);
  } else {
    // if already logged in, move to root
    res.redirect("http://localhost:8080/");
  }
});

app.post("/register", (req, res) => {
  // if email or password not provided, return 400 and error message
  if (req.body.email === '' || req.body.password === '') {
    res.status(400);
    res.send(`${res.statusCode}: Email and/or password cannot be empty.`);
  } else if (Object.keys(users).map(function(x) { return users[x].email; }).indexOf(req.body.email) !== -1) {
    // if email already exist, return 400 and error message
    res.status(400);
    res.send(`${res.statusCode}: Email already exist.`);
  } else {
    // if register successful, create user and cookie
    let user_id = generateRandomString();
    users[user_id] = {
      id: user_id,
      email: req.body.email,
      hashed_password: bcrypt.hashSync(req.body.password,10)
    }
    req.session.user_id = user_id;
    res.redirect("http://localhost:8080/");
  }
});

// function to generate random string for user ID and short URL
function generateRandomString() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for( let i=0; i < 6; i++ )
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
};
