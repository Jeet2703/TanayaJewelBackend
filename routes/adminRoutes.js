const express = require('express');
const router = express.Router();
const Product = require('../models/products');

// Add a new product
router.post('/add-product', async (req, res) => {
  const { name, price, description, category, image, color, quantity } = req.body;

  try {
    const product = new Product({ name, price, description, category, image, color, quantity });
    await product.save();
    res.status(201).json({ message: 'Product added successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding product', error });
  }
});

// Get all products
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error });
  }
});

module.exports = router;
