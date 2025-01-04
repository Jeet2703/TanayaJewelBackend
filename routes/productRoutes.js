const express = require("express");
const multer = require("multer");
const Product = require("../models/products");
const nodemailer = require("nodemailer");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

router.post("/add-product", upload.single("image"), async (req, res) => {
  try {
    const { name, price, color, quantity } = req.body;
    const product = new Product({ name, price, color, quantity, image: req.file.path });
    await product.save();
    res.status(200).json({ success: true, message: "Product added successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to add product" });
  }
});

router.get("/get-products", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
});

module.exports = router;
