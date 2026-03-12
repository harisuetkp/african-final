import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { payout_id, action, transaction_id } = await req.json();

    if (!payout_id) {
      return Response.json({ error: 'payout_id required' }, { status: 400 });
    }

    const payout = (await base44.asServiceRole.entities.AmbassadorPayout.filter({ id: payout_id }))[0];
    if (!payout) {
      return Response.json({ error: 'Payout not found' }, { status: 404 });
    }

    const ambassador = (await base44.asServiceRole.entities.Ambassador.filter({ id: payout.ambassador_id }))[0];
    if (!ambassador) {
      return Response.json({ error: 'Ambassador not found' }, { status: 404 });
    }

    if (action === 'process_stripe') {
      // Use Stripe Connect Transfer (ambassador needs a connected account)
      const stripeAccountId = ambassador.payout_details?.stripe_account_id;
      
      if (!stripeAccountId) {
        return Response.json({ error: 'Ambassador has no Stripe Connect account. Use manual payout instead.' }, { status: 400 });
      }

      try {
        const transfer = await stripe.transfers.create({
          amount: Math.round(payout.total_amount * 100), // Convert to cents
          currency: 'usd',
          destination: stripeAccountId,
          transfer_group: `PAYOUT_${payout.id}`,
          metadata: {
            payout_id: payout.id,
            ambassador_id: ambassador.id,
            ambassador_handle: ambassador.handle
          }
        });

        await base44.asServiceRole.entities.AmbassadorPayout.update(payout_id, {
          status: 'paid',
          paid_at: new Date().toISOString(),
          transaction_id: transfer.id
        });

        // Send confirmation email
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: ambassador.email,
          subject: `Afrinnect Ambassador Payout Sent - $${payout.total_amount.toFixed(2)}`,
          body: `
Hi ${ambassador.display_name},

Great news! Your ambassador payout of $${payout.total_amount.toFixed(2)} has been sent to your Stripe account.

Payout Details:
- Amount: $${payout.total_amount.toFixed(2)} USD
- Commissions included: ${payout.commission_count}
- Transaction ID: ${transfer.id}

The funds should arrive in your bank account within 2-3 business days.

Thank you for being an amazing Afrinnect ambassador! 🎉

- The Afrinnect Team
          `.trim()
        });

        return Response.json({ success: true, transfer_id: transfer.id });
      } catch (stripeError) {
        await base44.asServiceRole.entities.AmbassadorPayout.update(payout_id, {
          status: 'failed',
          failed_reason: stripeError.message
        });
        return Response.json({ error: stripeError.message }, { status: 400 });
      }
    }

    if (action === 'mark_manual_paid') {
      // For manual payouts (bank transfer, mobile money, etc.)
      await base44.asServiceRole.entities.AmbassadorPayout.update(payout_id, {
        status: 'paid',
        paid_at: new Date().toISOString(),
        transaction_id: transaction_id || `MANUAL_${Date.now()}`
      });

      // Send confirmation email
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: ambassador.email,
        subject: `Afrinnect Ambassador Payout Sent - $${payout.total_amount.toFixed(2)}`,
        body: `
Hi ${ambassador.display_name},

Your ambassador payout of $${payout.total_amount.toFixed(2)} has been processed.

Payout Details:
- Amount: $${payout.total_amount.toFixed(2)} USD
- Method: ${payout.payout_method || 'Manual transfer'}
- Commissions included: ${payout.commission_count}
${transaction_id ? `- Transaction ID: ${transaction_id}` : ''}

Thank you for being an amazing Afrinnect ambassador! 🎉

- The Afrinnect Team
        `.trim()
      });

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action. Use process_stripe or mark_manual_paid' }, { status: 400 });

  } catch (error) {
    console.error('Payout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});