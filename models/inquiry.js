const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
  },
  countryCode: {
    type: String,
    required: [true, 'Country code is required'],
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
  },
  // priceRange: String,
  category: String,
  metal: String,
  carat: String,
  stone: String,
  message: String,
});

module.exports = mongoose.model('Inquiry', inquirySchema);
