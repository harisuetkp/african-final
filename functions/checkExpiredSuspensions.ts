import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@^14.14.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }
        // Admin / Service Role Task
        
        const now = new Date();
        const nowISO = now.toISOString();

        // 1. Find Suspended Users whose suspension has expired
        // suspension_expires_at <= now AND is_suspended = true
        // Note: Filter capabilities depend on DB, usually we can filter by date
        // If complex filter not supported, we might need to fetch all suspended users and filter in code
        // Assuming we can filter:
        const suspendedUsers = await base44.asServiceRole.entities.UserProfile.filter({
            is_suspended: true
        });

        let reactivatedCount = 0;

        for (const user of suspendedUsers) {
            if (user.suspension_expires_at && new Date(user.suspension_expires_at) <= now) {
                // Suspension expired! Reactivate.
                console.log(`Reactivating user ${user.id}...`);

                // 1. Reactivate Profile
                await base44.asServiceRole.entities.UserProfile.update(user.id, {
                    is_suspended: false,
                    suspension_expires_at: null,
                    suspension_reason: null,
                    is_active: true
                });

                // 2. Resume Subscription (if paused)
                const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
                    user_profile_id: user.id,
                    status: 'paused'
                });

                if (subscriptions.length > 0) {
                    const sub = subscriptions[0];
                    if (sub.payment_provider === 'stripe' && sub.external_id) {
                        try {
                            // Resume in Stripe (remove pause_collection)
                            await stripe.subscriptions.update(sub.external_id, {
                                pause_collection: '' // Setting to empty string removes the pause
                            });

                            // Update local status
                            await base44.asServiceRole.entities.Subscription.update(sub.id, {
                                status: 'active'
                            });
                            console.log(`Resumed subscription ${sub.id}`);
                        } catch (e) {
                            console.error(`Failed to resume subscription ${sub.id}:`, e);
                        }
                    }
                }

                // 3. Notify User
                await base44.asServiceRole.entities.Notification.create({
                    user_profile_id: user.id,
                    type: 'system',
                    title: 'Account Reactivated',
                    message: 'Your suspension has ended. Welcome back! Please adhere to our community guidelines.'
                });
                
                // Email
                const authUser = await base44.asServiceRole.auth.getUserById(user.user_id);
                if (authUser) {
                     await base44.integrations.Core.SendEmail({
                        to: authUser.email,
                        subject: 'Welcome Back - Account Reactivated',
                        body: `Your suspension has ended and your account is now active. Your subscription billing has been resumed.`
                    });
                }

                reactivatedCount++;
            }
        }

        return Response.json({ success: true, reactivated: reactivatedCount });
    } catch (error) {
        console.error('CheckExpiredSuspensions Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});