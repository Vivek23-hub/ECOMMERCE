import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDB } from "../config/db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Block admin email from registering
    if (email === process.env.ADMIN_EMAIL) {
      return res.status(400).json({ message: "Email already registered." });
    }

    const db = getDB();
    const usersCollection = db.collection("users");

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name,
      email,
      password: hashedPassword,
      cart: [],
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    const token = jwt.sign(
      { userId: result.insertedId, email, name, isAdmin: false },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Registration successful.",
      token,
      user: { id: result.insertedId, name, email, isAdmin: false },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Admin login — credentials from env, not from users collection
    if (email === process.env.ADMIN_EMAIL) {
      const isMatch = await bcrypt.compare(password, process.env.ADMIN_PASSWORD);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password." });
      }

      const token = jwt.sign(
        { userId: "admin", email, name: "Admin", isAdmin: true },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        message: "Login successful.",
        token,
        user: { id: "admin", name: "Admin", email, isAdmin: true },
      });
    }

    // Normal user login
    const db = getDB();
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name, isAdmin: false },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful.",
      token,
      user: { id: user._id, name: user.name, email: user.email, isAdmin: false },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    // Admin — return directly from token, no DB lookup
    if (req.user.isAdmin) {
      return res.json({
        user: {
          id: "admin",
          name: "Admin",
          email: req.user.email,
          isAdmin: true,
          cart: [],
        },
      });
    }

    // Normal user
    const db = getDB();
    const { ObjectId } = await import("mongodb");
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(req.user.userId) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: false,
        cart: user.cart,
      },
    });
  } catch (error) {
    console.error("Me error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

export default router;
