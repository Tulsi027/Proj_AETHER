const { callGemini } = require('../gemini');

// Helper to clean JSON strings from AI responses
function sanitizeJSON(str) {
  str = str.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  const firstBrace = str.indexOf('{');
  const firstBracket = str.indexOf('[');
  const start = firstBrace === -1 ? firstBracket : (firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket));
  if (start > 0) str = str.substring(start);
  const lastBrace = str.lastIndexOf('}');
  const lastBracket = str.lastIndexOf(']');
  const end = Math.max(lastBrace, lastBracket);
  if (end !== -1) str = str.substring(0, end + 1);
  str = str.replace(/[\x00-\x1F\x7F]/g, '');
  return str.trim();
}

const ANALYST_SYSTEM_PROMPT = `You are The Decipherer - an expert analyst who extracts the most important and controversial factors from reports.

Your job:
1. Read the report carefully
2. Identify 3-5 KEY FACTORS that are critical for evaluation
3. Pick factors that are likely to have BOTH pros and cons
4. Return ONLY a JSON array, no other text

CRITICAL RULES:
- Extract ONLY factors that are EXPLICITLY mentioned in the report
- DO NOT invent or assume information not in the report
- Use EXACT numbers, percentages, and quotes from the report
- If the report lacks specific data, say "details not provided" in context
- NO HALLUCINATION - cite what's actually written

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

async function extractFactors(reportData) {
  // Handle both text and image inputs
  const isImage = reportData.type === 'image';
  const reportText = isImage ? reportData.text : reportData.text;
  const imageData = isImage ? { mimetype: reportData.mimetype, data: reportData.data } : null;
  
  const prompt = isImage 
    ? `You are analyzing a CHART/GRAPH/DIAGRAM image.

CRITICAL RULES:
1. Extract ONLY 2-3 factors based on what's VISIBLE in the chart
2. Focus on the DATA LABELS and VALUES you can see
3. DO NOT invent categories or metrics not shown in the image
4. Identify patterns: trends (up/down), comparisons (highest/lowest), anomalies (sudden changes)

COMMON CHART TYPES & WHAT TO EXTRACT:

📊 Bar/Column Chart → Extract: highest/lowest bars, growth patterns, declines
📈 Line Chart → Extract: upward/downward trends, peaks, valleys, inflection points
🥧 Pie Chart → Extract: largest/smallest segments, dominant categories, small contributors
📉 Area Chart → Extract: volume changes, trend shifts, period comparisons

EXAMPLES:

For Sales Chart (Q1:$80K, Q2:$100K, Q3:$110K, Q4:$60K):
✅ "Q4 Revenue Decline" - visible 45% drop
✅ "Q1-Q3 Growth Trend" - visible 37.5% increase

For Market Share Pie Chart (A:45%, B:30%, C:15%, D:10%):
✅ "Segment A Dominance" - holds 45% market share
✅ "Segments C&D Underperformance" - combined only 25%

For Monthly Users Line Chart (Jan-Dec with peak in Aug):
✅ "August User Spike" - peak of 50K users
✅ "Post-Summer Decline" - dropped 30% Sep-Dec

YOUR TASK:
Analyze THIS image and extract 2-3 factors that match what you ACTUALLY SEE.
Return ONLY valid JSON array:

[
  {
    "id": "factor_1",
    "name": "Brief descriptive name of what you see",
    "description": "What the data shows with actual values/labels from chart",
    "context": "Why this matters or what pattern it represents"
  }
]

No other text.`
    : `Analyze this report and extract 3-5 key factors for debate:

REPORT:
${reportText}

Return ONLY a valid JSON array of factors with id, name, description, and context. No other text.`;

  try {
    const response = await callGemini(prompt, ANALYST_SYSTEM_PROMPT, 3, imageData, 'analyst');
    console.log('Analyst raw response:', response);
    
    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in analyst response:', response);
      throw new Error('Failed to extract factors - no JSON array in response');
    }
    
    const cleanedJSON = sanitizeJSON(jsonMatch[0]);
    let parsed = JSON.parse(cleanedJSON);
    
    // Limit to 3 factors for images to avoid unnecessary analysis
    if (isImage && parsed.length > 3) {
      console.log(`Limiting factors from ${parsed.length} to 3 for image analysis`);
      parsed = parsed.slice(0, 3);
    }
    
    return parsed;
  } catch (error) {
    console.error('Analyst error details:', error.message);
    throw new Error(`Failed to extract factors: ${error.message}`);
  }
}

module.exports = { extractFactors };