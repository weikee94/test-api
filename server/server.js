// to start the server
var express = require("express");
var bodyParser = require("body-parser");

var { mongoose } = require("./db/mongoose");
var { Todo } = require("./models/todo");
var { User } = require("./models/user");

// store express application
var app = express();

// configure middleware
app.use(bodyParser.json());

// setup the routes
app.post("/todos", (req, res) => {
  // create instance
  var todo = new Todo({
    text: req.body.text
  });

  console.log(req.body);

  // save to database
  todo.save().then(
    doc => {
      res.send(doc);
    },
    e => {
      res.status(400).send(e);
      console.log(JSON.stringify(e), undefined, 2);
    }
  );
});

app.listen(3000, () => {
  console.log("Started on port 3000");
});
