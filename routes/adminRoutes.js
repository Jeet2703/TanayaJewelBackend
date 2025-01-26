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

/// Admin Login
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
    const { adminId, category, value } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    admin.products.push({ category, value });
    await admin.save();

    res.status(200).json({ message: 'Product added successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

module.exports = router;
