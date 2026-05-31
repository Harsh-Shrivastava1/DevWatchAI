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

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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

async function isWritablePrimary(uri) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const client = new mongoose.mongo.MongoClient(uri, {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000
    });

    try {
      await client.connect();
      const hello = await client.db("admin").command({ hello: 1 });
      if (
        process.env.MONGODB_DEBUG_CONNECTION === "true" &&
        !hello.isWritablePrimary
      ) {
        console.warn(`MongoDB host ${new URL(uri).host} is not writable primary.`);
      }
      if (hello.isWritablePrimary) {
        return true;
      }
    } catch (error) {
      if (process.env.MONGODB_DEBUG_CONNECTION === "true") {
        console.warn(
          `MongoDB primary probe failed for ${new URL(uri).host}: ${error.message}`
        );
      }
    } finally {
      await client.close().catch(() => {});
    }

    await wait(300);
  }

  return false;
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
    const configuredUri = `mongodb://${parts.auth}${process.env.MONGODB_PRIMARY_HOST}${parts.path}?${params.toString()}`;
    if (await isWritablePrimary(configuredUri)) {
      return configuredUri;
    }

    console.warn(
      "Configured MongoDB primary host was unavailable; probing current Atlas primary."
    );
  }

  for (const record of parts.srvRecords) {
    const uri = `mongodb://${parts.auth}${record.name}:${record.port}${parts.path}?${params.toString()}`;
    if (await isWritablePrimary(uri)) {
      return uri;
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
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: Number(
        process.env.MONGODB_MAX_POOL_SIZE ||
          (process.env.MONGODB_FORCE_PRIMARY_DIRECT === "true" ? 1 : 10)
      ),
      tls: mongoUri.startsWith("mongodb+srv://")
    };

    let connection;

    if (
      process.env.MONGODB_FORCE_PRIMARY_DIRECT === "true" &&
      mongoUri.startsWith("mongodb+srv://")
    ) {
      let lastPrimaryError;

      for (let attempt = 0; attempt < 4; attempt += 1) {
        const primaryUri = await buildWritablePrimaryUriFromSrv(mongoUri);
        if (!primaryUri) {
          lastPrimaryError = new Error("Could not resolve a writable MongoDB primary.");
          await wait(500);
          continue;
        }

        try {
          connection = await mongoose.connect(primaryUri, {
            ...options,
            tls: true,
            directConnection: true
          });
          break;
        } catch (error) {
          lastPrimaryError = error;
          await mongoose.disconnect().catch(() => {});
          await wait(500);
        }
      }

      if (!connection) {
        throw lastPrimaryError;
      }
    } else {
      try {
        connection = await mongoose.connect(mongoUri, options);
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
    }

    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
}

module.exports = connectDB;
