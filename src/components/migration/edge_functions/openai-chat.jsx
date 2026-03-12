/**
 * Supabase Edge Function: OpenAI Chat
 * Replaces Base44's InvokeLLM integration
 * 
 * Deploy with: supabase functions deploy openai-chat
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import OpenAI from 'https://esm.sh/openai@4.20.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, jsonSchema, addContext, fileUrls } = await req.json();

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Build messages array
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    // System message
    messages.push({
      role: 'system',
      content: 'You are a helpful assistant for a dating app. Be friendly, supportive, and culturally aware.'
    });

    // Add web context if requested
    if (addContext) {
      // You could integrate with a search API here
      // For now, just note that context was requested
      messages.push({
        role: 'system',
        content: 'Note: The user requested internet context. Provide current, accurate information.'
      });
    }

    // Handle file URLs (for vision)
    if (fileUrls && fileUrls.length > 0) {
      const content: OpenAI.Chat.ChatCompletionContentPart[] = [
        { type: 'text', text: prompt }
      ];
      
      for (const url of fileUrls) {
        content.push({
          type: 'image_url',
          image_url: { url }
        });
      }
      
      messages.push({ role: 'user', content });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    // Determine model and settings
    const useVision = fileUrls && fileUrls.length > 0;
    const model = useVision ? 'gpt-4o' : 'gpt-4o-mini';

    const completionOptions: OpenAI.Chat.ChatCompletionCreateParams = {
      model,
      messages,
      max_tokens: 2000,
    };

    // Add JSON mode if schema provided
    if (jsonSchema) {
      completionOptions.response_format = { type: 'json_object' };
      // Add schema hint to prompt
      messages[messages.length - 1] = {
        role: 'user',
        content: `${prompt}\n\nRespond with a JSON object matching this schema: ${JSON.stringify(jsonSchema)}`
      };
    }

    const completion = await openai.chat.completions.create(completionOptions);
    const content = completion.choices[0].message.content;

    // Parse JSON if schema was provided
    const result = jsonSchema ? JSON.parse(content || '{}') : content;

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('OpenAI error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});