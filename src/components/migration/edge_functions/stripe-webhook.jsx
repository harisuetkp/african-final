/**
 * Supabase Edge Function: Stripe Webhook
 * Handles subscription events from Stripe
 * 
 * Deploy with: supabase functions deploy stripe-webhook
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.10.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
  }

  console.log('Received event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0].price.id;

        // Map price ID to plan type
        const planType = mapPriceToplan(priceId);

        // Find user by Stripe customer ID
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id, user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          // Create subscription record
          await supabase.from('subscriptions').insert({
            user_profile_id: profile.id,
            plan_type: planType,
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: new Date(subscription.current_period_end * 1000).toISOString(),
            payment_provider: 'stripe',
            external_id: subscriptionId,
            amount_paid: session.amount_total! / 100,
            currency: session.currency?.toUpperCase(),
            auto_renew: true,
          });

          // Update user profile
          await supabase
            .from('user_profiles')
            .update({
              is_premium: true,
              subscription_tier: planType.split('_')[0], // premium, elite, vip
              premium_until: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('id', profile.id);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status === 'active' ? 'active' : 'cancelled',
            end_date: new Date(subscription.current_period_end * 1000).toISOString(),
            auto_renew: !subscription.cancel_at_period_end,
          })
          .eq('external_id', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Mark subscription as expired
        const { data: sub } = await supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('external_id', subscription.id)
          .select('user_profile_id')
          .single();

        // Downgrade user
        if (sub) {
          await supabase
            .from('user_profiles')
            .update({
              is_premium: false,
              subscription_tier: 'free',
              premium_until: null,
            })
            .eq('id', sub.user_profile_id);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        await supabase
          .from('subscriptions')
          .update({ status: 'paused' })
          .eq('external_id', invoice.subscription);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }));
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

function mapPriceToplan(priceId: string): string {
  // Map your Stripe price IDs to plan types
  const priceMap: Record<string, string> = {
    'price_premium_monthly': 'premium_monthly',
    'price_premium_quarterly': 'premium_quarterly',
    'price_premium_yearly': 'premium_yearly',
    'price_elite_monthly': 'elite_monthly',
    'price_elite_quarterly': 'elite_quarterly',
    'price_vip_monthly': 'vip_monthly',
    'price_vip_6months': 'vip_6months',
  };
  
  return priceMap[priceId] || 'premium_monthly';
}