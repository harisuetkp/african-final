import { createClientFromRequest } from 'npm:@base44/sdk@0.8.3';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // Only admins can analyze errors
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { error } = await req.json();

        if (!error) {
            return Response.json({ error: 'Error data required' }, { status: 400 });
        }

        // Prepare prompt
        const prompt = `
You are an expert Senior Software Engineer and Debugger. Analyze the following application error and provide a technical diagnosis and solution.

ERROR DETAILS:
Message: ${error.message}
Type: ${error.type}
URL: ${error.url}
Browser: ${error.browser}
OS: ${error.os}

STACK TRACE:
${error.stack || 'No stack trace'}

COMPONENT STACK:
${error.component_stack || 'No component stack'}

BREADCRUMBS (User Journey):
${JSON.stringify(error.breadcrumbs || [], null, 2)}

Please provide:
1. A concise technical diagnosis of what likely went wrong.
2. A specific code fix or strategy to resolve it.
3. An assessment of the severity (Low, Medium, High, Critical).
`;

        // Call LLM
        const analysis = await base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    diagnosis: { type: "string" },
                    fix_suggestion: { type: "string" },
                    severity_assessment: { type: "string", enum: ["Low", "Medium", "High", "Critical"] }
                },
                required: ["diagnosis", "fix_suggestion", "severity_assessment"]
            }
        });

        // Save analysis to the error log for persistence
        if (error.id) {
            await base44.entities.ErrorLog.update(error.id, {
                ai_analysis: analysis
            });
        }

        return Response.json(analysis);

    } catch (err) {
        console.error('Analysis failed:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
});