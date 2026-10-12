import mongoose from "mongoose";
import dns from "dns";

// Ensure Node.js resolves MongoDB SRV records reliably on Windows networks
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore in non-Node or restricted environments
}

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://cardozac35_db_user:PqOiPWmPmMzYr3UZ@cluster0.zsc3tsb.mongodb.net/oil_gas_sales_hub?retryWrites=true&w=majority&appName=Cluster0";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  lastFailure: number;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null, lastFailure: 0 };
if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose | null> {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If recent failure within 15 seconds, return null immediately without delay
  if (Date.now() - cached.lastFailure < 15000) {
    return null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 2000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log("[MongoDB] Connected successfully to MongoDB Atlas.");
        return mongooseInstance;
      })
      .catch((err) => {
        console.warn("[MongoDB] Connection warning (running in hybrid/resilient mode):", err.message);
        cached.lastFailure = Date.now();
        cached.promise = null;
        return null as any;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err: any) {
    cached.lastFailure = Date.now();
    cached.promise = null;
    return null;
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
