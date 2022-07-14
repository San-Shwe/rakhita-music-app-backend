require("dotenv").config(); // import dot env
require("express-async-errors");
require("./db"); // connect dababase first
const express = require("express");
// const morgan = require("morgan");
const postRouter = require("./routers/post");
const cors = require("cors");

const app = express();
app.use(cors({ origin: true })); // "http://localhost:3000"
app.use(express.json());
// app.use(morgan("dev"));
app.use("/api/post", postRouter);

// on check error here, not in every class
// we don't use try{}catch{} method in every functions
// checking final error
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log("app server is running in ", PORT);
});
