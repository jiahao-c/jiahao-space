import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

interface IProject {
  id: number;
  name: string;
  tags: string[];
  text: string;
  imgSrc: string;
  demoLink?: string;
  repoLink?: string;
}

export default async (request: VercelRequest, response: VercelResponse) => {
  let { data, error } = await supabase
    .from<IProject>("project")
    .select();
  if (error) {
    console.error("error", error);
    response.status(500).send("something happened");
  }
  else {
    console.info(data)
    response.status(200).send("done");
  }
};