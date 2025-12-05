// JS/supabase-client.js

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

let supabaseInstance = null;

try {
  // Your original, robust check for valid credentials
  if (
    !SUPABASE_URL ||
    SUPABASE_URL.includes("YOUR_SUPABASE_URL") || // More robust check
    !SUPABASE_ANON_KEY ||
    SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY") // More robust check
  ) {
    throw new Error(
      "Supabase URL or Key is not configured. Please check your JS/config.js file."
    );
  }

  // If the check passes, create the client
  supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log("Supabase client initialized successfully.");

} catch (error) {
  // If the check fails, log the critical error but don't crash the site
  console.error("CRITICAL: Supabase initialization failed:", error.message);
  // The instance will remain null
}

// Export the instance. It will be a valid client on success, or null on failure.
export const supabase = supabaseInstance;
