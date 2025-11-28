const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const userAuth = catchAsync(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new AppError("Not Authorized.Login Again", 403));
  }

  const Tokendecode = jwt.verify(token, process.env.JWT_SECRET);

  if (Tokendecode.id) {
    req.body.userId = Tokendecode.id;
  } else {
    return next(new AppError("Not Authorized.Login Again", 403));
  }

  next();
});

module.exports = userAuth;
