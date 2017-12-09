"use strict";

/*
This means that when we send a safe request to read some information (safe as in a request that should have no side effects on the server), we should use the GET method.

When we send a request to create a resource we should use POST.

When we update a resource in an idempotent way we should use PUT, otherwise when updating in a non-idempotent way we should use POST.

If we are requesting to delete a resource, we should use DELETE.
*/

const express       = require('express'),
      bodyParser    = require('body-parser'),
      cookieSession = require('cookie-session'),
      bcrypt        = require('bcrypt');
const app = express();
const PORT = process.env.PORT || 8080;


//--- Pug template engine ---
  // - because why EJS... why?
app.set('view engine', 'pug');

//--- Passwords ---
const saltRounds = 10;

//--- Middlewares---
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['Cody'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

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
let usersDB = {
  1: {
    id: '1',
    email: 'user@example.com',
    password: 'p',
  },
  2: {
    id: '2',
    email: 'user2@example.com',
    password: 'dishwasher-funk',
  },
};


/*------ ****** FUNCTIONS ****** ------*/


// function to add
  // - add http:// to url input so user does not have to


var generateRandomString = () => {
  let text  = '',
      charset = "ABCDEFGHIJKLMNOPQRSTUABCDEFGHIJKLMNOPQRSTUVWXYZVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < 6; i++ ){
    text += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return text;
};

var emailTaken = (email) => {
  let flag = false;
  for(let id in usersDB){
    if(usersDB[id].email === email) {
      flag = true;
    }
  }
};

var findUser = (email) => {
  for(let id in usersDB){
    if(usersDB[id].email === email){
      return usersDB[id];
    }
  }
};

var urlsForUser = (id, allURLS) => {
  let myURLs = {};
  for (let shortURL in allURLS) {
    if (allURLS[shortURL].userID === id) {
      myURLs[shortURL] = allURLS[shortURL].longURL;
    }
  }
  return myURLs;
}

/*------ ****** ROUTES ****** ------*/


// --- root ---
app.get('/', (req, res) => {
  res.redirect("/urls");
});


// --- home ---
app.get("/urls", (req, res) => {
  const user = usersDB[req.session["user_id"]];
  if(!req.session.user_id){
    res.status(404).redirect("/login");
  } else {
    let templateVars = {
      urls: urlsForUser(req.session.user_id, urlDB),
      user: usersDB[req.session.user_id]
    };
    res.render('urls_index', templateVars);
  }
});



// --- REGISTER ---
app.get('/registration', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
    return;
  }

  let templateVars = {urls: urlDB};
  res.render('urls_registration', templateVars);
});


app.post('/registration', (req, res) => {
  let{username, email, password} = req.body;
  if (!(username || password || email)) {
    res.status(400).render('urls_registration', {
      error: 'Email or password missing'
    });
  }
  //dry up using if/else, stops additional if's from running, lighter
  if (emailTaken(email)) {
    res.status(400).render('urls_register', {
      error: 'Email already here, but not here here, somewhere there'
    });
  } else {
    bcrypt.hash(password, saltRounds, (err, hash) => {
      const randomId = generateRandomString();
      const newUser =  {
        id: randomId,
        username,
        email,
        password: hash
      };
      usersDB[randomId] = newUser;

      req.session.user_id = randomId;
      res.redirect('/urls');
    });
  }
});



// --- LOGIN ---
app.get('/login', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
    return;
  } else {
    res.render('urls_login');
  }
});
app.post('/login', (req, res) => {
  let {email, password} = req.body;
  let user = findUser(email);
  if (!user) {
    res.status(403).render("urls_login", {
      error: "User not found"
    });
  } else {
    if (!bcrypt.compareSync(password, user.password)) {
      res.status(403).render("urls_login", {
        error: "Incorrect email or password"
      });
    } else {
      req.session.user_id = user.id;
      res.redirect('/urls');
    }
  }
});

//--- LOGOUT ---
app.post('/urls/logout', (req, res) =>{
  req.session = null;
  res.redirect('/urls');
});


// --- urls_new ---
app.get("/urls/new", (req, res) => {
  if(!req.session.user_id){
    res.redirect("/login");
  } else {
    let templateVars = {
      urls: urlDB,
      user: usersDB[req.session.user_id]
    };
    res.render("urls_new", templateVars);
  }
});
  // - form handler for urls_new
  app.post("/urls", (req, res) => {
    if(!req.session.user_id){
      res.status(404).send('404:Not Found');
      return;
    }
    let shortURL = generateRandomString();

    //add the shortURL to DB with value of 'longURL: thisURL' object
    urlDB[shortURL] = {
      longURL: req.body.longURL,
      userID: req.session.user_id
    };

    res.redirect(`/urls`);
  });


// --- urls_show this shortURL ---
app.get('/urls/:id', (req, res) => {
  const user = usersDB[req.session["user_id"]];
  if (user) {
    let {id} = req.params;
    let {longURL} = urlDB[id];

    let templateVars = {
      urls: urlDB,
      user: user,
      shortURL: id,
      longURL: longURL
    };
    console.log('lookie -->', templateVars);
    res.render("urls_show", templateVars)
  } else {
      res.status(401).render("urls_index", {error: 'You must be logged IN'}).redirect("/urls");
  }
});
  // - form handler
    //-- update url
app.post('/urls/:id', (req, res) => {
  if (!(req.params.id in urlDB)) {
    res.status(404).send('404: Not found');
    return;
  }
  if (req.session.user_id === urlDB[req.params.id].userID) {
    urlDB[req.params.id].longURL = req.body.longURL;
    res.redirect('/urls');
  } else {
    res.send('That is not yours!');
  }
});


// --- shortURL req, res redirect to longURL ---
app.get('/u/:id', (req, res) => {
  if (!(req.params.id in urlDB)) {
    res.status(404).send('404: Not found');
    return;
  }
  const { id } = req.params;
  const { longURL } = urlDB[id];

  res.redirect(longURL);
});

// --- remove url ---
app.post('/urls/:id/delete', (req, res) => {
  const userID = req.session.user_id;

  let {id}      = req.params,
      urlObject = urlDB[id];

  if (userID && usersDB[userID]){
    if (userID === urlObject.userID){
      delete urlDB[id];
      res.redirect("/urls");
    } else {
      res.status(401).render("urls_index", {error: `you must be the owner of this URL`}).redirect("/urls");
    }
  } else {
    res.status(401).render("urls_index", {error: `Not yours, shoo`}).redirect("/urls");
  }
});


/*------ ****** PORT Listen ****** ------*/


app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
