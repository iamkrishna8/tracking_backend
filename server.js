const app = require("./app");
const mongoose = require("mongoose");
const http = require("http");

const socketio = require("socket.io-client");

// socket server // socket.io setup
const server = http.createServer(app);
const io = socketio(server);

// imported from the .env file
const PORT = process.env.PORT || 5000;
const DB = process.env.MONGO_DB;

// MongoDB Atlas Connection
mongoose
  .connect(DB)
  .then(() => {
    console.log(`🟢 MongoDB Connected Successfully`);
  })
  .catch((error) => {
    console.error(`🔴 MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  });

// Sever Running on the port 4000
app.listen(PORT, () => {
  console.log(`Server Running on the port ${PORT}`);
});
