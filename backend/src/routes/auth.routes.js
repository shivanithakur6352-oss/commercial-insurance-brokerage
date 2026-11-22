
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");


const User = require("../models/User");
const { auth } = require("../middleware/auth");

async function sendOtpEmail(to, subject, html) {
  const url = process.env.GMAIL_SCRIPT_URL;
  const secret = process.env.GMAIL_SCRIPT_SECRET;
  if (!url || !secret) throw new Error("Gmail Apps Script email service is not configured");
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, to, subject, html })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Gmail email delivery failed");
  }
}


const safeUser = u => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  companyName: u.companyName,
  phone: u.phone
});

function signToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
}

// Public registration creates customer accounts only.
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
      return res.status(409).json({
        message: "Email is already registered"
      });
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

    res.status(201).json({
      token: signToken(user),
      user: safeUser(user)
    });
  } catch (error) {
    next(error);
  }
});

// Login: password check followed by mandatory email OTP verification.
router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const user = await User.findOne({ email }).select(
      "+loginOtpHash +loginOtpExpiresAt +loginOtpAttempts"
    );

    if (!user || !(await bcrypt.compare(req.body.password || "", user.passwordHash))) {
      return res.status(401).json({ message: "Incorrect email or password" });
    }

    const otp = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    user.loginOtpHash = crypto.createHash("sha256").update(otp).digest("hex");
    user.loginOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.loginOtpAttempts = 0;
    await user.save();

    try {
      await sendOtpEmail(user.email, "Your CoverBridge Login OTP",
        `<div style="font-family:Arial,sans-serif;padding:20px"><h2>CoverBridge Login Verification</h2><p>Hello ${String(user.name || "there").replace(/[&<>"']/g, "")},</p><p>Your login OTP is:</p><h1 style="letter-spacing:8px;color:#1947b8">${otp}</h1><p>This OTP expires in 10 minutes. If you did not try to sign in, please secure your account.</p></div>`);
    } catch (mailError) {
      console.error("Login OTP email error:", mailError);
      user.loginOtpHash = undefined; user.loginOtpExpiresAt = undefined; user.loginOtpAttempts = 0;
      await user.save();
      return res.status(502).json({ message: "Could not send login OTP. Please try again." });
    }

    res.json({ requiresOtp: true, email: user.email, message: "A 6-digit login OTP has been sent to your registered email." });
  } catch (error) { next(error); }
});

// Verify login OTP: only this route issues the login JWT.
router.post("/verify-login-otp", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();
    if (!email || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: "Enter your registered email and 6-digit OTP." });
    }
    const hash = crypto.createHash("sha256").update(otp).digest("hex");
    const user = await User.findOne({ email }).select("+loginOtpHash +loginOtpExpiresAt +loginOtpAttempts");
    if (!user || !user.loginOtpHash || !user.loginOtpExpiresAt || user.loginOtpExpiresAt <= new Date() || (user.loginOtpAttempts || 0) >= 5) {
      return res.status(400).json({ message: "OTP is invalid or expired. Please sign in again." });
    }
    if (user.loginOtpHash !== hash) {
      user.loginOtpAttempts = (user.loginOtpAttempts || 0) + 1;
      if (user.loginOtpAttempts >= 5) {
        user.loginOtpHash = undefined; user.loginOtpExpiresAt = undefined; user.loginOtpAttempts = 0;
      }
      await user.save();
      return res.status(400).json({ message: "Incorrect OTP. Please try again." });
    }
    user.loginOtpHash = undefined; user.loginOtpExpiresAt = undefined; user.loginOtpAttempts = 0;
    await user.save();
    res.json({ token: signToken(user), user: safeUser(user) });
  } catch (error) { next(error); }
});

