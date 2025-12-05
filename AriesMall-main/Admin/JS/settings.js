// Admin/JS/settings.js
import { supabase } from '../../JS/supabase-client.js';

// Cache to prevent fetching multiple times
let configCache = null;

export async function getAdminConfig() {
  if (configCache) return configCache;

  const { data, error } = await supabase
    .from('system_config')
    .select('key, value');

  if (error) {
    console.error("Failed to load system config:", error);
    throw new Error("Could not load API keys from database.");
  }

  // Convert array [{key: 'A', value: '1'}] into object { A: '1' }
  const config = data.reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});

  configCache = config;
  return config;
}