const router = require("express").Router();
const User = require("../models/User");
const Enquiry = require("../models/Enquiry");
const RiskPassport = require("../models/RiskPassport");
const { auth, allow } = require("../middleware/auth");

router.use(auth, allow("admin"));

// Admin dashboard statistics
router.get("/overview", async (_req, res, next) => {
  try {
    const [
      totalUsers, customers, brokers, admins, totalEnquiries,
      submitted, reviewing, quoted, closed, totalQuotations
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "broker" }),
      User.countDocuments({ role: "admin" }),
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: "submitted" }),
      Enquiry.countDocuments({ status: "under_review" }),
      Enquiry.countDocuments({ status: "quote_ready" }),
      Enquiry.countDocuments({ status: "closed" }),
      Enquiry.countDocuments({ "quotation.insurer": { $exists: true, $ne: "" } })
    ]);

    res.json({
      totalUsers, customers, brokers, admins, totalEnquiries,
      submitted, reviewing, quoted, closed, totalQuotations
    });
  } catch (error) {
    next(error);
  }
});

// Get all users, optionally filtered by role
router.get("/users", async (req, res, next) => {
  try {
    const { role } = req.query;
    const allowedRoles = ["customer", "broker", "admin"];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid user role" });
    }

    const users = await User.find(role ? { role } : {})
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ users });
  } catch (error) {
    next(error);
  }
});

// Change a user's role. An administrator cannot accidentally demote themselves.
router.patch("/users/:id/role", async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["customer", "broker", "admin"].includes(role)) {
      return res.status(400).json({ message: "Role must be customer, broker or admin" });
    }
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot change your own admin role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User role updated successfully", user });
  } catch (error) {
    next(error);
  }
});

// Get all enquiries
router.get("/enquiries", async (_req, res, next) => {
  try {
    const enquiries = await Enquiry.find()
      .populate("customer", "name email companyName phone")
      .sort({ createdAt: -1 });
    res.json({ enquiries });
  } catch (error) {
    next(error);
  }
});

// Get all quotations
router.get("/quotations", async (_req, res, next) => {
  try {
    const quotations = await Enquiry.find({
      "quotation.insurer": { $exists: true, $ne: "" }
    })
      .populate("customer", "name email companyName")
      .sort({ updatedAt: -1 });
    res.json({ quotations });
  } catch (error) {
    next(error);
  }
});


// Risk Passport insights for administrators
router.get("/risk-passports", async (_req, res, next) => {
  try {
    const [total, profiles] = await Promise.all([
      RiskPassport.countDocuments(),
      RiskPassport.find()
        .populate("customer", "name email companyName")
        .sort({ updatedAt: -1 })
        .lean()
    ]);
    const averageScore = total
      ? Math.round(profiles.reduce((sum, item) => sum + item.score, 0) / total)
      : 0;
    const byRecommendation = {
      cyberLiability: profiles.filter(item => item.recommendations.includes("Cyber Liability")).length,
      directorsAndOfficers: profiles.filter(item => item.recommendations.includes("D&O")).length,
      keyPerson: profiles.filter(item => item.recommendations.includes("Key-Person")).length
    };
    res.json({ total, averageScore, byRecommendation, passports: profiles });
  } catch (error) { next(error); }
});

module.exports = router;
