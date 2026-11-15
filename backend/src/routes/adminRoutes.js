
const router = require("express").Router();
const User = require("../models/User");
const Enquiry = require("../models/Enquiry");
const { auth, allow } = require("../middleware/auth");

// Admin dashboard statistics
router.get("/overview", auth, allow("admin"), async (_req, res, next) => {
  try {
    const [
      totalUsers,
      customers,
      brokers,
      totalEnquiries,
      submitted,
      reviewing,
      quoted,
      closed,
      totalQuotations
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "broker" }),
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: "submitted" }),
      Enquiry.countDocuments({ status: "under_review" }),
      Enquiry.countDocuments({ status: "quote_ready" }),
      Enquiry.countDocuments({ status: "closed" }),
      Enquiry.countDocuments({
        "quotation.insurer": { $exists: true, $ne: "" }
      })
    ]);

    res.json({
      totalUsers,
      customers,
      brokers,
      totalEnquiries,
      submitted,
      reviewing,
      quoted,
      closed,
      totalQuotations
    });
  } catch (error) {
    next(error);
  }
});

// Get all users or filter by role
router.get("/users", auth, allow("admin"), async (req, res, next) => {
  try {
    const { role } = req.query;
    const allowedRoles = ["customer", "broker", "admin"];

    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid user role" });
    }

    const filter = role ? { role } : {};

    const users = await User.find(filter)
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (error) {
    next(error);
  }
});

// Get all enquiries
router.get("/enquiries", auth, allow("admin"), async (_req, res, next) => {
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
router.get("/quotations", auth, allow("admin"), async (_req, res, next) => {
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

 
// Update a user's role. Admins cannot change their own role.
router.patch("/users/:id/role", auth, allow("admin"), async (req, res, next) => {
  try {
    const { role } = req.body;
    const allowedRoles = ["customer", "broker", "admin"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid user role" });
    }
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot change your own role" });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });

    if (target.role === "admin" && role !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "The last admin account cannot be demoted" });
      }
    }

    target.role = role;
    await target.save();
    res.json({
      message: "User role updated successfully",
      user: {
        _id: target._id,
        name: target.name,
        email: target.email,
        role: target.role,
        companyName: target.companyName,
        phone: target.phone
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
