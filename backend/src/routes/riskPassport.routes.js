const router = require("express").Router();
const RiskPassport = require("../models/RiskPassport");
const { auth, allow } = require("../middleware/auth");

const allowedAnswers = new Set(["mfa", "backup", "response", "governance", "disclosures", "keyperson", "continuity"]);
const allowedBusinessTypes = new Set([
  "Technology / SaaS", "Professional services", "Manufacturing",
  "Healthcare", "Retail / E-commerce", "Financial services", "Other"
]);

function buildAssessment(answers) {
  const score = Math.round((answers.length / allowedAnswers.size) * 100);
  const recommendations = [];
  if (!["mfa", "backup", "response"].every((id) => answers.includes(id))) recommendations.push("Cyber Liability");
  if (!["governance", "disclosures"].every((id) => answers.includes(id))) recommendations.push("D&O");
  if (!["keyperson", "continuity"].every((id) => answers.includes(id))) recommendations.push("Key-Person");
  return { score, recommendations };
}

// Customers can save or update their own latest Risk Passport.
router.put("/", auth, allow("customer"), async (req, res, next) => {
  try {
    const { companyType, answers } = req.body;
    if (!allowedBusinessTypes.has(companyType)) {
      return res.status(400).json({ message: "Please select a valid business type." });
    }
    if (!Array.isArray(answers) || answers.some((answer) => !allowedAnswers.has(answer))) {
      return res.status(400).json({ message: "Risk Passport answers are invalid." });
    }
    const cleanAnswers = [...new Set(answers)];
    const assessment = buildAssessment(cleanAnswers);
    const passport = await RiskPassport.findOneAndUpdate(
      { customer: req.user._id },
      { $set: { companyType, answers: cleanAnswers, ...assessment, assessmentVersion: 1 } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ passport, message: "Risk Passport saved securely." });
  } catch (error) { next(error); }
});

// Customers see only their own passport. Brokers/admins can review saved passports.
router.get("/", auth, allow("customer", "broker", "admin"), async (req, res, next) => {
  try {
    if (req.user.role === "customer") {
      const passport = await RiskPassport.findOne({ customer: req.user._id });
      return res.json({ passport });
    }
    const passports = await RiskPassport.find()
      .populate("customer", "name email companyName")
      .sort({ updatedAt: -1 });
    res.json({ passports });
  } catch (error) { next(error); }
});

module.exports = router;
