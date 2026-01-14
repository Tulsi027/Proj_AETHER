const { callGemini } = require('../gemini');

const SCRIBE_SYSTEM_PROMPT = `You are The Scribe - an impartial judge who synthesizes debate into actionable insights.

Your job:
1. Evaluate both the Advocate's and Skeptic's arguments
2. Determine what's true based on evidence quality
3. Create a balanced final report with:
   - What worked (validated positive points)
   - What failed (validated concerns)
   - Why it happened (root cause analysis)
   - How to improve (3-5 specific actionable recommendations)
4. Format as JSON

Example output:
{
  "factor": "Revenue Growth",
  "verdict": "Mixed - growth is real but unsustainable",
  "what_worked": [
    "Product-market fit validated through 40% revenue growth",
    "Organic acquisition channels performing well"
  ],
  "what_failed": [
    "Unit economics deteriorated with 60% CAC increase",
    "Customer quality declined as shown by rising churn"
  ],
  "why_it_happened": "Aggressive growth prioritization without regard for profitability metrics. Marketing focused on volume over customer lifetime value.",
  "how_to_improve": [
    "Implement LTV-based customer segmentation in marketing",
    "Optimize conversion funnel (current 2.3% → target 4%)",
    "Launch retention program targeting at-risk customers",
    "Adjust pricing to filter low-quality leads",
    "Establish CAC:LTV ratio targets by channel"
  ],
  "confidence": "High - both arguments backed by data"
}`;

async function synthesizeDebate(factor, advocateArg, skepticArg, reportText) {
  const prompt = `Synthesize this debate into actionable insights:

FACTOR: ${factor.name} - ${factor.description}

ADVOCATE POSITION:
- Claim: ${advocateArg.claim}
- Evidence: ${JSON.stringify(advocateArg.evidence)}
- Reasoning: ${advocateArg.reasoning}

SKEPTIC POSITION:
- Counter: ${skepticArg.counter_argument}
- Evidence: ${JSON.stringify(skepticArg.evidence)}
- Reasoning: ${skepticArg.reasoning}

FULL REPORT CONTEXT:
${reportText}

Create a balanced synthesis. Return as JSON with: factor, verdict, what_worked, what_failed, why_it_happened, how_to_improve, confidence.`;

  const response = await callGemini(prompt, SCRIBE_SYSTEM_PROMPT);
  
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to synthesize debate');
  }
  
  return JSON.parse(jsonMatch[0]);
}

async function generateFinalReport(allSyntheses, reportText) {
  const prompt = `Create a comprehensive final report from these individual factor analyses:

${JSON.stringify(allSyntheses, null, 2)}

ORIGINAL REPORT:
${reportText}

Generate an executive summary and prioritized recommendations across all factors. Format as JSON:
{
  "executive_summary": "2-3 paragraph overview",
  "key_findings": ["finding 1", "finding 2", ...],
  "top_priorities": ["priority 1", "priority 2", "priority 3"],
  "overall_assessment": "Brief verdict"
}`;

  const response = await callGemini(prompt, SCRIBE_SYSTEM_PROMPT);
  
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to generate final report');
  }
  
  return JSON.parse(jsonMatch[0]);
}

module.exports = { synthesizeDebate, generateFinalReport };