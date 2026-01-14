const { callGemini } = require('../gemini');

const ANALYST_SYSTEM_PROMPT = `You are The Decipherer - an expert analyst who extracts the most important and controversial factors from reports.

Your job:
1. Read the report carefully
2. Identify 3-5 KEY FACTORS that are critical for evaluation
3. Pick factors that are likely to have BOTH pros and cons
4. Return ONLY a JSON array, no other text

Example output:
[
  {
    "id": "factor_1",
    "name": "Revenue Growth",
    "description": "40% YoY revenue increase",
    "context": "Q3 sales exceeded targets but CAC also increased"
  },
  {
    "id": "factor_2", 
    "name": "Customer Retention",
    "description": "Retention rate dropped to 78%",
    "context": "Down from 85% previous quarter despite new features"
  }
]`;

async function extractFactors(reportText) {
  const prompt = `Analyze this report and extract 3-5 key factors for debate:

REPORT:
${reportText}

Return a JSON array of factors with id, name, description, and context.`;

  const response = await callGemini(prompt, ANALYST_SYSTEM_PROMPT);
  
  // Extract JSON from response (Gemini sometimes adds markdown)
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to extract factors');
  }
  
  return JSON.parse(jsonMatch[0]);
}

module.exports = { extractFactors };