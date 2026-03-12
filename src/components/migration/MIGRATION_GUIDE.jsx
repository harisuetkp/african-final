# Afrinnect Migration Guide: Base44 → Supabase

## Overview

This guide walks you through migrating your Afrinnect app from Base44 to Supabase + Vercel.

---

## Step 1: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: For frontend (public)
   - **Service Role Key**: For backend (secret)

---

## Step 2: Run the SQL Schema

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy the entire content of `supabase_schema.sql`
3. Paste and run it
4. All 60+ tables will be created with indexes and RLS policies

---

## Step 3: Set Up Authentication

Supabase Auth replaces Base44 auth. Configure in **Authentication > Providers**:

```javascript
// Before (Base44)
import { base44 } from '@/api/base44Client';
const user = await base44.auth.me();
base44.auth.logout();
base44.auth.redirectToLogin();

// After (Supabase)
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const { data: { user } } = await supabase.auth.getUser();
await supabase.auth.signOut();
await supabase.auth.signInWithOAuth({ provider: 'google' });
```

---

## Step 4: Replace Entity Operations

### Listing Records
```javascript
// Before (Base44)
const profiles = await base44.entities.UserProfile.list();
const filtered = await base44.entities.UserProfile.filter({ gender: 'woman' });

// After (Supabase)
const { data: profiles } = await supabase.from('user_profiles').select('*');
const { data: filtered } = await supabase.from('user_profiles').select('*').eq('gender', 'woman');
```

### Creating Records
```javascript
// Before (Base44)
await base44.entities.UserProfile.create({ display_name: 'John' });

// After (Supabase)
await supabase.from('user_profiles').insert({ display_name: 'John' });
```

### Updating Records
```javascript
// Before (Base44)
await base44.entities.UserProfile.update(id, { bio: 'New bio' });

// After (Supabase)
await supabase.from('user_profiles').update({ bio: 'New bio' }).eq('id', id);
```

### Deleting Records
```javascript
// Before (Base44)
await base44.entities.UserProfile.delete(id);

// After (Supabase)
await supabase.from('user_profiles').delete().eq('id', id);
```

---

## Step 5: Replace Real-time Subscriptions

```javascript
// Before (Base44)
const unsubscribe = base44.entities.Message.subscribe((event) => {
  if (event.type === 'create') {
    setMessages(prev => [...prev, event.data]);
  }
});

// After (Supabase)
const channel = supabase
  .channel('messages')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'messages' },
    (payload) => {
      setMessages(prev => [...prev, payload.new]);
    }
  )
  .subscribe();

// Cleanup
channel.unsubscribe();
```

---

## Step 6: Migrate Backend Functions

Move `/functions/*.js` to **Supabase Edge Functions**.

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize
supabase init

# Create a function
supabase functions new getDiscoveryProfiles
```

### Before (Base44 Function)
```javascript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  const profiles = await base44.entities.UserProfile.filter({});
  return Response.json({ profiles });
});
```

### After (Supabase Edge Function)
```javascript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  // Get user from JWT
  const authHeader = req.headers.get('Authorization')!;
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  
  const { data: profiles } = await supabase.from('user_profiles').select('*');
  return Response.json({ profiles });
});
```

---

## Step 7: Migrate File Storage

```javascript
// Before (Base44)
const { file_url } = await base44.integrations.Core.UploadFile({ file });

// After (Supabase Storage)
const { data, error } = await supabase.storage
  .from('photos')
  .upload(`profiles/${userId}/${file.name}`, file);

const publicUrl = supabase.storage.from('photos').getPublicUrl(data.path);
```

---

## Step 8: Replace AI/LLM Integration

```javascript
// Before (Base44)
const response = await base44.integrations.Core.InvokeLLM({
  prompt: 'Generate a bio',
  response_json_schema: { type: 'object', properties: { bio: { type: 'string' } } }
});

// After (OpenAI directly)
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Generate a bio' }],
  response_format: { type: 'json_object' }
});
```

---

## Step 9: Replace Email

```javascript
// Before (Base44)
await base44.integrations.Core.SendEmail({
  to: 'user@email.com',
  subject: 'Welcome!',
  body: 'Hello...'
});

// After (Resend)
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'Afrinnect <noreply@afrinnect.com>',
  to: 'user@email.com',
  subject: 'Welcome!',
  html: '<p>Hello...</p>'
});
```

---

## Step 10: Deploy Frontend to Vercel

1. Export your React code
2. Create `vercel.json`:
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

3. Deploy:
```bash
npm install -g vercel
vercel
```

---

## Entity Name Mapping

| Base44 Entity | Supabase Table |
|--------------|----------------|
| UserProfile | user_profiles |
| Like | likes |
| Pass | passes |
| Match | matches |
| Message | messages |
| VideoCall | video_calls |
| Subscription | subscriptions |
| Notification | notifications |
| Report | reports |
| Event | events |
| Story | stories |
| VirtualGift | virtual_gifts |
| Ambassador | ambassadors |
| ... | ... |

---

## Environment Variables

Create `.env.local`:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# For Edge Functions
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_...
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
```

---

## Migration Checklist

- [ ] Create Supabase project
- [ ] Run SQL schema
- [ ] Configure authentication providers
- [ ] Migrate user data
- [ ] Update frontend imports
- [ ] Convert entity calls to Supabase queries
- [ ] Migrate backend functions to Edge Functions
- [ ] Set up Storage buckets
- [ ] Configure RLS policies
- [ ] Update Stripe webhooks URL
- [ ] Set up Resend for emails
- [ ] Deploy to Vercel
- [ ] Update DNS/domain
- [ ] Test everything

---

## Estimated Timeline

| Phase | Duration |
|-------|----------|
| Schema setup | 1 day |
| Auth migration | 1-2 days |
| Frontend refactor | 3-5 days |
| Backend functions | 3-5 days |
| Testing | 2-3 days |
| **Total** | **2-3 weeks** |

---

## Support

- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Discord](https://discord.supabase.com)