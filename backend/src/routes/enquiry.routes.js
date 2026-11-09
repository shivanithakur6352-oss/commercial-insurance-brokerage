const router = require("express").Router();
const Enquiry = require("../models/Enquiry");
const { auth, allow } = require("../middleware/auth");

// Simple transparent intake helper. It is not underwriting or an insurance recommendation.
function summarizeRisk(body) {
  const flags = [];
  if (body.insuranceType === "Cyber Liability") flags.push("Confirm MFA, backups, incident response plan and prior incidents with your broker.");
  if (body.insuranceType === "D&O") flags.push("Prepare director details, funding history, financial statements and litigation disclosures.");
  if (body.insuranceType === "Key-Person") flags.push("Identify the key person's role and business impact; discuss consent and insurable interest with your broker.");
  return "Preparation checklist (not an underwriting decision): " + flags.join(" ");
}
router.post("/", auth, allow("customer"), async (req, res, next) => {
  try {
    const { companyName, industry, employeeCount, annualRevenue, country, insuranceType, coverageNotes } = req.body;
    if (!companyName || !industry || !insuranceType) return res.status(400).json({ message: "Company, industry and insurance type are required" });
    const riskAssessment = summarizeRisk(req.body);
    const enquiry = await Enquiry.create({ customer: req.user._id, companyName, industry, employeeCount, annualRevenue, country, insuranceType, coverageNotes, riskAssessment });
    res.status(201).json({ enquiry });
  } catch (e) { next(e); }
});
router.get("/mine", auth, allow("customer"), async (req, res, next) => {
  try { res.json({ enquiries: await Enquiry.find({ customer: req.user._id }).sort({ createdAt: -1 }) }); }
  catch (e) { next(e); }
});
router.get("/", auth, allow("broker", "admin"), async (_req, res, next) => {
  try { res.json({ enquiries: await Enquiry.find().populate("customer", "name email companyName").sort({ createdAt: -1 }) }); }
  catch (e) { next(e); }
});
router.patch("/:id/status", auth, allow("broker", "admin"), async (req, res, next) => {
  try {
    const allowed = ["submitted", "under_review", "quote_ready", "closed"];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ message: "Invalid status" });
    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, { status: req.body.status, brokerNotes: req.body.brokerNotes || "" }, { new: true });
    if (!enquiry) return res.status(404).json({ message: "Enquiry not found" });
    res.json({ enquiry });
  } catch (e) { next(e); }
});
router.put("/:id/quotation", auth, allow("broker", "admin"), async (req, res, next) => {
  try {
    const { insurer, indicativePremium, coverageLimit, deductible, validityDate, terms, documentUrl } = req.body;
    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, {
      quotation: { insurer, indicativePremium, coverageLimit, deductible, validityDate, terms, documentUrl },
      status: "quote_ready"
    }, { new: true });
    if (!enquiry) return res.status(404).json({ message: "Enquiry not found" });
    res.json({ enquiry });
  } catch (e) { next(e); }
});
module.exports = router;
