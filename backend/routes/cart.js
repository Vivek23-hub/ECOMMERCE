import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// GET /api/cart - Get user cart with product details
router.get("/", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(req.user.userId) },
      { projection: { cart: 1 } }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const cart = user.cart || [];

    if (cart.length === 0) {
      return res.json({ cart: [], totalAmount: 0 });
    }

    const productIds = cart.map((item) => new ObjectId(item.productId));
    const products = await db.collection("products").find({ _id: { $in: productIds } }).toArray();

    const cartWithDetails = cart.map((item) => {
      const product = products.find((p) => p._id.toString() === item.productId.toString());
      return {
        productId: item.productId,
        quantity: item.quantity,
        name: product ? product.name : "Product not found",
        price: product ? product.price : 0,
        stock: product ? product.stock : 0,
        category: product ? product.category : "",
      };
    });

    const totalAmount = cartWithDetails.reduce((sum, item) => sum + item.price * item.quantity, 0);

    res.json({ cart: cartWithDetails, totalAmount });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// POST /api/cart - Add item to cart
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ message: "Product ID and valid quantity are required." });
    }

    const db = getDB();
    const product = await db.collection("products").findOne({ _id: new ObjectId(productId) });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: `Only ${product.stock} items available in stock.` });
    }

    const user = await db.collection("users").findOne({ _id: new ObjectId(req.user.userId) });
    const existingItem = user.cart.find((item) => item.productId.toString() === productId);

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (newQty > product.stock) {
        return res.status(400).json({ message: `Only ${product.stock} items available in stock.` });
      }

      await db.collection("users").updateOne(
        { _id: new ObjectId(req.user.userId), "cart.productId": new ObjectId(productId) },
        { $set: { "cart.$.quantity": newQty } }
      );
    } else {
      await db.collection("users").updateOne(
        { _id: new ObjectId(req.user.userId) },
        { $push: { cart: { productId: new ObjectId(productId), quantity } } }
      );
    }

    res.json({ message: "Item added to cart." });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// PUT /api/cart - Update cart item quantity
router.put("/", authMiddleware, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity == null || quantity < 1) {
      return res.status(400).json({ message: "Product ID and valid quantity are required." });
    }

    const db = getDB();
    const product = await db.collection("products").findOne({ _id: new ObjectId(productId) });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    if (quantity > product.stock) {
      return res.status(400).json({ message: `Only ${product.stock} items available in stock.` });
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(req.user.userId), "cart.productId": new ObjectId(productId) },
      { $set: { "cart.$.quantity": quantity } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Item not found in cart." });
    }

    res.json({ message: "Cart updated." });
  } catch (error) {
    console.error("Update cart error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// DELETE /api/cart/:productId - Remove item from cart
router.delete("/:productId", authMiddleware, async (req, res) => {
  try {
    const db = getDB();

    await db.collection("users").updateOne(
      { _id: new ObjectId(req.user.userId) },
      { $pull: { cart: { productId: new ObjectId(req.params.productId) } } }
    );

    res.json({ message: "Item removed from cart." });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

export default router;
