const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/nodeMailer");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.cookie("token", token, CookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user,
    },
  });
};

exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new AppError("please Enter Missing Fields", 400));
  }

  //   checking that if user is already existed with that email
  const existinguser = await User.findOne({ email });
  if (existinguser) {
    return next(
      new AppError("User already Existed ..Please Login to Continue", 400)
    );
  }

  //   creating the user
  const newuser = await User.create(req.body);

  // sending welcome email using Brevo API
  const htmlContent = `
<html>
  <body style="font-family: Arial, sans-serif; background-color:#eef5f1; padding:25px;">

    <table width="100%" cellspacing="0" cellpadding="0" 
      style="max-width:620px; margin:auto; background:#ffffff; border-radius:12px; 
      overflow:hidden; border:1px solid #dce7e1; box-shadow:0 6px 20px rgba(0,0,0,0.08);">

      <!-- Header Banner -->
      <tr>
        <td style="padding:0;">
         <img 
  src="https://raw.githubusercontent.com/iamkrishna8/auth_frontend/main/map_mate_logo.png?raw=1"
  alt="MapMate Logo"
  style="width:100%; height:auto; display:block;"
>

        </td>
      </tr>

      <!-- Header / Title -->
      <tr>
        <td style="background:#2e7d32; padding:22px; text-align:center; color:#ffffff;">
          <h2 style="margin:0; font-size:26px; letter-spacing:0.5px;">
            Welcome to Map Mate
          </h2>
        </td>
      </tr>

      <!-- Body Content -->
      <tr>
        <td style="padding:30px; color:#333; line-height:1.7;">

          <p style="margin-top:0; font-size:16px;">
            Hello <strong>${name}</strong>,
          </p>

          <p style="font-size:15px;">
            We are delighted to let you know that your MapMate account has been successfully created.
            Your registered email is:
            <br><strong>${email}</strong>
          </p>

          <p style="font-size:15px;">
            You can now sign in to your dashboard and begin exploring all the tools and features designed 
            to simplify your workflow and enhance your MapMate experience.
          </p>

          <p style="font-size:15px;">
            If you ever need help, our support team is always available to assist you.
          </p>

          <p style="margin-top:25px; font-size:16px; color:#2e7d32;">
            We are excited to have you with us — welcome to the MapMate family!
          </p>

          <p style="font-size:15px; margin-top:8px;">
            Warm regards,<br>
            <strong style="color:#2e7d32;">MapMate Team</strong>
          </p>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f3f7f5; text-align:center; padding:15px; 
            font-size:12px; color:#777; border-top:1px solid #e1ebe6;">
          © ${new Date().getFullYear()} MapMate. All rights reserved.
        </td>
      </tr>
    </table>

  </body>
</html>
`;

  try {
    await sendEmail(email, "Welcome to MapMate", htmlContent);
  } catch (error) {
    console.error("Email sending failed:", error.message);
    // Don't stop registration even if email fails
  }

  createSendToken(newuser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(
      new AppError("Please Enter email & password In order To login", 403)
    );
  }

  // checking the user exists and password is correct

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.CorrectPassworrd(password, user.password))) {
    return res.status(403).json({
      success: false,
      message: "Incorrect Email or Password",
    });
  }

  createSendToken(user, 200, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  res.clearCookie("token", CookieOptions);

  res.status(200).json({
    status: "success",
    message: "User logged out successfully",
  });
});

