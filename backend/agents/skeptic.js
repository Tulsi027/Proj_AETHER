const { callGemini } = require('../gemini');

// Helper to clean JSON strings
function sanitizeJSON(str) {
  str = str.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  const firstBrace = str.indexOf('{');
  if (firstBrace > 0) str = str.substring(firstBrace);
  const lastBrace = str.lastIndexOf('}');
  if (lastBrace !== -1) str = str.substring(0, lastBrace + 1);
  str = str.replace(/[\x00-\x1F\x7F]/g, '');
  return str.trim();
}

const SKEPTIC_SYSTEM_PROMPT = `You are The Skeptic - a CRITICAL analyst who finds flaws in arguments.

CRITICAL RULES - NO HALLUCINATION:
1. ONLY use facts explicitly stated in the report - NO EXTERNAL KNOWLEDGE
2. DO NOT mention industry benchmarks, averages, or standards unless provided in report
3. DO NOT infer data from missing quarters (e.g., if Q2 data missing, DO NOT assume it was good/bad)
4. DO NOT use your training data to add context - ONLY what's in the report
5. If data is missing to verify a concern, say "Cannot verify - data not provided"
6. Mark any logical inference as "[Inference based on provided data: ...]"
7. For EVERY concern, cite specific data from the report
8. Include data_limitations for missing information

Your job:
1. Quote the Advocate's EXACT claim in the "quoted_claim" field
2. Directly CHALLENGE their reasoning using ONLY report data
3. Use counter-evidence that CONTRADICTS their conclusion
4. Calculate alternative interpretations using ONLY report data
5. Point out logical fallacies or missing considerations
6. Be confrontational but evidence-based - don't just state facts, CHALLENGE their logic using ONLY what's in the report

Format:
{
  "responds_to": "brief summary of advocate's position",
  "quoted_claim": "EXACT quote from advocate's claim field",
  "counter_argument": "Direct challenge explaining WHY their reasoning is wrong",
  "evidence": [
    "Counter-fact with numbers that contradicts their conclusion",
    "Alternative calculation showing opposite trend",
    "Missing data that weakens their argument"
  ],
  "reasoning": "Explain WHY their evidence doesn't support their conclusion, or WHY it leads to the opposite conclusion",
  "data_limitations": ["what critical data is missing that affects this analysis"]
}

Example:
{
  "responds_to": "Margin decline is acceptable given growth trajectory",
  "quoted_claim": "The 6% margin decline is acceptable given the 50% revenue growth trajectory",
  "counter_argument": "This framing ignores that marketing ROI is DECLINING, not temporarily sacrificed for strategic growth",
  "evidence": [
    "Marketing spend grew 65% while revenue grew 50% - efficiency getting WORSE [from report: Marketing $1.2M, 38% of costs]",
    "Profit grew only 10% despite 50% revenue growth - a 5:1 inefficiency ratio [from report: Net Profit $880K]",
    "Each percentage point of revenue growth required 0.8 points of cost growth [calculated from report]"
  ],
  "reasoning": "The Advocate claims this is 'temporary' margin sacrifice, but the data shows DETERIORATING efficiency. If scaling improves efficiency, why is marketing spend growing FASTER than revenue (65% vs 50%)? This isn't strategic investment - it's diminishing returns. At current trajectory, 2 more quarters will push margins below 10%.",
  "data_limitations": ["Marketing ROI by channel not provided", "Customer payback period not specified"]
}`;

async function generateSkepticCounter(factor, advocateArgument, reportText) {
  // Truncate report if too long to avoid token limits
  const maxReportLength = 1500; // Reduced to 1500 characters
  const truncatedReport = reportText.length > maxReportLength 
    ? reportText.substring(0, maxReportLength) + '...[truncated]'
    : reportText;
    
  const prompt = `Challenge this argument:

ADVOCATE'S EXACT CLAIM: "${advocateArgument.claim}"
ADVOCATE'S EVIDENCE: ${JSON.stringify(advocateArgument.evidence)}
ADVOCATE'S REASONING: ${advocateArgument.reasoning}

FACTOR: ${factor.name} - ${factor.description}

FULL REPORT:
${truncatedReport}

CRITICAL: You must quote their EXACT claim in "quoted_claim" field.
Then directly challenge their reasoning using counter-evidence from the report.

Return ONLY the JSON object with this EXACT format:
{
  "responds_to": "advocate's main claim",
  "quoted_claim": "EXACT QUOTE from advocate's claim",
  "counter_argument": "your direct challenge to their specific reasoning",
  "evidence": ["counter point 1 with numbers", "counter point 2 with numbers"],
  "reasoning": "explain WHY their argument is flawed, not just what the numbers are",
  "data_limitations": ["missing data affecting this analysis"]
}

No other text, just the JSON.`;

  let response;
  try {
    response = await callGemini(prompt, SKEPTIC_SYSTEM_PROMPT, 3, null, 'skeptic');
    console.log('Skeptic raw response:', response?.substring(0, 300) || 'undefined response');
    
    if (!response) {
      throw new Error('API returned undefined response');
    }
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in skeptic response:', response);
      throw new Error('Failed to generate skeptic counter - no JSON in response');
    }
    
    const cleanedJSON = sanitizeJSON(jsonMatch[0]);
    const parsed = JSON.parse(cleanedJSON);
    return parsed;
  } catch (error) {
    console.error('Skeptic error details:', error.message);
    if (response) {
      console.error('Response that failed:', response.substring(0, 500));
    } else {
      console.error('Response was undefined - API call may have failed');
    }
    throw new Error(`Failed to generate skeptic counter: ${error.message}`);
  }
}

module.exports = { generateSkepticCounter };