const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");

const userRouter = require("./routes/userRouter");

dotenv.config();
const app = express();

// Middlewares
app.use(express.json());
app.use(morgan("dev"));

// ✅ FIX 1: Proper CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://tracking-frontend-g1fs.onrender.com"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ✅ FIX 2: Handle preflight OPTIONS request (important for POST)
app.options("*", cors());

// Routes
app.use("/api/v1/users", userRouter);

// Default route
app.get("/", (req, res) => {
  res.send("Backend is running...");
});

module.exports = app;
