/**
 * SUPABASE CLIENT - Drop-in replacement for Base44 SDK
 * 
 * This file shows how to create a Supabase client that mirrors
 * the Base44 API patterns for easier migration.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =============================================
// AUTH HELPERS (replaces base44.auth)
// =============================================

export const auth = {
  // Get current user
  async me() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    // Also get profile data
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name,
      role: profile?.is_test_user ? 'admin' : 'user', // Adjust as needed
      ...profile
    };
  },

  async isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  async logout(redirectUrl) {
    await supabase.auth.signOut();
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      window.location.reload();
    }
  },

  redirectToLogin(nextUrl) {
    // Implement your login redirect logic
    window.location.href = `/login${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ''}`;
  },

  async updateMe(data) {
    const user = await this.me();
    if (!user) throw new Error('Not authenticated');
    
    const { data: updated, error } = await supabase
      .from('user_profiles')
      .update(data)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    return updated;
  }
};

// =============================================
// ENTITY HELPERS (replaces base44.entities)
// =============================================

const createEntityHelper = (tableName) => ({
  async list(sort = '-created_at', limit = 50) {
    const ascending = !sort.startsWith('-');
    const column = sort.replace('-', '');
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order(column, { ascending })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  async filter(filters, sort = '-created_at', limit = 50) {
    const ascending = !sort.startsWith('-');
    const column = sort.replace('-', '');
    
    let query = supabase.from(tableName).select('*');
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else if (typeof value === 'object' && value !== null) {
        // Handle complex filters like {$gte: 10}
        Object.entries(value).forEach(([op, val]) => {
          if (op === '$gte') query = query.gte(key, val);
          if (op === '$lte') query = query.lte(key, val);
          if (op === '$gt') query = query.gt(key, val);
          if (op === '$lt') query = query.lt(key, val);
          if (op === '$ne') query = query.neq(key, val);
        });
      } else {
        query = query.eq(key, value);
      }
    });
    
    const { data, error } = await query
      .order(column, { ascending })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  async create(data) {
    const { data: created, error } = await supabase
      .from(tableName)
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return created;
  },

  async bulkCreate(items) {
    const { data, error } = await supabase
      .from(tableName)
      .insert(items)
      .select();
    
    if (error) throw error;
    return data;
  },

  async update(id, data) {
    const { data: updated, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return updated;
  },

  async delete(id) {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  async schema() {
    // Return the schema for form generation
    // You'd need to define these manually or fetch from a config
    return {};
  },

  // Real-time subscription
  subscribe(callback) {
    const channel = supabase
      .channel(`${tableName}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          callback({
            type: payload.eventType, // INSERT, UPDATE, DELETE
            id: payload.new?.id || payload.old?.id,
            data: payload.new,
            old_data: payload.old
          });
        }
      )
      .subscribe();
    
    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  }
});

export const entities = {
  UserProfile: createEntityHelper('user_profiles'),
  Like: createEntityHelper('likes'),
  Pass: createEntityHelper('passes'),
  Match: createEntityHelper('matches'),
  Message: createEntityHelper('messages'),
  Notification: createEntityHelper('notifications'),
  Subscription: createEntityHelper('subscriptions'),
  // Add more entities as needed
};

// =============================================
// INTEGRATIONS (replaces base44.integrations)
// =============================================

export const integrations = {
  Core: {
    async InvokeLLM({ prompt, add_context_from_internet, response_json_schema, file_urls }) {
      const { data, error } = await supabase.functions.invoke('openai-chat', {
        body: { 
          prompt, 
          addContext: add_context_from_internet,
          jsonSchema: response_json_schema,
          fileUrls: file_urls
        }
      });
      
      if (error) throw error;
      return data;
    },

    async UploadFile({ file }) {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('photos')
        .upload(fileName, file);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);
      
      return { file_url: publicUrl };
    },

    async SendEmail({ to, subject, body, from_name }) {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { to, subject, body, fromName: from_name }
      });
      
      if (error) throw error;
      return data;
    },

    async GenerateImage({ prompt, existing_image_urls }) {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt, existingImageUrls: existing_image_urls }
      });
      
      if (error) throw error;
      return data;
    }
  }
};

// =============================================
// FUNCTIONS (replaces base44.functions)
// =============================================

export const functions = {
  async invoke(functionName, payload) {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload
    });
    
    if (error) throw error;
    return { data };
  }
};

// =============================================
// ANALYTICS (replaces base44.analytics)
// =============================================

export const analytics = {
  track({ eventName, properties }) {
    // Use your preferred analytics provider
    // Examples: Mixpanel, Amplitude, PostHog, or custom table
    console.log('Track event:', eventName, properties);
    
    // Option 1: Store in Supabase table
    // supabase.from('analytics_events').insert({ event_name: eventName, properties });
    
    // Option 2: Send to external service
    // mixpanel.track(eventName, properties);
  }
};

// =============================================
// USERS (replaces base44.users)
// =============================================

export const users = {
  async inviteUser(email, role) {
    const { data, error } = await supabase.functions.invoke('invite-user', {
      body: { email, role }
    });
    
    if (error) throw error;
    return data;
  }
};

// =============================================
// MAIN EXPORT (mirrors base44 structure)
// =============================================

export const base44 = {
  auth,
  entities,
  integrations,
  functions,
  analytics,
  users
};

export default base44;


// =============================================
// USAGE EXAMPLES
// =============================================

/*

// BEFORE (Base44):
import { base44 } from '@/api/base44Client';
const profiles = await base44.entities.UserProfile.filter({ gender: 'woman' });

// AFTER (Supabase - using this helper):
import { base44 } from '@/lib/supabaseClient';
const profiles = await base44.entities.UserProfile.filter({ gender: 'woman' });

// The API is the same! Just change the import.

*/