// Bootstrap admin
router.post("/bootstrap-admin", async (req, res, next) => {
  try {
    const configuredSecret = process.env.ADMIN_BOOTSTRAP_SECRET || "";
    const suppliedSecret = String(
      req.headers["x-admin-bootstrap-secret"] || ""
    );

    const configured = Buffer.from(configuredSecret);
    const supplied = Buffer.from(suppliedSecret);

    if (
      !configuredSecret ||
      configured.length !== supplied.length ||
      !crypto.timingSafeEqual(configured, supplied)
    ) {
      return res.status(403).json({
        message: "Invalid bootstrap credentials"
      });
    }

    if (await User.exists({ role: "admin" })) {
      return res.status(409).json({
        message: "An admin account already exists. Bootstrap is disabled."
      });
    }

    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Account email is required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "Create a customer account with this email first, then bootstrap it."
      });
    }

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

// Forgot password - Resend API
router.post("/forgot-password", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    const genericMessage =
      "If an account exists for that email, a 6-digit OTP will be sent.";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.json({ message: genericMessage });
    }

    const user = await User.findOne({ email }).select(
      "+passwordResetTokenHash +passwordResetExpiresAt +passwordResetAttempts"
    );

    if (!user) return res.json({ message: genericMessage });

    const otp = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    user.passwordResetTokenHash = crypto.createHash("sha256").update(otp).digest("hex");
    user.passwordResetExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.passwordResetAttempts = 0;
    await user.save();

    try {
      await sendOtpEmail(user.email, "Your CoverBridge Password Reset OTP",
        `<div style="font-family:Arial,sans-serif;padding:20px"><h2>CoverBridge Password Reset</h2><p>Hello ${String(user.name || "there").replace(/[&<>"']/g, "")},</p><p>Your password reset OTP is:</p><h1 style="letter-spacing:8px;color:#1947b8">${otp}</h1><p>This OTP expires in 10 minutes.</p><p>If you did not request this, ignore this email.</p></div>`);
    } catch (mailError) {
      console.error("Password reset email error:", mailError);
      user.passwordResetTokenHash = undefined; user.passwordResetExpiresAt = undefined; user.passwordResetAttempts = 0;
      await user.save();
      return res.status(502).json({ message: "Could not send OTP email. Please try again." });
    }

    return res.json({ message: genericMessage });

  } catch (error) {
    next(error);
  }
});

// Reset password
router.post("/reset-password", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();
    const password = String(req.body.password || "");

    if (!email || !/^\d{6}$/.test(otp) || password.length < 8) {
      return res.status(400).json({
        message: "Enter your registered email, 6-digit OTP and a password of at least 8 characters."
      });
    }

    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const user = await User.findOne({
      email,
      passwordResetTokenHash: otpHash,
      passwordResetExpiresAt: { $gt: new Date() },
      passwordResetAttempts: { $lt: 5 }
    }).select(
      "+passwordResetTokenHash +passwordResetExpiresAt +passwordResetAttempts"
    );

    if (!user) {
      const pendingUser = await User.findOne({ email }).select(
        "+passwordResetTokenHash +passwordResetExpiresAt +passwordResetAttempts"
      );

      if (
        pendingUser &&
        pendingUser.passwordResetTokenHash &&
        pendingUser.passwordResetExpiresAt > new Date()
      ) {
        pendingUser.passwordResetAttempts =
          (pendingUser.passwordResetAttempts || 0) + 1;

        if (pendingUser.passwordResetAttempts >= 5) {
          pendingUser.passwordResetTokenHash = undefined;
          pendingUser.passwordResetExpiresAt = undefined;
          pendingUser.passwordResetAttempts = 0;
        }

        await pendingUser.save();
      }

      return res.status(400).json({
        message: "The OTP is invalid, expired, or has reached the maximum number of attempts. Please request a new OTP."
      });
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    user.passwordResetAttempts = 0;

    await user.save();

    return res.json({
      message: "Password updated successfully. You can now sign in with your new password."
    });

  } catch (error) {
    next(error);
  }
});

// Current user
router.get("/me", auth, (req, res) => {
  res.json({ user: safeUser(req.user) });
});

module.exports = router;
