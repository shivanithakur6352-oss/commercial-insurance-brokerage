const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const safeUser = u => ({ id: u._id, name: u.name, email: u.email, role: u.role, companyName: u.companyName, phone: u.phone });

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, companyName, phone } = req.body;
    if (!name || !email || !password || password.length < 8)
      return res.status(400).json({ message: "Name, valid email and password (at least 8 characters) are required" });
    if (await User.findOne({ email })) return res.status(409).json({ message: "Email is already registered" });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, companyName, phone });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "12h" });
    res.status(201).json({ token, user: safeUser(user) });
  } catch (e) { next(e); }
});
router.post("/login", async (req, res, next) => {
  try {
    const user = await User.findOne({ email: String(req.body.email || "").toLowerCase() });
    if (!user || !(await bcrypt.compare(req.body.password || "", user.passwordHash)))
      return res.status(401).json({ message: "Incorrect email or password" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "12h" });
    res.json({ token, user: safeUser(user) });
  } catch (e) { next(e); }
});
router.get("/me", auth, (req, res) => res.json({ user: safeUser(req.user) }));
module.exports = router;
