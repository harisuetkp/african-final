/**
 * Supabase Client Configuration (replaces Base44 backend)
 * 
 * This file replaces the Base44 API client with a Supabase-powered equivalent.
 * All entity operations, auth, functions, and integrations are handled by the
 * custom SDK that provides 100% API compatibility with the Base44 SDK.
 */
import { customClient } from "../lib/custom-sdk.js";

// Export the custom client as base44 for zero-code-change compatibility
export const base44 = customClient;