// send verification Otp to the User's Email
exports.sendVerifyOtp = catchAsync(async (req, res, next) => {
  const { userId } = req.body;

  const user = await User.findById(userId);

  if (user.isAccountVerified) {
    return res.json({ status: "success", message: "Account already Verified" });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));

  user.verifyOtp = otp;
  user.verifyOtpExpires = Date.now() + 24 * 60 * 60 * 1000;

  const htmlContentotp = `
<html>
  <body style="font-family: Arial, sans-serif; background-color:#eef5f1; padding:25px;">

    <table width="100%" cellspacing="0" cellpadding="0" 
      style="max-width:620px; margin:auto; background:#ffffff; border-radius:12px; 
      overflow:hidden; border:1px solid #dce7e1; box-shadow:0 6px 20px rgba(0,0,0,0.08);">

      <!-- Header Banner -->
      <tr>
        <td style="padding:0;">
          <img 
  src="https://raw.githubusercontent.com/iamkrishna8/auth_frontend/main/map_mate_logo.png?raw=1"
  alt="MapMate Logo"
  style="width:100%; height:auto; display:block;"
>

        </td>
      </tr>

      <!-- Header / Title -->
      <tr>
        <td style="background:#2e7d32; padding:22px; text-align:center; color:#ffffff;">
          <h2 style="margin:0; font-size:26px; letter-spacing:0.5px;">
            Email Verification Required
          </h2>
        </td>
      </tr>

      <!-- Body Content -->
      <tr>
        <td style="padding:30px; color:#333; line-height:1.7;">

          

          <p style="font-size:15px;">
            To complete your registration and secure your MapMate account, please verify your email address.
          </p>

          <p style="font-size:15px; margin-bottom:20px;">
            Use the One-Time Password (OTP) below:
          </p>

          <!-- OTP Box -->
          <div style="
            width:100%; 
            text-align:center; 
            margin:25px 0; 
            padding:18px 0; 
            border:1px dashed #2e7d32; 
            background:#f4faf6; 
            border-radius:8px;
          ">
            <span style="font-size:28px; letter-spacing:4px; font-weight:700; color:#2e7d32;">
              ${otp}
            </span>
          </div>

          <p style="font-size:15px;">
            This OTP is valid for the next <strong>10 minutes</strong>.  
            Please do not share it with anyone for security reasons.
          </p>

          <p style="margin-top:25px; font-size:15px;">
            If you did not request this, you can safely ignore this email.
          </p>

          <p style="font-size:15px; margin-top:8px;">
            Regards,<br>
            <strong style="color:#2e7d32;">EDHR Team</strong>
          </p>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f3f7f5; text-align:center; padding:15px; 
            font-size:12px; color:#777; border-top:1px solid #e1ebe6;">
          © ${new Date().getFullYear()} MapMate. All rights reserved.
        </td>
      </tr>
    </table>

  </body>
</html>
`;

  await user.save();
  sendEmail(user.email, "Account verification Otp", htmlContentotp);
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return next(new AppError("Missing Details", 400));
  }

  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError("User Not Found", 401));
  }

  if (user.verifyOtp === "" || user.verifyOtp !== otp) {
    return next(new AppError("Invalid OTP", 401));
  }

  if (user.verifyOtpExpires < Date.now()) {
    return next(new AppError("OTP Expired", 401));
  }

  user.isAccountVerified = true;

  user.verifyOtp = "";
  user.verifyOtpExpires = 0;

  await user.save();

  res.status(200).json({
    status: "success",
    message: "Email verified Successfully",
  });
});

// check if user is Authenticateds
exports.isAuthenticated = catchAsync(async (req, res, next) => {
  return res.json({ status: "Success" });
});

// send PassWord Reset OTP

exports.sendResetOTP = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Email is required"));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("No User Existed With this Email Adress", 400));
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));

  user.resetOtp = otp;
  user.resetOtpExpires = Date.now() + 10 * 60 * 60 * 1000;

  const htmlContentotp = `
<html>
  <body style="font-family: Arial, sans-serif; background-color:#eef5f1; padding:25px;">

    <table width="100%" cellspacing="0" cellpadding="0" 
      style="max-width:620px; margin:auto; background:#ffffff; border-radius:12px; 
      overflow:hidden; border:1px solid #dce7e1; box-shadow:0 6px 20px rgba(0,0,0,0.08);">

      <!-- Header Banner -->
      <tr>
        <td style="padding:0;">
         <img 
  src="https://raw.githubusercontent.com/iamkrishna8/auth_frontend/main/map_mate_logo.png?raw=1"
  alt="MapMate Logo"
  style="width:100%; height:auto; display:block;"
>

        </td>
      </tr>

      <!-- Header / Title -->
      <tr>
        <td style="background:#2e7d32; padding:22px; text-align:center; color:#ffffff;">
          <h2 style="margin:0; font-size:26px; letter-spacing:0.5px;">
            Password Reset Request
          </h2>
        </td>
      </tr>

      <!-- Body Content -->
      <tr>
        <td style="padding:30px; color:#333; line-height:1.7;">

          <p style="font-size:16px; margin-top:0;">
            Hello <strong>${user.name}</strong>,
          </p>

          <p style="font-size:15px;">
            We received a request to reset your password for your MapMate account.
            To continue with the reset, please use the One-Time Password (OTP) provided below.
          </p>

          <p style="font-size:15px; margin-bottom:20px;">
            Your password reset OTP:
          </p>

          <!-- OTP Box -->
          <div style="
            width:100%; 
            text-align:center; 
            margin:25px 0; 
            padding:18px 0; 
            border:1px dashed #2e7d32; 
            background:#f4faf6; 
            border-radius:8px;
          ">
            <span style="font-size:28px; letter-spacing:4px; font-weight:700; color:#2e7d32;">
              ${otp}
            </span>
          </div>

          <p style="font-size:15px;">
            This OTP is valid for the next <strong>10 minutes</strong>.  
            For your security, please do not share this code with anyone.
          </p>

          <p style="margin-top:25px; font-size:15px;">
            If you did not request a password reset, please ignore this email. 
            Your account will remain safe.
          </p>

          <p style="font-size:15px; margin-top:8px;">
            Regards,<br>
            <strong style="color:#2e7d32;">EDHR Team</strong>
          </p>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f3f7f5; text-align:center; padding:15px; 
            font-size:12px; color:#777; border-top:1px solid #e1ebe6;">
          © ${new Date().getFullYear()} MapMate. All rights reserved.
        </td>
      </tr>

    </table>

  </body>
</html>
`;

  await user.save();
  sendEmail(user.email, "Account Reset Otp", htmlContentotp);

  res.status(200).json({
    success: true,
    message: "OTP sent to your email",
  });
});

