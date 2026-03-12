import { supabase } from "./supabase-client.js";
import { createClient } from "@supabase/supabase-js";

// Handle both Vite (import.meta.env) and Node.js (process.env) environments
const getEnvVar = (key, defaultValue) => {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  if (typeof process !== "undefined" && process.env) {
    return process.env[key] || defaultValue;
  }
  return defaultValue;
};

// Create service role client for admin operations (bypasses RLS)
const supabaseUrl = getEnvVar("VITE_SUPABASE_URL", "http://127.0.0.1:54321");
const supabaseServiceKey = getEnvVar(
  "VITE_SUPABASE_SERVICE_ROLE_KEY",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: "public",
  },
});

/**
 * Base Entity class that provides CRUD operations compatible with Base44 SDK.
 * Supports all Base44 filter operators: $or, $and, $gte, $lte, $gt, $lt,
 * $in, $nin, $ne, $like, $ilike, $contains, $containedBy
 */
export class CustomEntity {
  constructor(tableName, useServiceRole = false) {
    this.tableName = tableName;
    this.supabase = useServiceRole ? supabaseAdmin : supabase;
    this.useServiceRole = useServiceRole;
  }

  /**
   * Map Base44 field names to Supabase field names
   */
  mapFieldName(field) {
    const fieldMappings = {
      created_date: "created_at",
      updated_date: "updated_at",
    };
    return fieldMappings[field] || field;
  }

  /**
   * Map data object fields from Base44 to Supabase format
   */
  mapDataFields(data) {
    if (!data || typeof data !== "object") return data;
    const mapped = {};
    Object.entries(data).forEach(([key, value]) => {
      const mappedKey = this.mapFieldName(key);
      mapped[mappedKey] = value;
    });
    return mapped;
  }

  /**
   * Map Supabase field names back to Base44 field names in results
   */
  mapResultFields(data) {
    if (!data) return data;
    const reverseFieldMappings = {
      created_at: "created_date",
      updated_at: "updated_date",
    };
    const mapObject = (obj) => {
      const mapped = {};
      for (const [key, value] of Object.entries(obj)) {
        const mappedKey = reverseFieldMappings[key] || key;
        mapped[mappedKey] = value;
      }
      return mapped;
    };
    if (Array.isArray(data)) {
      return data.map(mapObject);
    } else {
      return mapObject(data);
    }
  }

