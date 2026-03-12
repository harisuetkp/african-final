/**
 * Entities and Integrations Export
 * 
 * This replaces the Base44 entities.js file.
 * Since the custom SDK uses dynamic proxies, all entities are auto-discovered.
 * Just re-export from the client for direct entity access.
 */
import { base44 } from "./base44Client.js";

// Re-export Query as a convenience (used in some pages)
export const Query = {
    /**
     * Execute a raw query (maps to Supabase RPC or custom logic)
     */
    execute: async (queryText, params = {}) => {
        console.warn("Query.execute called - this should be migrated to direct entity calls");
        return [];
    },
};

// Re-export User auth for direct import compatibility
// Usage: import { User } from '@/api/entities'
export const User = base44.auth;

// Re-export all integrations for direct import compatibility
// Usage: import { InvokeLLM, SendEmail, UploadFile } from '@/api/integrations'
export const { InvokeLLM, SendEmail, UploadFile, GenerateImage, ExtractDataFromUploadedFile } =
    base44.integrations.Core;
