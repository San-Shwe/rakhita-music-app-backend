const router = require("express").Router();
const { createPost, deletePost } = require("../controller/post");
const multer = require("../middlewares/multer");
const { postValidator, validate } = require("../middlewares/postValidator");
const { parseData } = require("../middlewares");
// we use middlewares
router.post(
  "/create",
  multer.single("thumbnail"),
  parseData,
  postValidator,
  validate,
  createPost
);
router.delete("/:postId", deletePost);

module.exports = router;
