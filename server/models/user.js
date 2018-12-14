var mongoose = require("mongoose");
var validator = require("validator");
var jwt = require("jsonwebtoken");
const _ = require("lodash");
const bcrypt = require("bcryptjs");

var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    minlength: 1,
    trim: true,
    unique: true,
    validate: {
      validator: value => {
        return validator.isEmail(value);
      },
      message: "{VALUE} is not a valid email"
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  tokens: [
    {
      access: { type: String, required: true },
      token: { type: String, required: true }
    }
  ]
});

// we only want give back id and email (those sensitive value such as password should be hidden)
UserSchema.methods.toJSON = function() {
  var user = this;
  var userObject = user.toObject();

  return _.pick(userObject, ["_id", "email"]);
};

// instance method
UserSchema.methods.removeToken = function(token) {
  var user = this;
  return user.update({
    $pull: {
      tokens: {
        token: token
      }
    }
  });
};

// create instance methods (self create method)
UserSchema.methods.generateAuthToken = function() {
  var user = this;

  // generate access and token
  var access = "auth";
  var token = jwt
    .sign({ _id: user._id.toHexString(), access }, "asdqwerdg")
    .toString();

  // push to user array
  user.tokens = user.tokens.concat([
    {
      access,
      token
    }
  ]);

  return user.save().then(() => {
    console.log(user);
    return token;
  });
};

// model methods
UserSchema.statics.findByToken = function(token) {
  var User = this;

  var decoded;

  try {
    decoded = jwt.verify(token, "asdqwerdg");
  } catch (e) {
    // return new Promise((resolve, reject) => {
    //   reject();
    // });

    // shorten version
    return Promise.reject();
  }

  return User.findOne({
    _id: decoded._id,
    "tokens.token": token,
    "tokens.access": "auth"
  });
};

UserSchema.statics.findByCredentials = function(email, password) {
  var User = this;

  return User.findOne({ email }).then(user => {
    if (!user) {
      return Promise.reject();
    }

    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          resolve(user);
        } else {
          reject();
        }
      });
    });
  });
};

// what event u want to run before saved to database
UserSchema.pre("save", function(next) {
  var user = this;

  if (user.isModified("password")) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

// mongoose model
var User = mongoose.model("User", UserSchema);

module.exports = {
  User: User
};
