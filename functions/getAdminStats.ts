import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || (user.role !== 'admin' && user.email !== 'pivotngoyb@gmail.com')) {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const adminDb = base44.asServiceRole;

        // Parallelize fetching for speed
        // Note: For very large datasets, a true count() API is better, but this reduces bandwidth vs client-side
        const [
            users, 
            profiles, 
            subscriptions, 
            reports, 
            matches, 
            events,
            auditLogs,
            supportTickets,
            ambassadors,
            founderCodes
        ] = await Promise.all([
            adminDb.entities.User.list(),
            adminDb.entities.UserProfile.list(),
            adminDb.entities.Subscription.filter({ status: 'active' }),
            adminDb.entities.Report.filter({ status: { $in: ['pending', 'under_review'] } }),
            adminDb.entities.Match.filter({ is_match: true }, '-matched_at', 500),
            adminDb.entities.Event.list(),
            adminDb.entities.AdminAuditLog.list('-created_date', 100),
            adminDb.entities.SupportTicket.filter({ status: { $in: ['open', 'in_progress'] } }),
            adminDb.entities.Ambassador.filter({ status: 'active' }),
            adminDb.entities.FounderInviteCode.filter({ is_active: true })
        ]);

        // Calculate stats server-side
        const today = new Date();
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        const newUsersThisWeek = profiles.filter(p => new Date(p.created_date) > lastWeek).length;
        const newUsersThisMonth = profiles.filter(p => new Date(p.created_date) > lastMonth).length;
        const activeUsersCount = profiles.filter(p => p.is_active).length;
        const bannedUsersCount = profiles.filter(p => !p.is_active).length;
        const verifiedUsersCount = profiles.filter(p => p.verification_status?.photo_verified).length;

        // Streak Analytics
        const activeStreaks = profiles.filter(p => p.login_streak > 0);
        const avgStreak = activeStreaks.length > 0 
            ? (activeStreaks.reduce((sum, p) => sum + (p.login_streak || 0), 0) / activeStreaks.length).toFixed(1)
            : 0;
        const streak7Plus = profiles.filter(p => p.login_streak >= 7).length;
        const streak30Plus = profiles.filter(p => p.login_streak >= 30).length;

        const freeUsers = profiles.filter(p => !p.subscription_tier || p.subscription_tier === 'free').length;
        const premiumUsers = profiles.filter(p => p.subscription_tier === 'premium').length;
        const eliteUsers = profiles.filter(p => p.subscription_tier === 'elite').length;
        const vipUsers = profiles.filter(p => p.subscription_tier === 'vip').length;
        const totalPaidUsers = premiumUsers + eliteUsers + vipUsers;

        const totalRevenue = subscriptions.reduce((sum, sub) => sum + (sub.amount_paid || 0), 0);
        const revenueThisMonth = subscriptions.filter(s => new Date(s.start_date) > lastMonth).reduce((sum, sub) => sum + (sub.amount_paid || 0), 0);

        const totalMatches = matches.length;
        const matchesThisMonth = matches.filter(m => new Date(m.matched_at) > lastMonth).length;
        const matchesThisWeek = matches.filter(m => new Date(m.matched_at) > lastWeek).length;
        const usersWithMatches = new Set(matches.flatMap(m => [m.user1_id, m.user2_id])).size;
        
        const openTickets = supportTickets.filter(t => t.status === 'open').length;
        const urgentTickets = supportTickets.filter(t => t.priority === 'urgent').length;

        const stats = {
            totalUsers: users.length,
            totalProfiles: profiles.length,
            activeUsers: activeUsersCount,
            bannedUsers: bannedUsersCount,
            verifiedUsers: verifiedUsersCount,
            
            freeUsers,
            premiumUsers,
            eliteUsers,
            vipUsers,
            totalPaidUsers,
            conversionRate: profiles.length > 0 ? ((totalPaidUsers / profiles.length) * 100).toFixed(1) : 0,
            
            totalRevenue,
            revenueThisMonth,
            activeSubscriptions: subscriptions.length,
            
            totalMatches,
            matchesThisMonth,
            matchesThisWeek,
            matchRate: profiles.length > 0 ? ((usersWithMatches / profiles.length) * 100).toFixed(1) : 0,
            usersWithMatches,
            
            newUsersThisWeek,
            newUsersThisMonth,
            growthRate: profiles.length > 0 ? ((newUsersThisMonth / profiles.length) * 100).toFixed(1) : 0,
            
            totalReports: reports.length, // Pending/Review only
            pendingReports: reports.filter(r => r.status === 'pending').length,
            resolvedReports: 0, // Not fetching resolved to save bandwidth
            
            totalTickets: supportTickets.length,
            openTickets,
            urgentTickets,
            
            totalEvents: events.length,
            upcomingEvents: events.filter(e => new Date(e.start_date) > today).length,
            
            auditLogs: auditLogs.length,
            
            // Retention Stats
            avgStreak,
            streak7Plus,
            streak30Plus,
            
            // Ambassador & Founder Stats
            totalAmbassadors: ambassadors.length,
            totalFounders: profiles.filter(p => p.is_founding_member).length,
            activeFounderCodes: founderCodes.length
        };

        return Response.json(stats);

    } catch (error) {
        console.error('Stats error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});