// Reset User Password
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { email, otp, newpassword } = req.body;

  if (!email || !otp || !newpassword) {
    return next(new AppError("Email,OTP and new password are required", 400));
  }
  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("User Not Found", 401));
  }

  if (user.resetOtp === "" || user.resetOtp !== otp) {
    return next(new AppError("Invalid OTP", 400));
  }

  if (user.resetOtpExpires < Date.now()) {
    return next(new AppError("OTP Expired", 400));
  }

  user.password = newpassword;
  user.resetOtp = "";
  user.resetOtpExpires = 0;

  await user.save();

  const htmlContentSuccess = `
<html>
  <body style="font-family: Arial, sans-serif; background-color:#eef5f1; padding:25px;">

    <table width="100%" cellspacing="0" cellpadding="0" 
      style="max-width:620px; margin:auto; background:#ffffff; border-radius:12px; 
      overflow:hidden; border:1px solid #dce7e1; box-shadow:0 6px 20px rgba(0,0,0,0.08);">

      <!-- Header Banner -->
      <tr>
        <td style="padding:0;">
         <img 
  src="https://raw.githubusercontent.com/iamkrishna8/auth_frontend/main/map_mate_logo.png?raw=1"
  alt="MapMate Logo"
  style="width:100%; height:auto; display:block;"
>

        </td>
      </tr>

      <!-- Header / Title -->
      <tr>
        <td style="background:#2e7d32; padding:22px; text-align:center; color:#ffffff;">
          <h2 style="margin:0; font-size:26px; letter-spacing:0.5px;">
            Password Reset Successful
          </h2>
        </td>
      </tr>

      <!-- Body Content -->
      <tr>
        <td style="padding:30px; color:#333; line-height:1.7;">

          <p style="font-size:16px; margin-top:0;">
            Hello <strong>${user.name}</strong>,
          </p>

          <p style="font-size:15px;">
            This is a confirmation that the password for your MapMate account has been successfully reset.
          </p>

          <p style="font-size:15px;">
            If you performed this action, you can safely continue using your account with your new password.
          </p>

          <p style="font-size:15px; margin-top:20px; color:#2e7d32;">
            If this wasn't you, please secure your account immediately by resetting your password again
            or contacting our support team.
          </p>

          <p style="font-size:15px; margin-top:8px;">
            Regards,<br>
            <strong style="color:#2e7d32;">MapMateTeam</strong>
          </p>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f3f7f5; text-align:center; padding:15px; 
            font-size:12px; color:#777; border-top:1px solid #e1ebe6;">
          © ${new Date().getFullYear()} MapMate. All rights reserved.
        </td>
      </tr>

    </table>

  </body>
</html>
`;

  sendEmail(user.email, "Password Reset Succesfully", htmlContentSuccess);

  return res.json({
    status: "Success",
    message: "Password has been reset Succesfully",
  });
});
