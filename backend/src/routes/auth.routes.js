const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const safeUser = u => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  companyName: u.companyName,
  phone: u.phone
});

function signToken(user) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "12h" });
}

// Public registration can ONLY create customer accounts.
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, companyName, phone } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!name || !normalizedEmail || !password || password.length < 8) {
      return res.status(400).json({
        message: "Name, valid email and password (at least 8 characters) are required"
      });
    }

    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      companyName,
      phone,
      role: "customer"
    });

    res.status(201).json({ token: signToken(user), user: safeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(req.body.password || "", user.passwordHash))) {
      return res.status(401).json({ message: "Incorrect email or password" });
    }

    res.json({ token: signToken(user), user: safeUser(user) });
  } catch (error) {
    next(error);
  }
});

// One-time, secret-protected bootstrap. Promotes an existing account only when
// the database has no admin yet. Never expose ADMIN_BOOTSTRAP_SECRET to the frontend.
router.post("/bootstrap-admin", async (req, res, next) => {
  try {
    const configuredSecret = process.env.ADMIN_BOOTSTRAP_SECRET || "";
    const suppliedSecret = String(req.headers["x-admin-bootstrap-secret"] || "");
    const configured = Buffer.from(configuredSecret);
    const supplied = Buffer.from(suppliedSecret);

    if (!configuredSecret || configured.length !== supplied.length ||
        !crypto.timingSafeEqual(configured, supplied)) {
      return res.status(403).json({ message: "Invalid bootstrap credentials" });
    }

    if (await User.exists({ role: "admin" })) {
      return res.status(409).json({ message: "An admin account already exists. Bootstrap is disabled." });
    }

    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Account email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Create a customer account with this email first, then bootstrap it." });

    user.role = "admin";
    await user.save();

    res.json({
      message: "Admin account created. Sign in again to receive admin permissions.",
      user: safeUser(user)
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", auth, (req, res) => res.json({ user: safeUser(req.user) }));

module.exports = router;
