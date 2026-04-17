import { Pool, type QueryResultRow } from "pg";
import { getEnv } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var __careerCoachPool: Pool | undefined;
}

function getPool() {
  if (!global.__careerCoachPool) {
    global.__careerCoachPool = new Pool({
      connectionString: getEnv("DATABASE_URL")
    });
  }

  return global.__careerCoachPool;
}

export async function query<T extends QueryResultRow>(text: string, params?: unknown[]) {
  return getPool().query<T>(text, params);
}

export async function withTransaction<T>(fn: (queryFn: typeof query) => Promise<T>) {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const txQuery: typeof query = (text, params) => client.query(text, params);
    const result = await fn(txQuery);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
