const router = require("express").Router();
const User = require("../models/User");
const Enquiry = require("../models/Enquiry");
const { auth, allow } = require("../middleware/auth");
router.get("/summary", auth, allow("broker", "admin"), async (_req, res, next) => {
  try {
    const [users, enquiries, submitted, reviewing, quoted] = await Promise.all([
      User.countDocuments({ role: "customer" }), Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: "submitted" }), Enquiry.countDocuments({ status: "under_review" }),
      Enquiry.countDocuments({ status: "quote_ready" })
    ]);
    res.json({ users, enquiries, submitted, reviewing, quoted });
  } catch (e) { next(e); }
});
module.exports = router;
