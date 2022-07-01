// import post and featured post
const Post = require("../models/post");
const FeaturedPost = require("../models/featuredPost");
const cloudinary = require("../cloud");
const { isValidObjectId } = require("mongoose");

const FEATURED_POST_COUNT = 4;

const addToFeaturedPost = async (postId) => {
  // cancel to add data if current post is already exit
  const isAlreadyExits = await Post.findOne({ post: postId });
  if (isAlreadyExits) return;

  const featuredPost = new FeaturedPost({ post: postId });
  await featuredPost.save();

  const featuredPosts = await FeaturedPost.find({}).sort({ createdAt: -1 }); // FeaturedPost not featuredPost (syntax error)
  // console.log("-----------featured post------------>", featuredPost);
  featuredPosts.forEach(async (post, index) => {
    if (index >= FEATURED_POST_COUNT)
      await FeaturedPost.findByIdAndDelete(post._id);
  });
};

exports.createPost = async (req, res) => {
  const { title, meta, content, slug, author, tags, featured } = req.body; // destruct reqest body
  const { file } = req;

  // check slug is already on the database
  const isAlreadyExits = await Post.findOne({ slug });
  if (isAlreadyExits)
    return res.status(401).json({ error: "Please use unique slug" });

  const newPost = new Post({ title, meta, content, slug, author, tags });

  if (file) {
    const { secure_url: url, public_id } = await cloudinary.uploader.upload(
      file.path
    );
    newPost.thumbnail = { url, public_id };
  }

  await newPost.save(); // insert collection to database

  if (featured) await addToFeaturedPost(newPost._id); // insert to feature collection if current post is feature post

  // respond back to user
  res.json({
    post: {
      id: newPost._id,
      title,
      content,
      thumbnail: newPost.thumbnail?.url,
      author: newPost.author,
    },
  });
};

exports.deletePost = async (req, res) => {
  const { postId } = req.params;
  if (!isValidObjectId(postId))
    return res.status(401).json({ error: "Invalid request!" });

  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ error: "Post not found" });

  // remove thumb nail from Cloudinary
  const { public_id } = post.thumbnail;
  if (public_id) {
    const { result, error } = await cloudinary.uploader.destroy(public_id);
    if (error)
      return res.status(404).json({ error: "cloud not remove thumbnail" });
  }

  await Post.findByIdAndDelete(postId); // delete data from database
  res.json({ message: "Post removed successfully!" });
};
