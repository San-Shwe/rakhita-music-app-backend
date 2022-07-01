require("express-async-errors");
require("./db"); // connect dababase first
const express = require("express");
const morgan = require("morgan");
require("dotenv").config(); // import dot env
const postRouter = require("./routers/post");

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use("/api/post", postRouter);

// on check error here, not in every class
// we don't use try{}catch{} method in every functions
// checking final error
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log("app server is running in ", PORT);
});
