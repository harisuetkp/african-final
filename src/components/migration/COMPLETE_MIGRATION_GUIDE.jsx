# Afrinnect Migration Guide: Base44 → Supabase + Vercel

## Overview

This guide covers migrating your dating app from Base44 to:
- **Supabase** - Database, Auth, Storage, Realtime
- **Vercel** - Frontend hosting
- **OpenAI** - AI features (replacing InvokeLLM)

**Estimated Time**: 1-2 weeks for a developer
**Estimated Monthly Cost**: $0-50 (free tier to start)

---

## Part 1: Setting Up Supabase

### 1.1 Create Supabase Project
1. Go to https://supabase.com
2. Create new project
3. Save your credentials:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 1.2 Run Database Schema
Copy the SQL from `supabase_complete_schema.sql` (next file) and run in Supabase SQL Editor.

---

## Part 2: Code Changes

### 2.1 Install Dependencies

```bash
npm uninstall @base44/sdk @base44/vite-plugin
npm install @supabase/supabase-js openai
```

### 2.2 Create Supabase Client

Create `src/lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Helper to get current user's profile
export const getCurrentProfile = async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  return data;
};
```

### 2.3 Create OpenAI Client

Create `src/lib/openai.js`:

```javascript
// For frontend, use via Edge Function
// This is for reference - actual calls go through Supabase Edge Functions

export const invokeLLM = async (prompt, jsonSchema = null) => {
  const response = await supabase.functions.invoke('openai-chat', {
    body: { prompt, jsonSchema }
  });
  return response.data;
};
```

### 2.4 API Replacement Map

Replace all `base44` calls with Supabase equivalents:

| Base44 Call | Supabase Equivalent |
|-------------|---------------------|
| `base44.entities.UserProfile.list()` | `supabase.from('user_profiles').select('*')` |
| `base44.entities.UserProfile.filter({gender: 'woman'})` | `supabase.from('user_profiles').select('*').eq('gender', 'woman')` |
| `base44.entities.UserProfile.create(data)` | `supabase.from('user_profiles').insert(data).select().single()` |
| `base44.entities.UserProfile.update(id, data)` | `supabase.from('user_profiles').update(data).eq('id', id)` |
| `base44.entities.UserProfile.delete(id)` | `supabase.from('user_profiles').delete().eq('id', id)` |
| `base44.auth.me()` | `supabase.auth.getUser()` |
| `base44.auth.logout()` | `supabase.auth.signOut()` |
| `base44.auth.isAuthenticated()` | Check `supabase.auth.getSession()` |

### 2.5 Real-time Subscriptions

Replace Base44 subscriptions:

**Before (Base44):**
```javascript
base44.entities.Message.subscribe((event) => {
  if (event.type === 'create') {
    setMessages(prev => [...prev, event.data]);
  }
});
```

**After (Supabase):**
```javascript
supabase
  .channel('messages')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'messages' },
    (payload) => {
      setMessages(prev => [...prev, payload.new]);
    }
  )
  .subscribe();
```

### 2.6 File Upload

**Before (Base44):**
```javascript
const { file_url } = await base44.integrations.Core.UploadFile({ file });
```

**After (Supabase):**
```javascript
const fileName = `${Date.now()}_${file.name}`;
const { data, error } = await supabase.storage
  .from('photos')
  .upload(fileName, file);

const { data: { publicUrl } } = supabase.storage
  .from('photos')
  .getPublicUrl(fileName);
```

### 2.7 Authentication

**Before (Base44):**
```javascript
base44.auth.redirectToLogin();
```

**After (Supabase):**
```javascript
// Email/Password
await supabase.auth.signUp({ email, password });
await supabase.auth.signInWithPassword({ email, password });

// OAuth (Google)
await supabase.auth.signInWithOAuth({ provider: 'google' });
```

---

## Part 3: Edge Functions (Backend)

### 3.1 Create Edge Functions Folder

```
supabase/
  functions/
    openai-chat/
      index.ts
    stripe-webhook/
      index.ts
    send-notification/
      index.ts
```

### 3.2 OpenAI Edge Function

