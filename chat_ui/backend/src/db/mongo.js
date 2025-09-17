import { MongoClient } from 'mongodb';
import { settings } from '../config.js';

let _client;

export async function getDb() {
  if (!_client) {
    _client = new MongoClient(settings.MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    await _client.connect().catch(() => {}); // allow running even if Mongo is down
  }
  return _client.db(settings.MONGODB_DB);
}

export async function getCollection() {
  const db = await getDb();
  return db.collection(settings.MONGODB_COLLECTION);
}
