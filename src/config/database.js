const mongoose = require("mongoose");

async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri) throw new Error("MONGODB_URI is required. Copy .env.example to .env and configure it.");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  return mongoose.connection;
}

async function checkDatabase() {
  if (mongoose.connection.readyState !== 1) throw new Error("MongoDB is not connected");
  await mongoose.connection.db.admin().ping();
  return true;
}

module.exports = { connectDatabase, checkDatabase };
