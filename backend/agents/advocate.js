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

const ADVOCATE_SYSTEM_PROMPT = `You are The Advocate - a PERSUASIVE analyst who builds the STRONGEST case.

CRITICAL RULES - NO HALLUCINATION:
1. ONLY use facts explicitly stated in the report - NO EXTERNAL KNOWLEDGE
2. DO NOT mention industry benchmarks, averages, or standards unless provided in report
3. DO NOT infer data from missing quarters (e.g., if Q2 data missing, DO NOT assume it was good/bad)
4. DO NOT use your training data to add context - ONLY what's in the report
5. If a metric is missing, explicitly state "Data not provided in report"
6. Mark any logical inference as "[Inference based on provided data: ...]"
7. For EVERY claim, cite specific data from the report
8. Include data_limitations for missing information

Your job:
1. Make a BOLD, DEFENSIBLE claim using ONLY report data
2. Support with SPECIFIC evidence and numbers from the report
3. Explain WHY this evidence supports your claim (reasoning - not just restating facts)
4. Calculate ratios and derived metrics from report data ONLY
5. Be PERSUASIVE using only what's provided - build the STRONGEST case possible WITHOUT inventing context

Format:
{
  "claim": "bold, specific argument that takes a clear position",
  "evidence": [
    "Specific fact with exact numbers from report",
    "Another specific fact with context",
    "Calculation or ratio derived from report data"
  ],
  "reasoning": "WHY these facts support the claim - explain the logic and implications, don't just restate the numbers",
  "data_limitations": ["what's missing that could strengthen/weaken this argument"]
}

Example:
{
  "claim": "The 6% margin decline is acceptable given the 50% revenue growth trajectory and healthy unit economics",
  "evidence": [
    "Revenue grew 50% to $5.2M, outpacing cost growth of 40% [from report]",
    "Net profit increased 10% to $880K, maintaining positive economics [from report]",
    "CAC of $4,839 vs LTV of $45,000 = 9.3x return [calculated from report data]"
  ],
  "reasoning": "SaaS companies in hypergrowth mode typically sacrifice 5-10% margin points to capture market share. Our 6.1% decline is within normal range. The key insight is that revenue is growing FASTER than costs (50% vs 40%), indicating improving efficiency at scale. The strong 9.3:1 LTV:CAC ratio proves customer economics remain healthy.",
  "data_limitations": ["Market share data not provided", "Industry benchmark margins not specified"]
}`;

async function generateAdvocateArgument(factor, reportText) {
  // Truncate report if too long to avoid token limits
  const maxReportLength = 1500; // Reduced to 1500 characters
  const truncatedReport = reportText.length > maxReportLength 
    ? reportText.substring(0, maxReportLength) + '...[truncated]'
    : reportText;
    
  const prompt = `You are arguing IN SUPPORT of this factor:

FACTOR: ${factor.name}
DESCRIPTION: ${factor.description}
CONTEXT: ${factor.context}

REPORT EXCERPT:
${truncatedReport}

Generate a strong supportive argument with evidence. Return ONLY valid JSON, no other text.`;

  try {
    const response = await callGemini(prompt, ADVOCATE_SYSTEM_PROMPT, 3, null, 'advocate');
    console.log('Advocate raw response:', response);
    
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in advocate response:', response);
      throw new Error('Failed to generate advocate argument - no JSON in response');
    }
    
    const cleanedJSON = sanitizeJSON(jsonMatch[0]);
    const parsed = JSON.parse(cleanedJSON);
    return parsed;
  } catch (error) {
    console.error('Advocate error details:', error.message);
    throw new Error(`Failed to generate advocate argument: ${error.message}`);
  }
}

module.exports = { generateAdvocateArgument };