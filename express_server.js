var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

var urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

app.get('/', (req, res) => {
  res.end("Hello!");
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
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
})

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  //console.log(req.body); // debug statement to see POST params
  //res.send("Ok");        // Respond with 'OK' (we will replace this)
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`http://localhost:8080/urls/${shortURL}`);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    urls: urlDatabase
    };
  res.render("urls_show", templateVars);
})

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  //console.log(req);
  res.redirect(`http://${longURL}`);
})

// added post to delete url based on a shortURL
app.post("/urls/:id/delete", (req, res) => {
  //console.log(req.params);
  delete urlDatabase[req.params.id];
  res.redirect(`http://localhost:8080/urls`);
  //delete urlDatabase[req.params.id];
  //console.log(urlDatabase);
})

// added post to edit url based on a shortURL
app.post("/urls/:id", (req, res) => {
  //console.log(req.params);
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`http://localhost:8080/urls`);
  //delete urlDatabase[req.params.id];
  //console.log(urlDatabase);
})

// added post to edit url based on a shortURL
app.post("/login", (req, res) => {
  console.log(req.body);
  let username = req.body.username;
  res.end(`hello ${username}`);
  //userBase[req.params.id] = req.params.id;
  //res.redirect(`http://localhost:8080/urls`);
  //delete urlDatabase[req.params.id];
  //console.log(urlDatabase);
})

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for( var i=0; i < 6; i++ )
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}
