const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const adminRoutes = require('./routes/adminRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');

dotenv.config();
connectDB();

const app = express();
app.use(cors({
    origin: "https://tanayajewel.netlify.app/", // Replace with your Netlify URL
  }));
app.use(express.json());

app.use('/api/admin', adminRoutes);
app.use('/api/inquiry', inquiryRoutes);

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
