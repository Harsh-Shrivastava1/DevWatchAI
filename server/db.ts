import mongoose from "mongoose";

let connection: Promise<typeof mongoose> | null = null;

export function isDatabaseConfigured() {
  return Boolean(process.env.MONGODB_URI);
}

export function connectToDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    return Promise.resolve(null);
  }

  if (!connection) {
    connection = mongoose.connect(uri, {
      dbName: "devwatch-ai"
    });
  }

  return connection;
}
