const mongoose = require("mongoose");

const riskPassportSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  companyType: { type: String, required: true, trim: true, maxlength: 100 },
  answers: [{ type: String, enum: ["mfa", "backup", "response", "governance", "disclosures", "keyperson", "continuity"] }],
  score: { type: Number, min: 0, max: 100, required: true },
  recommendations: [{ type: String, enum: ["Cyber Liability", "D&O", "Key-Person"] }],
  assessmentVersion: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model("RiskPassport", riskPassportSchema);
