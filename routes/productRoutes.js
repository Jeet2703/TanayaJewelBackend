const express = require('express');
const router = express.Router();
const Product = require('../models/products');

// Add a new product (Admin only)
router.post('/add', async (req, res) => {
  try {
    const { name, carat, color, clarity, cut, finish, fluorescence, price, stock } = req.body;
    const newProduct = new Product({ name, carat, color, clarity, cut, finish, fluorescence, price, stock });
    await newProduct.save();
    res.status(201).json({ message: 'Product added successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all products (User side)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
