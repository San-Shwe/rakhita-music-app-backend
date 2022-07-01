const mongoose = require("mongoose");

mongoose
  .connect("mongodb://127.0.0.1:27017/rakhita-music")
  .then(() => {
    console.log("db connected successfully");
  })
  .catch((err) => {
    console.log("db connection failed", err.message || err);
  });
