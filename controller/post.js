// import post and featured post
const Post = require("../models/post");
const FeaturedPost = require("../models/featuredPost");
const cloudinary = require("../cloud");
const { isValidObjectId } = require("mongoose");
const post = require("../models/post");
const { remove } = require("../models/post");

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
  console.log("add to featured post");
};

const removeFromFeaturePost = async (postId) => {
  await FeaturedPost.findOneAndDelete({ post: postId });
  console.log("remove from featured post");
};

const isFeaturedPost = async (postId) => {
  const post = await FeaturedPost.findOne({ post: postId });
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
  const public_id = post.thumbnail?.public_id;
  if (public_id) {
    const { result } = await cloudinary.uploader.destroy(public_id);
    if (result !== "ok")
      return res.status(404).json({ error: "cloud not remove thumbnail" });
  }

  await Post.findByIdAndDelete(postId); // delete data from database
  await removeFromFeaturePost(postId); // also delete featured post

  res.json({ message: "Post removed successfully!" });
};

// update post
exports.updatePost = async (req, res) => {
  const { title, meta, content, slug, author, tags, featured } = req.body; // destruct reqest body
  const { file } = req;

  const { postId } = req.params;
  if (!isValidObjectId(postId))
    return res.status(401).json({ error: "Invalid request!" });
  // search in database
  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ error: "Post not found" });

  // remove thumb nail from Cloudinary
  const public_id = post.thumbnail?.public_id;
  if (public_id && file) {
    const { result } = await cloudinary.uploader.destroy(public_id);
    if (result !== "ok")
      return res.status(404).json({ error: "cloud not remove thumbnail" });
  }

  if (file) {
    const { secure_url: url, public_id } = await cloudinary.uploader.upload(
      file.path
    );
    post.thumbnail = { url, public_id };
  }

  post.title = title;
  post.meta = meta;
  post.content = content;
  post.slug = slug;
  post.author = author;
  post.tags = tags;

  if (featured) {
    await addToFeaturedPost(post._id);
  } else {
    await removeFromFeaturePost(post._id);
  }

  await post.save();

  // respond back to user
  res.json({
    post: {
      id: post._id,
      title,
      content,
      thumbnail: post.thumbnail?.url,
      author: post.author,
      slug,
      meta,
      tags,
      featured,
    },
  });
};

// get only single post
exports.getPost = async (req, res) => {
  const { slug } = req.params;
  if (!slug) return res.status(401).json({ error: "Invalid request!" });
  // search in database
  const post = await Post.findOne({ slug });
  if (!post) return res.status(404).json({ error: "Post not found" });

  const featured = await isFeaturedPost(post._id);

  const { title, meta, content, author, tags } = post;

  // respond back to user
  res.json({
    post: {
      id: post._id,
      title,
      content,
      thumbnail: post.thumbnail?.url,
      author,
      slug,
      meta,
      tags,
      featured,
    },
  });
};

// get only featuredPosts
exports.getFeaturedPosts = async (req, res) => {
  const featuredPosts = await FeaturedPost.find({})
    .sort({ createdAt: -1 })
    .limit(4)
    .populate("post"); // FeaturedPost not featuredPost (syntax error)

  res.json({
    post: featuredPosts.map(({ post }) => ({
      id: post._id,
      title: post.title,
      meta: post.meta,
      slug: post.slug,
      thumbnail: post.thumbnail?.url,
      author: post.author,
    })),
  });
};

// get only posts
exports.getPosts = async (req, res) => {
  const { pageNo = 0, limit = 10 } = req.query;
  const posts = await Post.find({})
    .sort({ createdAt: -1 })
    .skip(parseInt(pageNo) * parseInt(limit))
    .limit(parseInt(limit));

  const postCount = await Post.countDocuments();

  res.json({
    posts: posts.map((post) => ({
      id: post._id,
      title: post.title,
      meta: post.meta,
      slug: post.slug,
      thumbnail: post.thumbnail?.url,
      author: post.author,
      createdAt: post.createdAt,
      tags: post.tags,
    })),
    postCount,
  });
};

exports.searchPost = async (req, res) => {
  const { title } = req.query;
  if (!title.trim())
    return res.status(401).json({ error: "search query is missing" });

  const posts = await Post.find({ title: { $regex: title, $options: "i" } });

  res.json({
    posts: posts.map((post) => ({
      id: post._id,
      title: post.title,
      meta: post.meta,
      slug: post.slug,
      thumbnail: post.thumbnail?.url,
      author: post.author,
      createdAt: post.createdAt,
      tags: post.tags,
    })),
  });
};

exports.getRelatedPosts = async (req, res) => {
  const { postId } = req.params;
  // check is it object id or not
  if (!isValidObjectId(postId))
    return res.status(401).json({ error: "Invalid request!" });

  const post = await Post.findById(postId);
  // check is there any post
  // to search for currently showing post id
  if (!isValidObjectId(postId))
    return res.status(404).json({ error: "post not found!" });

  // search related post
  const relatedPosts = await Post.find({
    tags: { $in: [...post.tags] },
    _id: { $ne: post._id }, // to not include currently showing post
  })
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    posts: relatedPosts.map((post) => ({
      id: post._id,
      title: post.title,
      meta: post.meta,
      slug: post.slug,
      thumbnail: post.thumbnail?.url,
      author: post.author,
    })),
  });
};

// to upload single image
exports.uploadImage = async (req, res) => {
  const { file } = req;
  if (!file) res.status(401).json({ error: "Image file is missing" });
  const { secure_url: url } = await cloudinary.uploader.upload(file.path);
  res.status(201).json({ image: url });
};
