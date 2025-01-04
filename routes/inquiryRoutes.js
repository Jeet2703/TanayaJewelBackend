const express = require('express');
const router = express.Router();
const Inquiry = require('../models/inquiry');
const nodemailer = require('nodemailer');
const dotenv = require("dotenv");

dotenv.config();

// Submit inquiry
router.post('/submit-inquiry', async (req, res) => {
  const inquiryData = req.body;

  try {
    const inquiry = new Inquiry(inquiryData);
    await inquiry.save();

    // Send email to admin
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: process.env.EMAIL,
      subject: 'New Inquiry Received',
      text: JSON.stringify(inquiryData, null, 2),
    };

    transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'Inquiry submitted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting inquiry', error });
  }
});

module.exports = router;
