import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";

const router = Router();

// GET /api/products - Get all products (public)
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const products = await db.collection("products").find().sort({ createdAt: -1 }).toArray();
    res.json(products);
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/products/:id - Get single product (public)
router.get("/:id", async (req, res) => {
  try {
    const db = getDB();
    const product = await db.collection("products").findOne({ _id: new ObjectId(req.params.id) });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.json(product);
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// POST /api/products - Add product (admin only)
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, category, description, price, stock } = req.body;

    if (!name || !category || !description || price == null || stock == null) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const db = getDB();
    const newProduct = {
      name,
      category,
      description,
      price: Number(price),
      stock: Number(stock),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("products").insertOne(newProduct);

    res.status(201).json({
      message: "Product added successfully.",
      product: { ...newProduct, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Add product error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// PUT /api/products/:id - Update product (admin only)
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, category, description, price, stock } = req.body;
    const db = getDB();

    const updateFields = { updatedAt: new Date() };
    if (name !== undefined) updateFields.name = name;
    if (category !== undefined) updateFields.category = category;
    if (description !== undefined) updateFields.description = description;
    if (price !== undefined) updateFields.price = Number(price);
    if (stock !== undefined) updateFields.stock = Number(stock);

    const result = await db.collection("products").findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.json({ message: "Product updated successfully.", product: result });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// DELETE /api/products/:id - Delete product (admin only)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection("products").deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.json({ message: "Product deleted successfully." });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

export default router;
