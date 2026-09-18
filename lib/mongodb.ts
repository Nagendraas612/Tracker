import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sih_tracker";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
  failed: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null, failed: false };
}

export async function connectToDatabase(): Promise<typeof mongoose | null> {
  if (cached?.conn) {
    return cached.conn;
  }

  // Fast fail if already attempted and failed recently
  if (cached?.failed && !cached?.promise) {
    return null;
  }

  if (!cached?.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 2500, // Fast 2.5s timeout instead of hanging 30s
    };

    cached!.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        cached!.failed = false;
        return mongooseInstance;
      })
      .catch((err) => {
        console.warn(`[MongoDB Warning]: Local MongoDB connection failed (${err.message}). Using persistent local JSON database.`);
        cached!.promise = null;
        cached!.failed = true;
        return null;
      });
  }

  try {
    const conn = await cached!.promise;
    cached!.conn = conn;
    return conn;
  } catch (e) {
    cached!.promise = null;
    cached!.failed = true;
    return null;
  }
}

export default connectToDatabase;
