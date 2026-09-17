import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, InsertUserLocation, userLocations, users } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(postgres(process.env.DATABASE_URL, { max: 3, prepare: false }));
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "passwordHash", "loginMethod", "role"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] as never;
      updateSet[field] = user[field];
    }
  }
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function createEmailUser(input: { email: string; name?: string; passwordHash: string }) {
  await upsertUser({ openId: `email:${input.email}`, email: input.email, name: input.name || null, passwordHash: input.passwordHash, loginMethod: "email", lastSignedIn: new Date() });
  return getUserByOpenId(`email:${input.email}`);
}

export async function upsertUserLocation(location: InsertUserLocation): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.insert(userLocations).values(location).onConflictDoUpdate({
    target: userLocations.userId,
    set: { latitude: location.latitude, longitude: location.longitude, accuracy: location.accuracy ?? null, updatedAt: new Date() },
  });
}

export async function getNearbyUsers(userId: number, latitude: number, longitude: number, radiusKm: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const distance = sql<number>`6371 * 2 * ASIN(SQRT(POWER(SIN(RADIANS(${userLocations.latitude} - ${latitude}) / 2), 2) + COS(RADIANS(${latitude})) * COS(RADIANS(${userLocations.latitude})) * POWER(SIN(RADIANS(${userLocations.longitude} - ${longitude}) / 2), 2)))`;
  return db.select({ id: users.id, name: users.name, email: users.email, latitude: userLocations.latitude, longitude: userLocations.longitude, distance: distance.as("distance"), lastSeen: userLocations.updatedAt })
    .from(userLocations).innerJoin(users, eq(users.id, userLocations.userId))
    .where(sql`${userLocations.userId} <> ${userId} AND ${userLocations.updatedAt} >= NOW() - INTERVAL '15 minutes'`)
    .having(sql`${distance} <= ${radiusKm}`).orderBy(distance).limit(100);
}
