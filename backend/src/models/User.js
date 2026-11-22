const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["customer", "broker", "admin"], default: "customer" },
  companyName: { type: String, trim: true, default: "" },
  phone: { type: String, trim: true, default: "" },
  passwordResetTokenHash: { type: String, select: false },
  passwordResetExpiresAt: { type: Date, select: false },
  passwordResetAttempts: { type: Number, default: 0, select: false },
  loginOtpHash: { type: String, select: false },
  loginOtpExpiresAt: { type: Date, select: false },
  loginOtpAttempts: { type: Number, default: 0, select: false }
}, { timestamps: true });
module.exports = mongoose.model("User", userSchema);