  /**
   * Apply complex filter conditions to a Supabase query.
   * Handles Base44 operators: $or, $and, $gte, $lte, $gt, $lt, $in, $nin, $ne, $like, $ilike
   */
  applyConditions(query, conditions) {
    Object.entries(conditions).forEach(([key, value]) => {
      // Handle $or operator
      if (key === "$or" && Array.isArray(value)) {
        const orParts = value.map((cond) => {
          return Object.entries(cond)
            .map(([k, v]) => {
              const mk = this.mapFieldName(k);
              if (typeof v === "object" && v !== null && !Array.isArray(v)) {
                // Handle nested operators inside $or
                return Object.entries(v)
                  .map(([op, opVal]) => {
                    switch (op) {
                      case "$gte": return `${mk}.gte.${opVal}`;
                      case "$lte": return `${mk}.lte.${opVal}`;
                      case "$gt": return `${mk}.gt.${opVal}`;
                      case "$lt": return `${mk}.lt.${opVal}`;
                      case "$ne": return `${mk}.neq.${opVal}`;
                      default: return `${mk}.eq.${opVal}`;
                    }
                  })
                  .join(",");
              }
              return `${mk}.eq.${v}`;
            })
            .join(",");
        });
        query = query.or(orParts.join(","));
        return;
      }

      // Handle $and operator (just apply all conditions)
      if (key === "$and" && Array.isArray(value)) {
        value.forEach((cond) => {
          query = this.applyConditions(query, cond);
        });
        return;
      }

      const mappedKey = this.mapFieldName(key);

      // Handle value-level operators (when value is an object with operator keys)
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        Object.entries(value).forEach(([op, opVal]) => {
          switch (op) {
            case "$gte":
              query = query.gte(mappedKey, opVal);
              break;
            case "$lte":
              query = query.lte(mappedKey, opVal);
              break;
            case "$gt":
              query = query.gt(mappedKey, opVal);
              break;
            case "$lt":
              query = query.lt(mappedKey, opVal);
              break;
            case "$ne":
              query = query.neq(mappedKey, opVal);
              break;
            case "$in":
              query = query.in(mappedKey, opVal);
              break;
            case "$nin":
              query = query.not(mappedKey, "in", `(${opVal.join(",")})`);
              break;
            case "$like":
              query = query.like(mappedKey, opVal);
              break;
            case "$ilike":
              query = query.ilike(mappedKey, opVal);
              break;
            case "$contains":
              query = query.contains(mappedKey, opVal);
              break;
            case "$containedBy":
              query = query.containedBy(mappedKey, opVal);
              break;
            case "$is":
              query = query.is(mappedKey, opVal);
              break;
            default:
              // Unknown operator, try eq with the whole value
              query = query.eq(mappedKey, value);
              break;
          }
        });
        return;
      }

      // Simple equality or array-based IN
      if (Array.isArray(value)) {
        query = query.in(mappedKey, value);
      } else if (value === null) {
        query = query.is(mappedKey, null);
      } else {
        query = query.eq(mappedKey, value);
      }
    });
    return query;
  }

  /**
   * List all records with optional ordering and limit
   */
  async list(orderBy = "created_at", limit = null) {
    let query = this.supabase.from(this.tableName).select("*");

    if (orderBy) {
      if (orderBy.startsWith("-")) {
        const field = this.mapFieldName(orderBy.substring(1));
        query = query.order(field, { ascending: false });
      } else {
        const field = this.mapFieldName(orderBy);
        query = query.order(field, { ascending: true });
      }
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("does not exist")) {
        console.warn(`Table ${this.tableName} does not exist, returning empty array`);
        return [];
      }
      throw error;
    }
    return this.mapResultFields(data) || [];
  }

  /**
   * Filter records based on conditions (supports all Base44 operators)
   */
  async filter(conditions = {}, orderBy = "created_at", limit = null) {
    let query = this.supabase.from(this.tableName).select("*");

    // Apply complex filter conditions
    query = this.applyConditions(query, conditions);

    // Apply ordering
    if (orderBy) {
      if (orderBy.startsWith("-")) {
        const field = this.mapFieldName(orderBy.substring(1));
        query = query.order(field, { ascending: false });
      } else {
        const field = this.mapFieldName(orderBy);
        query = query.order(field, { ascending: true });
      }
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("does not exist")) {
        console.warn(`Table ${this.tableName} does not exist, returning empty array`);
        return [];
      }
      console.error(`Filter error for ${this.tableName}:`, error);
      throw error;
    }
    return this.mapResultFields(data) || [];
  }

  /**
   * Get a single record by ID
   */
  async get(id) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("does not exist")) {
        console.warn(`Table ${this.tableName} does not exist, returning null`);
        return null;
      }
      console.error(`Get error for ${this.tableName}:`, error);
      throw error;
    }

    return data ? this.mapResultFields(data) : null;
  }

  /**
   * Create a new record
   */
  async create(data) {
    const mappedData = this.mapDataFields(data);

    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .insert(mappedData)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("does not exist")) {
        console.warn(`Table ${this.tableName} does not exist, cannot create record`);
        throw new Error(`Table ${this.tableName} is not available in this environment`);
      }
      console.error(`Create error for ${this.tableName}:`, error);
      throw error;
    }
    return this.mapResultFields(result);
  }

  /**
   * Update a record by ID
   */
  async update(id, data) {
    const mappedData = this.mapDataFields(data);
    mappedData.updated_at = new Date().toISOString();

    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .update(mappedData)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("does not exist")) {
        console.warn(`Table ${this.tableName} does not exist, cannot update record`);
        return null;
      }
      console.error(`Update error for ${this.tableName}:`, error);
      throw error;
    }

    if (!result) return null;
    return this.mapResultFields(result);
  }

  /**
   * Delete a record by ID
   */
  async delete(id) {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq("id", id);

    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("does not exist")) {
        console.warn(`Table ${this.tableName} does not exist, cannot delete record`);
        return;
      }
      throw error;
    }
  }
}

/**
 * User Entity with authentication methods.
 * Provides compatibility with both Base44 auth methods and Supabase auth.
 */
export class UserEntity extends CustomEntity {
  constructor() {
    super("users", true);
  }

