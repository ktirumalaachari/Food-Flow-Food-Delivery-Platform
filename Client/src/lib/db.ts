import { MongoClient, Db, Collection } from "mongodb";
import dns from "node:dns";

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
  }
} catch (e) {
  // Ignore
}

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.DB_NAME || "food-delivery-platform";

function initDns() {
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
    if (dns.setDefaultResultOrder) {
      dns.setDefaultResultOrder("ipv4first");
    }
  } catch (e) {
    // Ignore
  }
}

initDns();

let client: MongoClient | null = null;
let localClientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getClientPromise(): Promise<MongoClient> {
  initDns();
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const c = new MongoClient(uri);
      global._mongoClientPromise = c.connect().catch((err) => {
        global._mongoClientPromise = undefined;
        throw err;
      });
    }
    return global._mongoClientPromise;
  }

  if (!localClientPromise) {
    const c = new MongoClient(uri);
    localClientPromise = c.connect().catch((err) => {
      localClientPromise = null;
      throw err;
    });
  }
  return localClientPromise;
}

export const clientPromise: Promise<MongoClient> = getClientPromise();

export async function getDatabase(): Promise<Db> {
  const connectedClient = await getClientPromise();
  return connectedClient.db(dbName);
}

export const getDb = getDatabase;

export async function getOrdersCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection("orders");
}

export async function getSuccessOrdersCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection("successorders");
}

export async function getCartCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection("cart");
}

export async function getSettingsCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection("platform_settings");
}

export async function getCouponsCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection("coupons");
}

export async function getTransactionsCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection("transactions");
}

export async function getReviewsCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection("reviews");
}

export async function getUsersCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection("user");
}

export async function getRestaurantsCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection("restaurant");
}

export const getRestaurantCollection = getRestaurantsCollection;

export async function getFoodCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection("food");
}

export async function getFavoritesCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection("favorites");
}

export async function getAddressCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection("address");
}

export async function getRiderCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection("rider");
}

export default getDatabase;


