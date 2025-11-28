const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    require: [true, "please Enter your name"],
  },
  email: {
    type: String,
    required: [true, "please enter email"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "please enter password"],
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      // Runs only on CREATE and SAVE
      validator: function (val) {
        return val === this.password;
      },
      message: "Passwords do not match",
    },
    select: false,
  },
  verifyOtp: {
    type: String,
    default: "",
  },
  verifyOtpExpires: {
    type: Number,
    default: 0,
  },
  isAccountVerified: {
    type: Boolean,
    default: false,
  },
  resetOtp: {
    type: String,
    default: "",
  },
  resetOtpExpires: {
    type: Number,
    default: 0,
  },
  token: {
    type: String,
    default: "",
  },
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  // Remove confirmPassword field
  this.confirmPassword = undefined;
  next();
});

UserSchema.methods.CorrectPassworrd = async (password, userPassword) => {
  return bcrypt.compare(password, userPassword);
};

const User = mongoose.model("Users", UserSchema);

module.exports = User;
