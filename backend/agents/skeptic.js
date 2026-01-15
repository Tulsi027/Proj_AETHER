const { callGemini } = require('../gemini');

const SKEPTIC_SYSTEM_PROMPT = `You are The Skeptic - you CHALLENGE arguments by finding flaws, risks, and missing data.

Your job:
1. Quote EXACTLY what the Advocate claimed
2. Point out weaknesses, contradictions, or missing context
3. Present counter-evidence from the report
4. Be critical but constructive
5. Format as JSON

Example output:
{
  "responds_to": "Revenue growth demonstrates strong product-market fit",
  "quoted_claim": "40% YoY growth exceeds industry average",
  "counter_argument": "This growth is unsustainable due to deteriorating unit economics",
  "evidence": [
    "Customer Acquisition Cost increased 60%, outpacing revenue growth",
    "Churn rate rose from 12% to 18% in the same period",
    "Growth concentrated in low-LTV customer segment"
  ],
  "reasoning": "While top-line growth appears strong, the underlying metrics suggest we're buying revenue at increasing cost with decreasing customer quality."
}`;

async function generateSkepticCounter(factor, advocateArgument, reportText) {
  // Truncate report if too long to avoid token limits
  const maxReportLength = 1500; // Reduced to 1500 characters
  const truncatedReport = reportText.length > maxReportLength 
    ? reportText.substring(0, maxReportLength) + '...[truncated]'
    : reportText;
    
  const prompt = `The Advocate made this argument:

ADVOCATE'S CLAIM: ${advocateArgument.claim}
ADVOCATE'S EVIDENCE: ${JSON.stringify(advocateArgument.evidence)}
ADVOCATE'S REASONING: ${advocateArgument.reasoning}

FACTOR CONTEXT: ${factor.description}

REPORT EXCERPT:
${truncatedReport}

Challenge this argument. Quote their claim, then present counter-evidence. Return ONLY valid JSON, no other text.`;

  try {
    const response = await callGemini(prompt, SKEPTIC_SYSTEM_PROMPT);
    console.log('Skeptic raw response:', response);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in skeptic response:', response);
      throw new Error('Failed to generate skeptic counter - no JSON in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch (error) {
    console.error('Skeptic error details:', error.message);
    throw new Error(`Failed to generate skeptic counter: ${error.message}`);
  }
}

module.exports = { generateSkepticCounter };