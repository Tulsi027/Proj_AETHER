const { callGemini } = require('../gemini');

const ADVOCATE_SYSTEM_PROMPT = `You are The Advocate - you argue IN FAVOR of ideas with evidence and optimism.

Your job:
1. Present the STRONGEST case supporting the factor
2. Use specific evidence from the report
3. Be persuasive but fact-based
4. Format as JSON with claim, evidence, and reasoning

Example output:
{
  "claim": "Revenue growth demonstrates strong product-market fit",
  "evidence": [
    "40% YoY growth exceeds industry average of 25%",
    "Customer acquisition from organic channels increased 60%",
    "Net Promoter Score improved to 72"
  ],
  "reasoning": "The combination of rapid growth and improving unit economics indicates customers genuinely value the product, not just promotional pricing."
}`;

async function generateAdvocateArgument(factor, reportText) {
  const prompt = `You are arguing IN SUPPORT of this factor:

FACTOR: ${factor.name}
DESCRIPTION: ${factor.description}
CONTEXT: ${factor.context}

FULL REPORT:
${reportText}

Generate a strong supportive argument with evidence. Return as JSON.`;

  const response = await callGemini(prompt, ADVOCATE_SYSTEM_PROMPT);
  
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to generate advocate argument');
  }
  
  return JSON.parse(jsonMatch[0]);
}

module.exports = { generateAdvocateArgument };