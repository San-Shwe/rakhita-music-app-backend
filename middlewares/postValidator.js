const { check, validationResult } = require("express-validator");

// validate the user data before adding to database
exports.postValidator = [
  check("title").trim().not().isEmpty().withMessage("Post title is missing!"),
  check("content")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Post content is missing!"),
  check("meta").trim().not().isEmpty().withMessage("Post meta is missing!"),
  check("slug").trim().not().isEmpty().withMessage("Post slug is missing!"),
  check("tags")
    .isArray()
    .withMessage("Post tags is missing!")
    .custom((tags) => {
      for (let t of tags) {
        if (typeof t !== "string") {
          throw Error("Tags must be array ofr strings!");
        }
      }
      return true;
    }),
];

exports.validate = (req, res, next) => {
  const error = validationResult(req).array();
  if (error.length) {
    return res.status(401).json({ errors: error[0].msg });
  }
  next();
};
