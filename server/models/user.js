var mongoose = require("mongoose");
var validator = require("validator");
var jwt = require("jsonwebtoken");
const _ = require("lodash");

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

// mongoose model
var User = mongoose.model("User", UserSchema);

module.exports = {
  User: User
};