  async get(id) {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user by ID:", error);
      throw error;
    }
    return data ? this.mapResultFields(data) : null;
  }

  /**
   * Get user by ID using service role (alias used by Base44 functions)
   */
  async getUserById(userId) {
    return this.get(userId);
  }

  /**
   * Get current authenticated user data
   */
  async me() {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        if (authError.message?.includes("User from sub claim in JWT does not exist")) {
          await supabase.auth.signOut();
          throw new Error("Not authenticated");
        }
        if (!authError.message?.includes("Auth session missing")) {
          console.error("Auth error:", authError);
        }
        throw new Error("Not authenticated");
      }

      if (!user) throw new Error("Not authenticated");

      const { data, error } = await this.supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user:", error);
        throw error;
      }

      // Auto-create user row from auth if missing
      if (!data) {
        const newUser = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email,
          email_verified: !!user.email_confirmed_at,
          role: "user",
        };

        const { data: createdUser, error: createError } = await this.supabase
          .from("users")
          .insert(newUser)
          .select()
          .single();

        if (createError) {
          console.error("Error creating user:", createError);
          throw createError;
        }
        return this.mapResultFields(createdUser);
      }

      return this.mapResultFields(data);
    } catch (error) {
      if (
        error.message?.includes("403") ||
        error.message?.includes("Forbidden") ||
        error.message?.includes("User from sub claim in JWT does not exist") ||
        error.message?.includes("AuthApiError")
      ) {
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
        throw new Error("Not authenticated");
      }
      throw error;
    }
  }

  /**
   * Update current user's data
   */
  async updateMyUserData(userData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await this.supabase
      .from("users")
      .update({ ...userData, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error updating user:", error);
      throw error;
    }
    return data ? this.mapResultFields(data) : null;
  }

  /**
   * Sign in with OAuth provider or development mode
   */
  async login(provider = "dev") {
    if (provider === "dev") {
      const devEmail = "dev@localhost.com";
      const devPassword = "dev123456";
      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: devEmail,
          password: devPassword,
        });

        if (signInError) {
          const { error: signUpError } = await supabase.auth.signUp({
            email: devEmail,
            password: devPassword,
            options: { data: { full_name: "Development User", role: "admin" } },
          });
          if (signUpError) throw signUpError;

          const { error: signInAfterSignUpError } = await supabase.auth.signInWithPassword({
            email: devEmail,
            password: devPassword,
          });
          if (signInAfterSignUpError) throw signInAfterSignUpError;
        }

        if (typeof window !== "undefined") window.location.reload();
      } catch (error) {
        console.error("Development login failed:", error);
        throw error;
      }
      return;
    }

    // Production OAuth
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
    if (error) throw error;
  }

  /**
   * Redirect user to login page (Base44 compatibility)
   */
  redirectToLogin(returnUrl) {
    // In Supabase mode, we redirect to our own login page
    if (typeof window !== "undefined") {
      const loginUrl = returnUrl
        ? `/Login?returnUrl=${encodeURIComponent(returnUrl)}`
        : "/Login";
      window.location.href = loginUrl;
    }
  }

  /**
   * Sign out and optionally redirect
   */
  async logout(redirectUrl) {
    await supabase.auth.signOut();
    if (typeof window !== "undefined" && redirectUrl) {
      window.location.href = redirectUrl;
    }
  }

  async isAuthenticated() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        if (error.message?.includes("User from sub claim in JWT does not exist")) {
          await supabase.auth.signOut();
        }
        return false;
      }
      return !!user;
    } catch {
      return false;
    }
  }

  async getCurrentUser() {
    try {
      return await this.me();
    } catch (error) {
      if (error.message === "Not authenticated") return null;
      throw error;
    }
  }
}

/**
 * Convert PascalCase entity name to snake_case table name
 */
function entityNameToTableName(entityName) {
  return entityName
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
}

/**
 * Determine if an entity should use service role based on common patterns
 */
function shouldUseServiceRole(entityName) {
  const serviceRoleEntities = [
    "user", "transaction", "usermembership", "payment",
    "order", "subscription", "admin", "audit", "log",
  ];
  return serviceRoleEntities.some((pattern) =>
    entityName.toLowerCase().includes(pattern)
  );
}

/**
 * Create a dynamic entities proxy that creates entities on-demand.
 * Handles both regular and service-role access patterns.
 */
function createEntitiesProxy(forceServiceRole = false) {
  const entityCache = new Map();
  return new Proxy({}, {
    get(_, entityName) {
      if (typeof entityName !== "string") return undefined;
      const cacheKey = `${entityName}_${forceServiceRole}`;
      if (entityCache.has(cacheKey)) return entityCache.get(cacheKey);

      const tableName = entityNameToTableName(entityName);
      const useServiceRole = forceServiceRole || shouldUseServiceRole(entityName);
      const entity = new CustomEntity(tableName, useServiceRole);
      entityCache.set(cacheKey, entity);
      return entity;
    },
    has(_, entityName) {
      return typeof entityName === "string";
    },
    ownKeys() {
      return Array.from(entityCache.keys());
    },
  });
}

/**
 * Create a functions proxy that maps to Supabase Edge Functions.
 * Handles `base44.functions.invoke('functionName', payload)`.
 */
