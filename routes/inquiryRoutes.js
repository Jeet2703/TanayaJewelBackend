const express = require('express');
const axios = require('axios'); // For making HTTP requests
const router = express.Router();
const Inquiry = require('../models/inquiry');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

// Fetch country codes dynamically
const loadCountryCodes = () => {
  try {
    // Use __dirname to dynamically get the directory of the current file (inquireRoutes.js)
    const filePath = path.join(__dirname, 'countryCodes.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading country codes file:', error);
    return [];
  }
};

// Fetch country codes from the file
router.get('/country-codes', (req, res) => {
  try {
    const countryCodes = loadCountryCodes();
    res.status(200).json(countryCodes);
  } catch (error) {
    console.error('Error fetching country codes:', error);
    res.status(500).json({ message: 'Failed to fetch country codes.' });
  }
});

router.post('/submit-inquiry', async (req, res) => {
  const inquiryData = req.body;

  console.log("Inquiry Data:", inquiryData);
  console.log("Email from .env:", process.env.EMAIL);

  const adminEmail = inquiryData.adminEmail || process.env.EMAIL; // Fallback to the default email in .env

  // Example check before sending the email
if (!inquiryData.adminEmail) {
  return res.status(400).json({ message: 'Admin email is missing.' });
}

console.log("Admin Email:", inquiryData.adminEmail);

console.log("Admin Email:", adminEmail);

if (!adminEmail) {
  return res.status(400).json({ message: 'Admin email is missing, unable to send email.' });
}


  try {
    // Save inquiry to database
    const inquiry = new Inquiry(inquiryData);
    await inquiry.save();

    // Email content for admin and user
    const emailContent = `
      New Inquiry Submitted:

      Name: ${inquiryData.name}
      Email: ${inquiryData.email}
      Country Code: ${inquiryData.countryCode}
      Phone: ${inquiryData.phone}
      Category: ${inquiryData.category}
      Metal: ${inquiryData.metal}
      Carat: ${inquiryData.carat}
      Stone: ${inquiryData.stone}
      Message: ${inquiryData.message}

      Please take action on this inquiry.
    `;

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Send email to admin
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: adminEmail, // Send to admin email
      subject: 'New Inquiry Received',
      text: emailContent,
    });

    // Send confirmation email to user
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: inquiryData.email, // Send to user's email
      subject: 'Inquiry Received',
      text: `Hello ${inquiryData.name},\n\nThank you for your inquiry! We'll get back to you shortly.\n\nBest regards,\nYour Company`,
    });

    res.status(200).json({ message: 'Inquiry submitted and email sent successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to submit inquiry.' });
  }
});

module.exports = router;
