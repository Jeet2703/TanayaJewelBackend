const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  Shape: { type: String },
  'Certificate No': { type: String },
  Carat: { type: Number },
  Color: { type: String },
  Clarity: { type: String },
  Cut: { type: String },
  Polish: { type: String },
  Symmetry: { type: String },
  '3EX': { type: String },
  HC: { type: String },
  BGM: {type: String},
  Fluorescence: { type: String },
  Length: { type: Number },
  Breadth: { type: Number },
  Height: { type: Number },
  LAB: { type: String },
  'Price/ct': { type: Number },
  Amount: { type: Number },
});

module.exports = mongoose.model('Product', productSchema);
