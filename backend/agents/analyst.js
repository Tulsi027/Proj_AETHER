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

Return ONLY a valid JSON array of factors with id, name, description, and context. No other text.`;

  try {
    const response = await callGemini(prompt, ANALYST_SYSTEM_PROMPT);
    console.log('Analyst raw response:', response);
    
    // Extract JSON from response (Gemini sometimes adds markdown)
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in analyst response:', response);
      throw new Error('Failed to extract factors - no JSON array in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch (error) {
    console.error('Analyst error details:', error.message);
    throw new Error(`Failed to extract factors: ${error.message}`);
  }
}

module.exports = { extractFactors };