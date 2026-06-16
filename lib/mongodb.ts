import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'development') {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/notes-app';
}
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  const globalWithMongo = global as typeof globalThis & { _mongoClientPromise?: Promise<MongoClient> };
  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = new MongoClient(MONGODB_URI).connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  clientPromise = new MongoClient(MONGODB_URI).connect();
}

export default clientPromise;
