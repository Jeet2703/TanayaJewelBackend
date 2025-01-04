const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  category: String,
  image: String,
  color: String,
  quantity: Number,
});

module.exports = mongoose.model('Product', productSchema);
