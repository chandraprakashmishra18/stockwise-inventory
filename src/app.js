const path = require("path");
const express = require("express");
const helmet = require("helmet");
const mongoose = require("mongoose");
const productRoutes = require("./routes/products");
const { checkDatabase } = require("./config/database");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "32kb" }));
app.use(express.static(path.join(__dirname, "..", "public"), { extensions: ["html"] }));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "stockwise-api" }));
app.get("/api/health/ready", async (_req, res) => {
  try {
    await checkDatabase();
    res.json({ status: "ready", database: "connected" });
  } catch {
    res.status(503).json({ status: "not-ready", database: mongoose.connection.readyState === 1 ? "unavailable" : "disconnected" });
  }
});
app.use("/api/products", productRoutes);
app.use("/api", notFound);
app.use(errorHandler);

module.exports = app;
