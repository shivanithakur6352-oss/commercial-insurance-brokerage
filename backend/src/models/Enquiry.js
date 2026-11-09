const mongoose = require("mongoose");
const enquirySchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  companyName: { type: String, required: true, trim: true },
  industry: { type: String, required: true, trim: true },
  employeeCount: { type: Number, min: 1, default: 1 },
  annualRevenue: { type: String, default: "" },
  country: { type: String, required: true, default: "India" },
  insuranceType: { type: String, enum: ["D&O", "Cyber Liability", "Key-Person"], required: true },
  coverageNotes: { type: String, maxlength: 3000, default: "" },
  riskAssessment: { type: String, default: "" },
  status: { type: String, enum: ["submitted", "under_review", "quote_ready", "closed"], default: "submitted" },
  brokerNotes: { type: String, maxlength: 3000, default: "" },
  quotation: {
    insurer: String, indicativePremium: String, coverageLimit: String,
    deductible: String, validityDate: String, terms: String, documentUrl: String
  }
}, { timestamps: true });
module.exports = mongoose.model("Enquiry", enquirySchema);
