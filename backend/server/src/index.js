import "./config/env.js";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import uploadRoutes from "./routes/uploads.js";
import adminRoutes from "./routes/admin.js";
import userRoutes from "./routes/users.js";
import paymentRoutes from "./routes/payments.js";
import marketerRoutes from "./routes/marketers.js";
import { seedDemoSeller } from "./seed/seedDemoSeller.js";
import { seedDemoCustomer } from "./seed/seedDemoCustomer.js";
import { seedDemoProducts } from "./seed/seedDemoProducts.js";
import { seedDemoAdmin } from "./seed/seedDemoAdmin.js";

const app = express();
const port = Number(process.env.PORT || 5000);
const clientOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:8080")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: clientOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/marketers", marketerRoutes);

const start = async () => {
  const mongoUri = process.env.MONGODB_URI;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set");
  }

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    throw new Error("SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS are required");
  }

  await mongoose.connect(mongoUri);
  await seedDemoAdmin();
  const demoSeller = await seedDemoSeller();
  await seedDemoCustomer();
  await seedDemoProducts(demoSeller);

  app.listen(port, () => {
    console.log(`API listening on ${port}`);
  });
};

start().catch(error => {
  console.error("Failed to start API", error);
  process.exit(1);
});
