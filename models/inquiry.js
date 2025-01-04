const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  countryCode: String,
  priceRange: String,
  category: String,
  metal: String,
  carats: String,
  stone: String,
  message: String,
});

module.exports = mongoose.model('Inquiry', inquirySchema);
