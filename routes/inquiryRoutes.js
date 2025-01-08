const express = require('express');
const router = express.Router();
const Inquiry = require('../models/inquiry'); // Replace with your database model
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

router.post('/submit-inquiry', async (req, res) => {
  const inquiryData = req.body;

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
      Price Range: ${inquiryData.priceRange}
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
