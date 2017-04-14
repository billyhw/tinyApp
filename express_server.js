var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;

// override with POST having ?_method=DELETE
var methodOverride = require('method-override')
app.use(methodOverride('_method'))


app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const bcrypt = require('bcrypt');
var cookieSession = require('cookie-session')


app.use(cookieSession({
  name: 'session',
  keys: ['key1','key2'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

var urlDatabase = {
  'b2xVn2': {
      url: 'www.lighthouselabs.ca',
      userID: 'userRandomID'
    },
  '9sm5xK': {
    url: 'www.google.com',
    userID: 'user2RandomID'
  }
};

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
}

function urlsForUser(id) {
  subDatabase = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      subDatabase[key] = urlDatabase[key];
    }
  }
  return subDatabase;
}

app.get('/', (req, res) => {
  res.redirect("http://localhost:8080/urls/new");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
})

app.get("/hello", (req, res) => {
  res.end("<html><body> Hello <b>World</b></body></html>\n");
})

app.get("/urls", (req, res) => {
  let subDatabase = urlsForUser(req.session.user_id);
  let templateVars = {
    urls: subDatabase,
    user: req.session.user_id
    };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: req.session.user_id
  };
  if (templateVars.user === undefined) {
    res.redirect("http://localhost:8080/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.post("/urls/new", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL].url = req.body.longURL;
  urlDatabase[shortURL].userID = req.session.user_id;
  //res.redirect(`http://localhost:8080/urls/${shortURL}`);
  res.redirect(`http://localhost:8080/urls/`);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    urls: urlDatabase,
    user: req.session.user_id
    };
  res.render("urls_show", templateVars);
})

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].url;
  res.redirect(`http://${longURL}`);
})

app.delete("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id].userID === req.session.user_id) {
    delete urlDatabase[req.params.id];
  }
  res.redirect(`http://localhost:8080/urls`);
})

app.put("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id].userID === req.session.user_id) {
    urlDatabase[req.params.id].url = req.body.longURL;
  }
  res.redirect(`http://localhost:8080/urls`);
})

app.get("/login", (req, res) => {

  let templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_login", templateVars);
});

// added post to edit url based on a shortURL
app.post("/login", (req, res) => {
  let email = req.body.email;
  let objKeys = Object.keys(users);
  let index = objKeys.map(function(x) { return users[x].email; }).indexOf(req.body.email);
  if (index === -1) {
    res.status(403);
    res.send(`${res.statusCode}: User email does not exist.`);
  }
  else {
    if (bcrypt.compareSync(users[objKeys[index]].hashed_password, req.body.password)) {
      res.status(403);
      res.send(`${res.statusCode}: password does not match.`);
    } else {
      req.session.user_id = users[objKeys[index]].id;
      res.redirect('http://localhost:8080/');
    }
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("http://localhost:8080/")
})

app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.status(400);
    res.send(`${res.statusCode}: Email and/or password cannot be empty.`);
  } else if (Object.keys(users).map(function(x) { return users[x].email; }).indexOf(req.body.email) !== -1) {
    res.status(400);
    res.send(`${res.statusCode}: Email already exist.`);
  } else {
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

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for( var i=0; i < 6; i++ )
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}
