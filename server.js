const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const adminRoutes = require('./routes/adminRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const productRoutes = require('./routes/productRoutes');

dotenv.config();
connectDB();

const app = express();
app.use(cors({
  origin: ['https://www.tanayajewel.com', 'http://localhost:3000', 'www.tanayajewel.com', 'https://tanayajewel.com']
}));
app.use(express.json());

app.get("/ping", (req, res) => {
    res.send({ message: "pong" });
});

app.use('/api/admin', adminRoutes);
app.use('/api/inquiry', inquiryRoutes);
app.use('/api/product', productRoutes);

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
