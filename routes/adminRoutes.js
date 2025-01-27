const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const router = express.Router();

const secret = process.env.JWT_SECRET || 'defaultsecretkey';

// Admin Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) return res.status(400).json({ message: 'Admin already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ name, email, password: hashedPassword });
    await newAdmin.save();

    res.status(201).json({ message: 'Admin registered successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Admin.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Sign the JWT
    const token = jwt.sign({ id: user._id, email: user.email }, secret, { expiresIn: '1h' });

    res.status(200).json({ token, adminId: user._id }); // Include adminId in the response
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add Products
router.post('/add-product', async (req, res) => {
  try {
    const { adminId, products } = req.body; // Assuming products is an array of product objects
    console.log("Received Payload:", products);

    products.forEach((product, index) => {
      console.log(`Product ${index + 1}:`, product); // Log each product
    });

    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    // Push all products to the admin's product list
    admin.products.push(...products);
    await admin.save();

    res.status(200).json({ message: 'Products added successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.error("Error in Add Product Route:", error); 
  }
});

// Fetch Products
router.get('/products', async (req, res) => {
  try {
    const { adminId } = req.query; // Get the adminId from the query parameters
    console.log('Fetching products for adminId:', adminId);  // Add this line for debugging

    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    res.status(200).json({ products: admin.products });
  } catch (error) {
    console.error(error);  // Add this line to log errors
    res.status(500).json({ error: error.message });
  }
});

// Edit Product
router.put('/edit-product/:index', async (req, res) => {
  try {
    const { adminId } = req.body; // Extract adminId from the request body
    const productIndex = req.params.index; // Get the product index from the URL params
    const updatedProduct = req.body.product; // Extract the updated product data from the request body

    if (!adminId) return res.status(400).json({ message: 'Admin ID is required' });

    const admin = await Admin.findById(adminId); // Find the admin by ID
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    if (!admin.products[productIndex]) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Validate numeric fields
    const numericFields = ['Carat', 'Length', 'Breadth', 'Height', 'Price/ct', 'Amount'];
    for (const field of numericFields) {
      if (isNaN(updatedProduct[field])) {
        return res.status(400).json({ message: `Invalid value for ${field}. Must be a number.` });
      }
    }

    // Update the product at the specific index
    admin.products[productIndex] = updatedProduct;

    // Save the changes to the database
    await admin.save();

    res.status(200).json({ message: 'Product updated successfully!', product: updatedProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
});

// Delete Product
router.delete('/delete-product/:productId', async (req, res) => {
  try {
    const { adminId } = req.query; // Admin ID from query
    const { productId } = req.params; // Use product index as identifier

    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    // Remove product
    admin.products.splice(productId, 1);
    await admin.save();

    res.status(200).json({ message: 'Product deleted successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
