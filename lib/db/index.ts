import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { Pool } from "@neondatabase/serverless";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";
import { initLocalSchema } from "./pglite-schema";

let dbInstance: any = null;
let pgliteClient: PGlite | null = null;
let schemaInitPromise: Promise<void> | null = null;

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const connectionString = process.env.DATABASE_URL;

  // Use Neon / remote PostgreSQL if DATABASE_URL provided
  if (
    connectionString &&
    (connectionString.includes("neon.tech") || connectionString.startsWith("postgres"))
  ) {
    const pool = new Pool({ connectionString });
    dbInstance = drizzleNeon(pool, { schema });
    return dbInstance;
  }

  // Local Zero-Config Engine: PGlite with on-disk persistence at ./.pglite
  if (!pgliteClient) {
    pgliteClient = new PGlite("./.pglite");
    schemaInitPromise = initLocalSchema(pgliteClient).catch((err) => {
      console.error("[PGlite Schema Init Error]", err);
    });
  }

  dbInstance = drizzlePglite(pgliteClient, { schema });
  return dbInstance;
}

export const db = new Proxy({} as ReturnType<typeof drizzleNeon<typeof schema>>, {
  get(_target, prop) {
    const instance = getDb();
    const val = (instance as unknown as Record<string, unknown>)[prop as string];
    if (typeof val === "function") {
      return (val as (...args: unknown[]) => unknown).bind(instance);
    }
    return val;
  },
});

export * from "./schema";
