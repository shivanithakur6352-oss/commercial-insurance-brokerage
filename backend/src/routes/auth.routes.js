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


router.post("/forgot-password", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const genericMessage = "If an account exists for that email, a password reset link will be sent.";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.json({ message: genericMessage });
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: genericMessage });
    if (!process.env.RESEND_API_KEY || !process.env.RESET_EMAIL_FROM || !process.env.CLIENT_URL) {
      return res.status(503).json({ message: "Password reset email is not configured. Please contact support." });
    }
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const resetUrl = `${process.env.CLIENT_URL.replace(/\/$/, "")}/?resetToken=${rawToken}`;
    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESET_EMAIL_FROM,
        to: [user.email],
        subject: "Reset your CoverBridge password",
        html: `<p>Hello ${String(user.name || "there").replace(/[&<>"]/g, "")},</p><p>We received a request to reset your CoverBridge password.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 30 minutes and can only be used once. If you did not request this, ignore this email.</p>`
      })
    });
    if (!emailResponse.ok) {
      console.error("Password reset email provider error:", await emailResponse.text());
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save();
      return res.status(502).json({ message: "Could not send the reset email. Please try again later." });
    }
    return res.json({ message: genericMessage });
  } catch (error) { next(error); }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const token = String(req.body.token || "");
    const password = String(req.body.password || "");
    if (!token || password.length < 8) return res.status(400).json({ message: "A valid reset token and password of at least 8 characters are required." });
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ passwordResetTokenHash: tokenHash, passwordResetExpiresAt: { $gt: new Date() } }).select("+passwordResetTokenHash +passwordResetExpiresAt");
    if (!user) return res.status(400).json({ message: "This reset link is invalid or has expired. Please request a new one." });
    user.passwordHash = await bcrypt.hash(password, 12);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();
    return res.json({ message: "Password updated successfully. You can now sign in with your new password." });
  } catch (error) { next(error); }
});

router.get("/me", auth, (req, res) => res.json({ user: safeUser(req.user) }));

module.exports = router;
