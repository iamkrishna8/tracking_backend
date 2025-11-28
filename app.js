const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");

const userRouter = require("./routes/userRouter");

dotenv.config();
const app = express();

// middlewares
app.use(express.json());
app.use(morgan("dev"));

app.use(
  cors({
    origin: ["http://localhost:5173", ""],
    credentials: true,
  })
);

app.use("/api/v1/users", userRouter);

module.exports = app;
