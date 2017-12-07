"use strict";

/*
This means that when we send a safe request to read some information (safe as in a request that should have no side effects on the server), we should use the GET method.

When we send a request to create a resource we should use POST.

When we update a resource in an idempotent way we should use PUT, otherwise when updating in a non-idempotent way we should use POST.

If we are requesting to delete a resource, we should use DELETE.
*/

const express     = require('express'),
      bodyParser  = require('body-parser');
const app = express();
const PORT = process.env.PORT || 8080;


//--- Pug template engine ---
app.set('view engine', 'pug');
// app.set('view engine', 'ejs');

//--- Body Parser ---
app.use(bodyParser.urlencoded({extended: true}));

//--- Data ---
let urlDB = {
  b2xVn2: {
    longURL: 'http://www.lighthouselabs.ca',
    userID: '1',
  },
  '9sm5xK': {
    longURL: 'http://www.google.com',
    userID: '2',
  },
};


/*------ ****** FUNCTIONS ****** ------*/


var generateRandomString = () => {
  let text  = '',
      charset = "ABCDEFGHIJKLMNOPQRSTUABCDEFGHIJKLMNOPQRSTUVWXYZVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < 6; i++ ){
    text += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return text;
}


/*------ ****** ROUTES ****** ------*/


// --- root ---
app.get('/', (req, res) => {
  res.end("HARI OM");
});

// --- home ---
app.get("/urls", (req, res) => {
  let templateVars = {urls: urlDB};
  res.render('urls_index', templateVars);

  console.log(templateVars);
});

// --- urls_new ---
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});
  // - form handler
  app.post("/urls", (req, res) => {
    console.log('--Urls_New POST params:--\n', req.body); // debug statement to see POST params

    let shortURL = generateRandomString();

    //add the shortURL to DB with value of 'longURL: thisURL' object
    urlDB[shortURL] = {longURL: req.body.longURL};

    res.redirect(`http://localhost:8080/urls/${shortURL}`);
  });

// --- urls_show ---
app.get('/urls/:id', (req, res) => {
  let {id}    = req.params,
      {longURL} = urlDB[id];
  let templateVars = {
    shortURL: id,
    longURL: longURL
  };
  console.log(req.params);
  res.render("urls_show", templateVars);
});
// - form handler
app.post('/urls/:id/update', (req, res) =>{
  let {id} = req.params;
  urlDB[id].longURL = longURL;
  res.redirect("/urls");
});

// --- shortURL req, res to longURL ---
app.get('/u/:shortURL', (req, res) => {
  const { shortURL } = req.params;
  const { longURL } = urlDB[shortURL];

  res.redirect(longURL);
});

// --- remove url ---
app.post('/urls/:url/delete', (req, res) => {
  let {url} = req.params;
  delete urlDB[url];

  console.log(this);
  res.redirect("/urls");
});



/*------ ****** PORT Listen ****** ------*/


app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
