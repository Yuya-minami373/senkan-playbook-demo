// Seed Turso database by calling initDb()
// Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node --experimental-vm-modules scripts/seed-turso.mjs

import { register } from "node:module";

// Register TypeScript loader (if ts-node or tsx available)
// For simplicity, we'll use the compiled version via next
console.log("Seeding Turso database...");
console.log("URL:", process.env.TURSO_DATABASE_URL);

const { createClient } = await import("@libsql/client");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Test connection
const r = await client.execute("SELECT 1");
console.log("Connection OK");

// We need to call initDb from the compiled app
// The simplest way: hit the app's endpoint with a GET request
// Or: use the fetch API to trigger initialization

// Actually, let's just trigger a build + start and make one request
console.log("\nTo seed the database, start the app with Turso env vars and visit any page:");
console.log("  TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run dev");
console.log("  Then visit http://localhost:3004 — initDb() will auto-seed on first access.");
console.log("\nAlternatively, run: npx tsx scripts/seed-turso-direct.mts");
