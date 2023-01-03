import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async (request, response) => {
  let { data, error } = await supabase
    .from("project")
    .select("*");
  if (error) {
    console.error("error", error);
    response.status(500).send("something happened");
  }
  else {
    console.info(data)
    response.status(200).send("done");
  }
};