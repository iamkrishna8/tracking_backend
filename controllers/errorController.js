const AppError = require("../utils/appError");

const HandleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const HandleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/([" "])(\\?.)*?\1/)[0];
  const message = `Dupliacate Field value : ${value},Please use another value`;
  return new AppError(message, 400);
};
const HandleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data.${errors.join(". ")}`;
  return new AppError(message, 400);
};

const HandleJWTError = () =>
  new AppError("Invalid token ! please log in again", 401);

const HandleJWTExpire = () =>
  new AppError("Your token has expired !please Log in again", 401);

const SendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const SendErrorProd = (err, res) => {
  //Operational ,trusted error
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // programing or other unknown error...dont send to the client
  } else {
    // log error
    console.log("ERROR", err);
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

module.exports = (err, req, res, next) => {
  console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    SendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    if (error.name === "CastError") error = HandleCastErrorDB(error);
    if (error.code === 11000) error = HandleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = HandleValidationErrorDB(error);

    if (error.name === "JsonWebTokenError") error = HandleJWTError();
    if (error.name === "TokenExpiredError") error = HandleJWTExpire();
    SendErrorProd(error, res);
  }

  next();
};
