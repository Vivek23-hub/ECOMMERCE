import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";

const router = Router();

// POST /api/orders/checkout - Checkout (create order from cart)
router.post("/checkout", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection("users").findOne({ _id: new ObjectId(req.user.userId) });

    if (!user || !user.cart || user.cart.length === 0) {
      return res.status(400).json({ message: "Cart is empty." });
    }

    const productIds = user.cart.map((item) => new ObjectId(item.productId));
    const products = await db.collection("products").find({ _id: { $in: productIds } }).toArray();

    // Validate stock for all items
    for (const cartItem of user.cart) {
      const product = products.find((p) => p._id.toString() === cartItem.productId.toString());

      if (!product) {
        return res.status(400).json({
          message: `Product not found for ID: ${cartItem.productId}`,
        });
      }

      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${cartItem.quantity}`,
        });
      }
    }

    // Build order items and calculate total
    const orderItems = [];
    let totalAmount = 0;

    for (const cartItem of user.cart) {
      const product = products.find((p) => p._id.toString() === cartItem.productId.toString());
      const itemTotal = product.price * cartItem.quantity;

      orderItems.push({
        productId: new ObjectId(cartItem.productId),
        quantity: cartItem.quantity,
        priceAtPurchase: product.price,
      });

      totalAmount += itemTotal;
    }

    // Deduct stock for each product
    for (const cartItem of user.cart) {
      await db.collection("products").updateOne(
        { _id: new ObjectId(cartItem.productId) },
        {
          $inc: { stock: -cartItem.quantity },
          $set: { updatedAt: new Date() },
        }
      );
    }

    // Create order
    const order = {
      userId: new ObjectId(req.user.userId),
      items: orderItems,
      totalAmount,
      status: "pending",
      paymentMethod: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("orders").insertOne(order);

    // Clear user cart
    await db.collection("users").updateOne(
      { _id: new ObjectId(req.user.userId) },
      { $set: { cart: [] } }
    );

    res.status(201).json({
      message: "Order placed successfully.",
      order: { ...order, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/orders/my - Get user's orders
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const orders = await db
      .collection("orders")
      .find({ userId: new ObjectId(req.user.userId) })
      .sort({ createdAt: -1 })
      .toArray();

    // Populate product names
    for (const order of orders) {
      for (const item of order.items) {
        const product = await db.collection("products").findOne(
          { _id: new ObjectId(item.productId) },
          { projection: { name: 1, category: 1 } }
        );
        item.productName = product ? product.name : "Deleted Product";
        item.productCategory = product ? product.category : "";
      }
    }

    res.json(orders);
  } catch (error) {
    console.error("Get my orders error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/orders/all - Get all orders (admin only)
router.get("/all", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const orders = await db.collection("orders").find().sort({ createdAt: -1 }).toArray();

    // Populate user names and product names
    for (const order of orders) {
      const user = await db.collection("users").findOne(
        { _id: new ObjectId(order.userId) },
        { projection: { name: 1, email: 1 } }
      );
      order.userName = user ? user.name : "Unknown User";
      order.userEmail = user ? user.email : "";

      for (const item of order.items) {
        const product = await db.collection("products").findOne(
          { _id: new ObjectId(item.productId) },
          { projection: { name: 1 } }
        );
        item.productName = product ? product.name : "Deleted Product";
      }
    }

    res.json(orders);
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// PUT /api/orders/:id/payment - User selects payment method (COD or UPI)
router.put("/:id/payment", authMiddleware, async (req, res) => {
  try {
    const { paymentMethod } = req.body;

    if (!paymentMethod || !["COD", "UPI"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Payment method must be 'COD' or 'UPI'." });
    }

    const db = getDB();
    const order = await db.collection("orders").findOne({ _id: new ObjectId(req.params.id) });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "Access denied." });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ message: "Payment already completed for this order." });
    }

    const result = await db.collection("orders").findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: { paymentMethod, status: "completed", updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    res.json({ message: "Payment method selected. Order completed.", order: result });
  } catch (error) {
    console.error("Payment method error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/orders/analytics - Dashboard analytics (admin only)
router.get("/analytics", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getDB();

    const totalOrders = await db.collection("orders").countDocuments();
    const pendingOrders = await db.collection("orders").countDocuments({ status: "pending" });
    const completedOrders = await db.collection("orders").countDocuments({ status: "completed" });

    const revenueResult = await db
      .collection("orders")
      .aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }])
      .toArray();
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    const totalProducts = await db.collection("products").countDocuments();
    const totalUsers = await db.collection("users").countDocuments();

    const leastStockProduct = await db
      .collection("products")
      .find()
      .sort({ stock: 1 })
      .limit(1)
      .toArray();

    const outOfStockProducts = await db.collection("products").countDocuments({ stock: 0 });

    res.json({
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      totalProducts,
      totalUsers,
      leastStockProduct: leastStockProduct.length > 0 ? leastStockProduct[0] : null,
      outOfStockProducts,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

export default router;
