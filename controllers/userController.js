const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.getUserData = catchAsync(async (req, res, next) => {
  const { userId } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError("User Not Found", 400));
  }

  res.status(200).json({
    status: "success",
    data: {
      name: user.name,
      isAccountVerified: user.isAccountVerified,
    },
  });
});
