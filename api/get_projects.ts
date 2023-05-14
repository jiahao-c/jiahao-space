import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '@vercel/postgres';

export default async function (request: VercelRequest, response: VercelResponse) {
  const client = await db.connect();
  if (request.method == "GET") {
    const projects = (await client.sql`SELECT * FROM project;`).rows;
    return response.status(200).json({ projects });
  }
  return response.status(400).json({ error: "Bad request" });

}