import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Simple in-memory cache for rate limiting (per isolate)
const ipRequestCounts = new Map();

// Clear cache every minute
setInterval(() => {
    ipRequestCounts.clear();
}, 60000);

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // 1. Get Client IP and Headers
        const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = req.headers.get('user-agent') || '';
        
        // 2. Check Proxy Headers
        const proxyHeaders = [
            'via',
            'x-forwarded-for',
            'forwarded-for',
            'x-forwarded-host',
            'x-forwarded-proto',
            'x-proxy-id',
            'cf-connecting-ip'
        ];
        
        // Count how many proxy headers are present
        const proxyHeaderCount = proxyHeaders.filter(h => req.headers.has(h)).length;
        
        // 3. Heuristic Analysis
        let score = 0;
        let reasons = [];
        
        // High risk: Too many proxy headers usually means nested proxies
        if (proxyHeaderCount > 2) {
            score += 50;
            reasons.push('multiple_proxy_headers');
        }
        
        // Suspicious User Agent
        if (!userAgent || userAgent.length < 10 || userAgent.includes('curl') || userAgent.includes('bot')) {
            score += 40;
            reasons.push('suspicious_user_agent');
        }
        
        // Velocity Check (Requests per minute from this IP)
        const currentCount = (ipRequestCounts.get(clientIp) || 0) + 1;
        ipRequestCounts.set(clientIp, currentCount);
        
        if (currentCount > 60) { // > 1 req/sec
            score += 60;
            reasons.push('high_velocity');
        }

        // 4. Decision
        const isSuspicious = score >= 50;
        
        if (isSuspicious) {
            // Log if high confidence
            if (score >= 80) {
                 await base44.asServiceRole.entities.AdminAuditLog.create({
                    admin_user_id: 'system_security',
                    admin_email: 'security@afrinnect.com',
                    action_type: 'suspicious_traffic_detected',
                    target_user_id: clientIp,
                    details: {
                        score,
                        reasons,
                        userAgent,
                        headers: proxyHeaderCount
                    }
                });
            }
            
            return Response.json({
                safe: false,
                score,
                reasons,
                block: score >= 80 // Recommendation to block
            });
        }

        return Response.json({
            safe: true,
            score,
            reasons: []
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});