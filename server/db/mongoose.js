// start the mongoose
var mongoose = require("mongoose");

// tell mongoose which promise library to used
mongoose.Promise = global.Promise;

// connect database
mongoose.connect("mongodb://localhost:27017/TodoApp");

module.exports = {
  mongoose: mongoose
};