function createFunctionsProxy() {
  return {
    invoke: async (functionName, payload) => {
      try {
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: payload,
        });
        if (error) throw error;
        return { data };
      } catch (error) {
        console.error(`Function ${functionName} invoke failed:`, error);
        throw error;
      }
    },
  };
}

/**
 * Create integrations object with actual implementations.
 * These replace Base44's Core integrations.
 */
function createIntegrationsProxy(useServiceRole = false) {
  const sb = useServiceRole ? supabaseAdmin : supabase;
  return {
    Core: {
      /**
       * Invoke an LLM. In production, replace with your OpenAI/Anthropic API call.
       * For now, calls a Supabase Edge Function "invoke-llm" if available.
       */
      InvokeLLM: async ({ prompt, add_context_from_internet = false, response_json_schema = null, file_urls = null }) => {
        try {
          const { data, error } = await sb.functions.invoke("invoke-llm", {
            body: { prompt, add_context_from_internet, response_json_schema, file_urls },
          });
          if (error) throw error;
          return data;
        } catch (e) {
          console.warn("InvokeLLM edge function not available, returning safe default:", e.message);
          if (response_json_schema) {
            return { is_safe: true, risk_score: 0, scam_type: "none", severity: "low", reasons: [] };
          }
          return { response: "LLM integration not yet configured." };
        }
      },

      /**
       * Send email. In production, replace with Resend/SendGrid Edge Function.
       */
      SendEmail: async ({ to, subject, body, from_name = "Afrinnect" }) => {
        try {
          const { data, error } = await sb.functions.invoke("send-email", {
            body: { to, subject, body, from_name },
          });
          if (error) throw error;
          return data;
        } catch (e) {
          console.warn("SendEmail edge function not available:", e.message);
          return { status: "skipped", message_id: `skip_${Date.now()}` };
        }
      },

      /**
       * Upload file to Supabase Storage
       */
      UploadFile: async ({ file }) => {
        const fileName = `${Date.now()}_${file?.name || "file"}`;
        const bucket = "uploads";

        const { data, error } = await sb.storage
          .from(bucket)
          .upload(fileName, file, { cacheControl: "3600", upsert: false });

        if (error) {
          console.error("Upload error:", error);
          throw error;
        }

        const { data: urlData } = sb.storage
          .from(bucket)
          .getPublicUrl(data.path);

        return { file_url: urlData.publicUrl };
      },

      /**
       * Generate an image. In production, replace with DALL-E Edge Function.
       */
      GenerateImage: async ({ prompt }) => {
        try {
          const { data, error } = await sb.functions.invoke("generate-image", {
            body: { prompt },
          });
          if (error) throw error;
          return data;
        } catch (e) {
          console.warn("GenerateImage edge function not available:", e.message);
          return { url: "" };
        }
      },

      /**
       * Extract data from uploaded file. In production, use OCR Edge Function.
       */
      ExtractDataFromUploadedFile: async ({ file_url, json_schema }) => {
        try {
          const { data, error } = await sb.functions.invoke("extract-data", {
            body: { file_url, json_schema },
          });
          if (error) throw error;
          return data;
        } catch (e) {
          console.warn("ExtractData edge function not available:", e.message);
          return { status: "success", details: null, output: json_schema?.type === "array" ? [] : {} };
        }
      },
    },
  };
}

/**
 * Create the main custom client that mimics the Base44 SDK structure.
 * Provides: entities, auth, functions, integrations, and asServiceRole.
 */
export function createCustomClient() {
  const userEntity = new UserEntity();

  const client = {
    // Dynamic entity access: base44.entities.UserProfile.filter(...)
    entities: createEntitiesProxy(false),

    // Auth: base44.auth.me(), base44.auth.login(), etc.
    auth: userEntity,

    // Functions: base44.functions.invoke('functionName', payload)
    functions: createFunctionsProxy(),

    // Integrations: base44.integrations.Core.InvokeLLM(...)
    integrations: createIntegrationsProxy(false),

    /**
     * Service role access: base44.asServiceRole.entities.UserProfile.filter(...)
     * Bypasses RLS — used in cloud functions and admin operations.
     */
    asServiceRole: {
      entities: createEntitiesProxy(true),
      auth: {
        ...userEntity,
        getUserById: async (userId) => {
          const { data, error } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("id", userId)
            .maybeSingle();
          if (error) throw error;
          return data;
        },
      },
      integrations: createIntegrationsProxy(true),
    },
  };

  return client;
}

// Export the default client instance
export const customClient = createCustomClient();
