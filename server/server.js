const _ = require("lodash");

// to start the server
var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
var { ObjectID } = require("mongodb");

var { mongoose } = require("./db/mongoose");
var { Todo } = require("./models/todo");
var { User } = require("./models/user");
var { authenticate } = require("./middleware/authenticate");

// store express application
var app = express();

// create port database entry
const port = process.env.PORT || 3000;

// configure middleware

// this allowed pass data as json
app.use(bodyParser.json());

// this allow cors
app.use(cors());

// setup the routes
app.post("/todos", authenticate, (req, res) => {
  // create instance
  var todo = new Todo({
    text: req.body.text,
    cover: req.body.cover,
    _creator: req.user._id
  });

  // save to database
  todo.save().then(
    doc => {
      res.send(doc);
    },
    e => {
      res.status(400).send(e);
      // console.log(JSON.stringify(e), undefined, 2);
    }
  );
});

app.get("/todos", authenticate, (req, res) => {
  Todo.find({
    _creator: req.user._id
  }).then(
    todos => {
      res.send({
        todos
      });
    },
    e => {
      res.status(400).send(e);
    }
  );
});

app.get("/todos/:id", authenticate, (req, res) => {
  var id = req.params.id;

  // validate id using isValid
  // not found id return 404 - send back empty body

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Todo.findOne({
    _id: id,
    _creator: req.user._id
  })
    .then(todo => {
      if (!todo) {
        return res.status(404).send();
      }
      res.send({ todo });
    })
    .catch(e => {
      res.status(400).send();
    });
});

app.delete("/todos/:id", authenticate, (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Todo.findByOneAndRemove({
    _id: id,
    _creator: req.user._id
  })
    .then(todo => {
      if (!todo) {
        return res.status(404).send();
      }
      res.send({ todo });
    })
    .catch(e => {
      res.status(400).send();
    });
});

app.patch("/todos/:id", authenticate, (req, res) => {
  var id = req.params.id;
  var body = _.pick(req.body, ["text", "cover"]);

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Todo.findByOneAndUpdate(
    { _id: id, _creator: req.user._id },
    { $set: body },
    { new: true }
  )
    .then(todo => {
      if (!todo) {
        return res.status(404).send();
      }
      res.send({ todo });
    })
    .catch(e => {
      res.status(400).send();
    });
});

// setup the users
app.post("/users", (req, res) => {
  var body = _.pick(req.body, ["email", "password"]);
  var user = new User(body);

  // save to database
  user
    .save()
    .then(() => {
      return user.generateAuthToken();
    })
    .then(token => {
      res.header("x-auth", token).send({ user: user, token: token });
    })
    .catch(e => {
      res.status(400).send(e);
    });
});

// private routes
app.get("/users/me", authenticate, (req, res) => {
  res.send(req.user);
});

// login routes
app.post("/users/login", (req, res) => {
  var body = _.pick(req.body, ["email", "password"]);

  console.log(body);

  User.findByCredentials(body.email, body.password)
    .then(user => {
      // res.send(user);
      return user.generateAuthToken().then(token => {
        res.header("x-auth", token).send({ user: user, token: token });
        console.log("Token value: ", token);
        // res.send(token);
      });
    })
    .catch(e => {
      res.status(400).send();
    });
});

// logout
app.delete("/users/me/token", authenticate, (req, res) => {
  req.user.removeToken(req.token).then(
    () => {
      res.status(200).send();
    },
    () => {
      res.status(400).send();
    }
  );
});

app.listen(port, () => {
  console.log(`Started on port ${port}`);
});
