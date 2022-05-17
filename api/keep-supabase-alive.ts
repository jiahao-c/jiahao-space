import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

export default async (request: VercelRequest, response: VercelResponse) => {
    let { data, error } = await supabase
    .from("project")
    .select("*");
  if (error) console.error("error", error);
  else {
    console.info(data)
  }
};