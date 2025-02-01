const express = require('express');
const router = express.Router();
const Product = require('../models/products'); // Assuming Product model is correctly defined
const mongoose = require('mongoose');
const xlsx = require('xlsx');

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
    let { page = 1, limit = 20 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // Fetch paginated products
    const products = await Product.find().skip(skip).limit(limit);

    // Get total count of products
    const totalProducts = await Product.countDocuments();

    res.status(200).json({
      products,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/products", async (req, res) => {
  try {
    console.log("Received filters:", req.query);

    const filters = Object.keys(req.query).reduce((acc, key) => {
      acc[key] = decodeURIComponent(req.query[key]);
      return acc;
    }, {});

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
      HAndC: "H&C",
      "3EX": "3EX",
    };

    let matchedFilters = {};
    let unmatchedFilters = {};
    let matchedProductIds = new Set();

    // === STEP 1: SHAPE FILTERING ===
    if (filters.shape) {
      const shapeValues = filters.shape.split(",");
      console.log(`Checking shape: ${shapeValues}`);

      const shapeMatchedProducts = await Product.find({
        Shape: { $in: shapeValues }
      }).lean();

      if (shapeMatchedProducts.length === 0) {
        return res.status(200).json({
          products: [],
          message: "No products found for the selected shape.",
          matchedFilters: {},
          unmatchedFilters: { shape: shapeValues }
        });
      }

      const uniqueShapesInData = [...new Set(shapeMatchedProducts.map(p => p.Shape))];
      matchedFilters.shape = uniqueShapesInData.length === 1 ? [uniqueShapesInData[0]] : uniqueShapesInData;
      matchedProductIds = new Set(shapeMatchedProducts.map(p => p._id));

      console.log("Matched shapes:", matchedFilters.shape);
    } else {
      // If no shape filter is applied, fetch all products initially.
      const allProducts = await Product.find({}).lean();
      matchedProductIds = new Set(allProducts.map(p => p._id));
      console.log("No shape filter. Checking all products.");
    }

    // === STEP 2: CARAT FILTERING (WITH RANGES) ===
    if (filters.carat) {
      const caratValues = filters.carat.split(",");
      console.log(`Checking carat: ${caratValues}`);

      const caratRanges = {
        '0.1': [0.100, 0.149],
        '0.15': [0.150, 0.199],
        '0.2': [0.200, 0.249],
        '0.25': [0.250, 0.299],
        '0.3': [0.300, 0.399],
        '0.4': [0.400, 0.499],
        '0.5': [0.500, 0.599],
        '0.6': [0.600, 0.699],
        '0.7': [0.700, 0.799],
        '0.8': [0.800, 0.899],
        '0.9': [0.900, 0.999],
        '1': [1.000, 1.999],
        '2': [2.000, 2.999],
        '3': [3.000, 3.999],
        '4': [4.000, 4.999],
        '5': [5.000, 5.999],
        '10': [10.000, 10.999],
      };

      const caratConditions = caratValues.flatMap(value => {
        const range = caratRanges[value];
        if (range) {
          return { Carat: { $gte: range[0], $lt: range[1] } };
        }
        return [];
      });

      if (caratConditions.length === 0) {
        return res.status(200).json({
          products: [],
          message: "No products found for the selected carat.",
          matchedFilters,
          unmatchedFilters: { carat: caratValues }
        });
      }

      const caratMatchedProducts = await Product.find({
        _id: { $in: [...matchedProductIds] },
        $or: caratConditions
      }).lean();

      if (caratMatchedProducts.length === 0) {
        return res.status(200).json({
          products: [],
          message: "No products found for the selected carat.",
          matchedFilters,
          unmatchedFilters: { carat: caratValues }
        });
      }

      matchedFilters.carat = [...new Set(caratMatchedProducts.map(p => p.Carat))];
      matchedProductIds = new Set(caratMatchedProducts.map(p => p._id));

      console.log("Matched carats:", matchedFilters.carat);
    }

    // === STEP 3: COLOR FILTERING ===
    if (filters.color) {
      const colorValues = filters.color.split(",");
      console.log(`Checking color: ${colorValues}`);

      const colorMatchedProducts = await Product.find({
        _id: { $in: [...matchedProductIds] },
        Color: { $in: colorValues }
      }).lean();

      if (colorMatchedProducts.length === 0) {
        return res.status(200).json({
          products: [],
          message: "No products found for the selected color.",
          matchedFilters,
          unmatchedFilters: { color: colorValues }
        });
      }

      matchedFilters.color = [...new Set(colorMatchedProducts.map(p => p.Color))];
      matchedProductIds = new Set(colorMatchedProducts.map(p => p._id));

      console.log("Matched colors:", matchedFilters.color);
    }

    // === STEP 4: OTHER FILTERS (Clarity, Cut, etc.) ===
    for (const [filterKey, filterValue] of Object.entries(filters)) {
      if (["shape", "carat", "color"].includes(filterKey)) continue;

      const mappedField = fieldMapping[filterKey];
      if (!mappedField) continue;

      console.log(`Checking ${filterKey}: ${filterValue}`);

      const valuesArray = filterValue.split(",");
      const matchedProducts = await Product.find({
        _id: { $in: [...matchedProductIds] },
        [mappedField]: { $in: valuesArray }
      }).lean();

      if (matchedProducts.length === 0) {
        return res.status(200).json({
          products: [],
          message: `No products found for the selected ${filterKey}.`,
          matchedFilters,
          unmatchedFilters: { ...unmatchedFilters, [filterKey]: valuesArray }
        });
      }

      matchedFilters[filterKey] = [...new Set(matchedProducts.map(p => p[mappedField]))];
      matchedProductIds = new Set(matchedProducts.map(p => p._id));

      console.log(`Matched ${filterKey}:`, matchedFilters[filterKey]);
    }

    // === FINAL RESULT ===
    const finalProducts = await Product.find({ _id: { $in: [...matchedProductIds] } }).sort({ Carat: 1 }).lean();

    if (finalProducts.length === 0) {
      return res.status(200).json({
        products: [],
        message: "No matching products found.",
        matchedFilters,
        unmatchedFilters
      });
    }

    return res.status(200).json({
      products: finalProducts,
      matchedFilters,
      unmatchedFilters,
      message: "Products found matching the filters."
    });

  } catch (error) {
    console.error("Error fetching products:", error);
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
// router.delete('/delete-product/:productId', async (req, res) => {
//   try {
//     const { productId } = req.params; // Use product ID as identifier
//     const { adminId } = req.query; // Get adminId from query string

//     // Validate that adminId is provided
//     if (!adminId) {
//       return res.status(400).json({ message: 'Admin ID is required' });
//     }

//     // Find the product by ID
//     const existingProduct = await Product.findById(productId);
//     if (!existingProduct) return res.status(404).json({ message: 'Product not found' });

//     // Ensure the product is associated with the admin who is trying to delete it
//     // if (existingProduct.adminId.toString() !== adminId) {
//     //   return res.status(403).json({ message: 'You do not have permission to delete this product' });
//     // }

//     // Delete the product
//     await Product.findByIdAndDelete(productId);

//     res.status(200).json({ message: 'Product deleted successfully!' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: error.message });
//   }
// });

router.delete('/delete-products', async (req, res) => {
  try {
    const { productIds } = req.body; // Expect an array of product IDs
    const { adminId } = req.query; // Get adminId from query string

    if (!adminId) {
      return res.status(400).json({ message: 'Admin ID is required' });
    }

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'No products selected for deletion' });
    }

    // Find and delete products associated with the admin
    const result = await Product.deleteMany({ _id: { $in: productIds } });

    res.status(200).json({ message: `${result.deletedCount} products deleted successfully!` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/delete-products-excel', async (req, res) => {
  try {
    const { certificateNumbers } = req.body;

    if (!certificateNumbers || !Array.isArray(certificateNumbers) || certificateNumbers.length === 0) {
      return res.status(400).json({ message: "No valid Certificate No found for deletion", deletedCount: 0 });
    }

    // Delete products matching Certificate No
    const result = await Product.deleteMany({ "Certificate No": { $in: certificateNumbers } });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Data is not present", deletedCount: 0 });
    }

    res.status(200).json({ message: `${result.deletedCount} products deleted successfully!`, deletedCount: result.deletedCount });

  } catch (error) {
    console.error("Error in deleting products:", error);
    res.status(500).json({ message: "Internal server error.", error: error.message, deletedCount: 0 });
  }
});




module.exports = router;
