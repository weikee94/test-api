// start the mongoose
var mongoose = require("mongoose");

// tell mongoose which promise library to used
mongoose.Promise = global.Promise;

// connect database
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/TodoApp"
);

module.exports = {
  mongoose: mongoose
};
