import { createClient } from "@supabase/supabase-js";
// import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

require("dotenv").config();
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// const {
//   siteConfig: { customFields },
// } = useDocusaurusContext();

// export const supabase = createClient(
//   customFields.supabaseUrl,
//   customFields.supabaseAnonKey
// );
