const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  carat: { type: String, required: true },
  color: { type: String, required: true },
  clarity: { type: String, required: true },
  cut: { type: String, required: true },
  finish: { type: String },
  fluorescence: { type: String },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
