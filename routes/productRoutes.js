const express = require('express');
const router = express.Router();
const Product = require('../models/products'); // Assuming Product model is correctly defined
const mongoose = require('mongoose');

// Add Product - Admin only
router.post('/add-product', async (req, res) => {
  try {
    const { products, adminId } = req.body; // Assuming adminId is passed in the body
    console.log("Received Payload:", products);

    // Validate that adminId is provided
    if (!adminId) {
      return res.status(400).json({ message: 'Admin ID is required' });
    }

    // Validate that products is an array
    if (!Array.isArray(products)) {
      return res.status(400).json({ message: 'Products must be an array' });
    }

    // Add adminId to each product before saving to the Product collection
    products.forEach(product => {
      product.adminId = adminId;
    });

    // Insert the products into the Product collection
    await Product.insertMany(products);

    res.status(200).json({ message: 'Products added successfully!' });
  } catch (error) {
    console.error("Error in Add Product Route:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/products-details', async (req, res) => {
  try {
    const products = await Product.find(); // Fetch all products in the Product collection
    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch Products - Public access (no admin rights needed)
router.get("/products", async (req, res) => {
  try {
    console.log("Received filters:", req.query);

    const query = {};
    const filters = Object.keys(req.query).reduce((acc, key) => {
      acc[key] = decodeURIComponent(req.query[key]); // Decode encoded values (fixes "H&A")
      return acc;
    }, {});
    

    // Mapping frontend filter keys to database fields
    const fieldMapping = {
      shape: "Shape",
      carat: "Carat",
      color: "Color",
      clarity: "Clarity",
      cut: "Cut",
      polish: "Polish",
      symmetry: "Symmetry",
      fluorescence: "Fluorescence",
      lab: "LAB",
      bgm: "BGM",
      HAndC: "H&C",  // Fix frontend-to-backend mapping
      "3EX": "3EX",  // Fix frontend-to-backend mapping
    };

    const andFilters = [];

    Object.keys(filters).forEach((filterKey) => {
      const mappedField = fieldMapping[filterKey];
      if (!mappedField) return;

      const filterValue = filters[filterKey];

      // ✅ Special handling for empty BGM, H&A, 3EX
      if (["BGM", "H&C", "3EX"].includes(mappedField)) {
        if (filterValue === "") {
          andFilters.push({
            $or: [
              { [mappedField]: { $exists: false } }, // Field does not exist
              { [mappedField]: { $eq: "" } },       // Field is empty string
              { [mappedField]: null },              // Field is null
            ],
          });
        } else {
          andFilters.push({ [mappedField]: { $in: filterValue.split(",") } });
        }
      } 
      // ✅ Normal case for other filters
      else if (filterValue) {
        andFilters.push({ [mappedField]: { $in: filterValue.split(",") } });
      }
    });

    console.log("Generated query:", JSON.stringify(andFilters, null, 2));

    // ✅ Fix: Use $or to allow some filters to match even if others do not exist
    const products = await Product.find({ $or: andFilters }).lean();

    console.log("Fetched Products:", products.length);

    if (products.length === 0) {
      return res.status(200).json({ message: "No exact match found, showing partial matches.", products: [] });
    }

    return res.status(200).json({ products });
  } catch (error) {
    console.error("Error in fetching products:", error);
    return res.status(500).json({ message: "Internal server error.", error: error.message });
  }
});





// Edit Product - Admin only
router.put('/edit-product/:productId', async (req, res) => {
  try {
    const { productId } = req.params; // Get the product ID from the URL params
    const { product, adminId } = req.body; // Extract updated product and adminId from the request body

    // Validate that adminId is provided
    if (!adminId) {
      return res.status(400).json({ message: 'Admin ID is required' });
    }

    if (!product || !productId) return res.status(400).json({ message: 'Product data and product ID are required' });

    // Ensure productId is a valid ObjectId
    console.log('Received productId:', productId); // Debugging line
if (!mongoose.Types.ObjectId.isValid(productId)) {
  return res.status(400).json({ message: 'Invalid product ID' });
}


    // Find the product by ID and ensure it's associated with the correct admin
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) return res.status(404).json({ message: 'Product not found' });

    // Check if the current admin is the one who created this product
    // if (existingProduct.adminId.toString() !== adminId) {
    //   return res.status(403).json({ message: 'You do not have permission to edit this product' });
    // }

    // Validate numeric fields (as an example, adapt according to your schema)
    const numericFields = ['Carat', 'Length', 'Breadth', 'Height', 'Price/ct', 'Amount'];
const optionalFields = ['BGM', 'H&C', '3EX'];

for (const field of numericFields) {
    if (product[field] === undefined || isNaN(product[field])) {
        return res.status(400).json({ message: `Invalid value for ${field}. Must be a number.` });
    }
}

// Ensure optional fields can be empty
optionalFields.forEach(field => {
    if (!product[field]) {
        product[field] = "";
    }
});


    // Update the product with new data
    Object.assign(existingProduct, product);
    await existingProduct.save();

    res.status(200).json({ message: 'Product updated successfully!', product: existingProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
});


// Delete Product - Admin only
router.delete('/delete-product/:productId', async (req, res) => {
  try {
    const { productId } = req.params; // Use product ID as identifier
    const { adminId } = req.query; // Get adminId from query string

    // Validate that adminId is provided
    if (!adminId) {
      return res.status(400).json({ message: 'Admin ID is required' });
    }

    // Find the product by ID
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) return res.status(404).json({ message: 'Product not found' });

    // Ensure the product is associated with the admin who is trying to delete it
    // if (existingProduct.adminId.toString() !== adminId) {
    //   return res.status(403).json({ message: 'You do not have permission to delete this product' });
    // }

    // Delete the product
    await Product.findByIdAndDelete(productId);

    res.status(200).json({ message: 'Product deleted successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;
