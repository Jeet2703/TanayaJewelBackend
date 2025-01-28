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
    const query = {};
    const filters = req.query;

    // Map filter keys to schema fields
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
      handa: "HA", // Corrected mapping
      "3ex": "3EX",
    };

    // Construct the query object dynamically
    const orFilters = Object.keys(filters).reduce((acc, filterKey) => {
      const mappedField = fieldMapping[filterKey.toLowerCase()];
      if (mappedField && filters[filterKey]) {
        const values = filters[filterKey].split(","); // Split comma-separated values
        acc.push({ [mappedField]: { $in: values } });
      }
      return acc;
    }, []);

    // Fetch products
    const products = await Product.find(orFilters.length > 0 ? { $or: orFilters } : {}).lean();

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found matching the selected filters." });
    }

    // Define the shape priority order
    const shapePriority = [
      "BR", "MQ", "PS", "OV", "EM", "HS", "PR", "BGT", "RAD", "CU", "TRI", "OTH",
    ];

    // Custom sort logic
    const sortedProducts = products.sort((a, b) => {
      // Sort by Carat (ascending)
      if (a.Carat !== b.Carat) {
        return a.Carat - b.Carat;
      }

      // Sort by Shape based on priority order
      const shapeAIndex = shapePriority.indexOf(a.Shape) >= 0 ? shapePriority.indexOf(a.Shape) : shapePriority.length;
      const shapeBIndex = shapePriority.indexOf(b.Shape) >= 0 ? shapePriority.indexOf(b.Shape) : shapePriority.length;

      if (shapeAIndex !== shapeBIndex) {
        return shapeAIndex - shapeBIndex;
      }

      // Additional sorting criteria can be added here if needed
      return 0;
    });

    // Return the sorted products
    return res.status(200).json({ products: sortedProducts });
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
    for (const field of numericFields) {
      if (isNaN(product[field])) {
        return res.status(400).json({ message: `Invalid value for ${field}. Must be a number.` });
      }
    }

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
