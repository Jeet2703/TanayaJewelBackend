const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  category: { type: String, required: true },
  value: { type: String, required: true },
});

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    products: [productSchema], // Embedded product schema
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);