`supabase/functions/openai-chat/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import OpenAI from 'https://esm.sh/openai@4.20.1';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

serve(async (req) => {
  const { prompt, jsonSchema } = await req.json();
  
  const messages = [{ role: 'user', content: prompt }];
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    ...(jsonSchema && {
      response_format: { type: 'json_object' },
    }),
  });
  
  const content = response.choices[0].message.content;
  
  return new Response(
    JSON.stringify(jsonSchema ? JSON.parse(content) : content),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

### 3.3 Stripe Webhook

`supabase/functions/stripe-webhook/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.10.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!;
  const body = await req.text();
  
  const event = await stripe.webhooks.constructEventAsync(
    body,
    signature,
    Deno.env.get('STRIPE_WEBHOOK_SECRET')!
  );
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Update subscription in database
    await supabase
      .from('subscriptions')
      .update({ status: 'active' })
      .eq('external_id', session.subscription);
  }
  
  return new Response(JSON.stringify({ received: true }));
});
```

---

## Part 4: Environment Variables

### 4.1 Vercel Environment Variables

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
VITE_GOOGLE_MAPS_API_KEY=xxx
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_PROJECT_ID=xxx
```

### 4.2 Supabase Edge Function Secrets

```bash
supabase secrets set OPENAI_API_KEY=sk-xxx
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## Part 5: Deployment

### 5.1 Deploy Frontend to Vercel

1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variables
4. Deploy

### 5.2 Deploy Edge Functions

```bash
supabase functions deploy openai-chat
supabase functions deploy stripe-webhook
supabase functions deploy send-notification
```

---

## Part 6: Data Migration

### 6.1 Export Data from Base44

Use Base44 dashboard to export your entities as JSON.

### 6.2 Import to Supabase

```javascript
// Run this script locally
import { createClient } from '@supabase/supabase-js';
import data from './exported_data.json';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Import user profiles
for (const profile of data.user_profiles) {
  await supabase.from('user_profiles').insert({
    ...profile,
    // Map Base44 id to Supabase format
  });
}
```

---

## Part 7: Feature-by-Feature Migration Checklist

### Core Features
- [ ] User authentication (email/password, OAuth)
- [ ] User profile CRUD
- [ ] Photo upload and storage
- [ ] Discovery feed (profile browsing)
- [ ] Like/Pass functionality
- [ ] Match creation on mutual likes
- [ ] Real-time messaging
- [ ] Push notifications

### Premium Features
- [ ] Stripe subscription integration
- [ ] Subscription tier checks
- [ ] Super likes
- [ ] Profile boosts
- [ ] See who liked you

### AI Features
- [ ] Conversation starters
- [ ] Profile optimization tips
- [ ] Scam detection
- [ ] Photo verification

### Admin Features
- [ ] Admin dashboard
- [ ] User moderation
- [ ] Analytics

---

## Quick Reference: Common Patterns

### Filtering with Multiple Conditions

**Base44:**
```javascript
base44.entities.UserProfile.filter({
  gender: 'woman',
  current_country: 'USA',
  is_active: true
}, '-created_date', 20);
```

**Supabase:**
```javascript
supabase
  .from('user_profiles')
  .select('*')
  .eq('gender', 'woman')
  .eq('current_country', 'USA')
  .eq('is_active', true)
  .order('created_at', { ascending: false })
  .limit(20);
```

### Complex Queries (OR conditions)

**Supabase:**
```javascript
supabase
  .from('matches')
  .select('*')
  .or(`user1_id.eq.${profileId},user2_id.eq.${profileId}`)
  .eq('is_match', true);
```

### Joining Tables

**Supabase:**
```javascript
supabase
  .from('messages')
  .select(`
    *,
    sender:user_profiles!sender_id(*),
    match:matches!match_id(*)
  `)
  .eq('match_id', matchId);
```

---

## Estimated Costs After Migration

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Supabase | 500MB DB, 1GB storage | $25/mo Pro |
| Vercel | Unlimited static | $20/mo Pro |
| OpenAI | Pay-as-you-go | ~$20-50/mo |
| Stripe | 2.9% + $0.30/txn | Same |
| Firebase (Push) | Free | Free |
| Google Maps | $200 credit | Usually free |

**Total: $0-100/month** depending on usage

---

## Support Resources

- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- OpenAI Docs: https://platform.openai.com/docs
- Discord Communities for help