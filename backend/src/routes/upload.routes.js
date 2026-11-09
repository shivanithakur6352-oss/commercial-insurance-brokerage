const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { auth } = require("../middleware/auth");
const dir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({
  storage, limits: { fileSize: (Number(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".png", ".jpg", ".jpeg"];
    cb(allowed.includes(path.extname(file.originalname).toLowerCase()) ? null : new Error("Only PDF, PNG and JPG files are allowed"), allowed.includes(path.extname(file.originalname).toLowerCase()));
  }
});
router.post("/", auth, upload.single("document"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Document is required" });
  res.status(201).json({ fileName: req.file.originalname, url: `/uploads/${req.file.filename}` });
});
module.exports = router;
