const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing. Add it to your .env file.");
  }

  try {
    const options = {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 10)
    };

    const connection = await mongoose.connect(mongoUri, options);
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
}

module.exports = connectDB;
