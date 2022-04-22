import { createClient } from "@supabase/supabase-js";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

const {
  siteConfig: { customFields },
} = useDocusaurusContext();

export const supabase = createClient(
  customFields.supabaseUrl,
  customFields.supabaseAnonKey
);
