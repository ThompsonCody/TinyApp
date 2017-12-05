
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

//--- Pug template engine
app.set('view engine', 'pug');

//--- Data

const urlDB = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
}

/*------ PORT ------*/


app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});


/*------ ROUTES ------*/

//root
app.get('/', (req, res) => {
  res.end("HARI OM");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDB);
})

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = {urls: urlDB};
  res.render('urls_index', templateVars);
});

//urls_show
app.get('/urls/:id', (req, res) => {
  let templateVars = {shortURL: req.params.id};
  console.log(templateVars);
  res.render("urls_show", templateVars);
});
