import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 50,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  retryWrites: true,
  retryReads: true,
  writeConcern: { w: 'majority' as const, j: true },
  readConcern: { level: 'majority' as const },
  compressors: ['zlib'] as ('zlib' | 'none' | 'snappy' | 'zstd')[],
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

let globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
  _mongoClient?: MongoClient;
};

if (!globalWithMongo._mongoClientPromise) {
  client = new MongoClient(uri, options);
  globalWithMongo._mongoClient = client;
  globalWithMongo._mongoClientPromise = client.connect();
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = globalWithMongo._mongoClient!;
  clientPromise = globalWithMongo._mongoClientPromise;
}

clientPromise
  .then(() => {
    // MongoDB connected
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    globalWithMongo._mongoClientPromise = undefined;
  });

export async function getMongoClient(): Promise<MongoClient> {
  try {
    return await clientPromise;
  } catch (error) {
    console.error("Failed to get MongoDB client:", error);
    globalWithMongo._mongoClientPromise = undefined;
    const newClient = new MongoClient(uri, options);
    globalWithMongo._mongoClient = newClient;
    globalWithMongo._mongoClientPromise = newClient.connect();
    return await globalWithMongo._mongoClientPromise;
  }
}

export async function connectToDatabase() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('Missing MONGODB_URI environment variable');
    }
    
    const client = await clientPromise;
    // Use 'gravitas' as the default database name (same as Gravitas for SSO)
    const dbName = process.env.MONGODB_DB || 'gravitas';
    const db = client.db(dbName);
    return { db, client };
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export default clientPromise;