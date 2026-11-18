require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const adminRoutes = require("./routes/adminRoutes");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const enquiryRoutes = require("./routes/enquiry.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const uploadRoutes = require("./routes/upload.routes");

const app = express();
app.use(helmet());
const allowedOrigins = new Set(
  (process.env.CLIENT_URL || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim().replace(/\\/$/, ""))
    .filter(Boolean)
);

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Allow server-to-server and health-check requests.
  if (allowedOrigins.has(origin)) return true;

  // Allow this project's Vercel Preview deployments, but not arbitrary domains.
  return /^https:\\/\\/commercial-insurance-brokerage(?:-[a-z0-9-]+)?-shivani-ed7a\\.vercel\\.app$/.test(origin);
};

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  }
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "commercial-insurance-api" }));
app.use("/api/auth", authRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/uploads", uploadRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`API running on ${PORT}`)))
  .catch(err => { console.error("MongoDB connection failed:", err.message); process.exit(1); });
