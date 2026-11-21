require("dotenv").config();
const app = require("./app");
const { connectDatabase } = require("./config/database");

async function start() {
  try {
    await connectDatabase();
    const port = Number(process.env.PORT) || 5000;
    const server = app.listen(port, () => console.log(`Stockwise is listening on port ${port}`));

    const shutdown = (signal) => {
      console.log(`${signal} received; closing Stockwise`);
      server.close(async () => {
        const mongoose = require("mongoose");
        await mongoose.disconnect();
        process.exit(0);
      });
    };
    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error(`Startup failed: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) start();
module.exports = { start };
