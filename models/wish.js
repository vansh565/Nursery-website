// models/WishlistItem.js
const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
  name: String,
  price: Number,
  image: String,
  userId: String, // Optional for logged-in users
});

module.exports = mongoose.model("WishlistItem", wishlistSchema);
