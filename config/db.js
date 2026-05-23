const mongoose = require("mongoose");
const dns = require("node:dns");
const dnsPromises = require("node:dns").promises;

mongoose.set("strictQuery", true);

function encodeCredential(value) {
  return encodeURIComponent(decodeURIComponent(value || ""));
}

function buildMongoParams(parsed, txtRecords) {
  const params = new URLSearchParams(parsed.search);

  for (const record of txtRecords) {
    const text = record.join("");
    for (const [key, value] of new URLSearchParams(text)) {
      if (!params.has(key)) {
        params.set(key, value);
      }
    }
  }

  params.set("tls", "true");
  return params;
}

function buildAuth(parsed) {
  const username = encodeCredential(parsed.username);
  const password = encodeCredential(parsed.password);
  return username ? `${username}:${password}@` : "";
}

async function resolveSrvParts(mongoUri) {
  const parsed = new URL(mongoUri);

  if (parsed.protocol !== "mongodb+srv:") {
    return null;
  }

  const srvRecords = await dnsPromises.resolveSrv(
    `_mongodb._tcp.${parsed.hostname}`
  );
  const txtRecords = await dnsPromises
    .resolveTxt(parsed.hostname)
    .catch(() => []);
  const path = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "/";

  return {
    parsed,
    srvRecords,
    params: buildMongoParams(parsed, txtRecords),
    auth: buildAuth(parsed),
    path
  };
}

async function buildDirectUriFromSrv(mongoUri) {
  const parts = await resolveSrvParts(mongoUri);
  if (!parts) {
    return null;
  }

  const hosts = parts.srvRecords
    .map((record) => `${record.name}:${record.port}`)
    .join(",");

  return `mongodb://${parts.auth}${hosts}${parts.path}?${parts.params.toString()}`;
}

async function buildWritablePrimaryUriFromSrv(mongoUri) {
  const parts = await resolveSrvParts(mongoUri);
  if (!parts) {
    return null;
  }

  const params = new URLSearchParams(parts.params);
  params.set("directConnection", "true");
  params.delete("replicaSet");

  if (process.env.MONGODB_PRIMARY_HOST) {
    return `mongodb://${parts.auth}${process.env.MONGODB_PRIMARY_HOST}${parts.path}?${params.toString()}`;
  }

  for (const record of parts.srvRecords) {
    const uri = `mongodb://${parts.auth}${record.name}:${record.port}${parts.path}?${params.toString()}`;
    const client = new mongoose.mongo.MongoClient(uri, {
      serverSelectionTimeoutMS: 5000
    });

    try {
      await client.connect();
      const hello = await client.db("admin").command({ hello: 1 });
      if (hello.isWritablePrimary) {
        return uri;
      }
    } catch {
      // Keep probing the remaining Atlas hosts.
    } finally {
      await client.close().catch(() => {});
    }
  }

  return null;
}

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing. Add it to your .env file.");
  }

  if (process.env.MONGODB_DNS_SERVERS) {
    dns.setServers(
      process.env.MONGODB_DNS_SERVERS.split(",")
        .map((server) => server.trim())
        .filter(Boolean)
    );
  }

  try {
    const options = {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      tls: mongoUri.startsWith("mongodb+srv://")
    };

    let connection;

    try {
      if (
        process.env.MONGODB_FORCE_PRIMARY_DIRECT === "true" &&
        mongoUri.startsWith("mongodb+srv://")
      ) {
        const primaryUri = await buildWritablePrimaryUriFromSrv(mongoUri);
        if (!primaryUri) {
          throw new Error("Could not resolve a writable MongoDB primary.");
        }

        connection = await mongoose.connect(primaryUri, {
          ...options,
          tls: true,
          directConnection: true
        });
      } else {
        connection = await mongoose.connect(mongoUri, options);
      }
    } catch (error) {
      const fallbackUri = await buildDirectUriFromSrv(mongoUri);
      if (!fallbackUri) {
        throw error;
      }

      console.warn(
        "MongoDB SRV connection failed; retrying with resolved seed list."
      );
      try {
        connection = await mongoose.connect(fallbackUri, {
          ...options,
          tls: true
        });
      } catch (seedListError) {
        const primaryUri = await buildWritablePrimaryUriFromSrv(mongoUri);
        if (!primaryUri) {
          throw seedListError;
        }

        console.warn(
          "MongoDB seed-list connection failed; retrying writable primary directly."
        );
        connection = await mongoose.connect(primaryUri, {
          ...options,
          tls: true,
          directConnection: true
        });
      }
    }

    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
}

module.exports = connectDB;
