const { callGemini } = require('../gemini');

// Helper to clean JSON strings from AI responses
function sanitizeJSON(str) {
  // Remove markdown code blocks if present
  str = str.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  // Remove any text before first { or [
  const firstBrace = str.indexOf('{');
  const firstBracket = str.indexOf('[');
  const start = firstBrace === -1 ? firstBracket : (firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket));
  if (start > 0) str = str.substring(start);
  // Remove any text after last } or ]
  const lastBrace = str.lastIndexOf('}');
  const lastBracket = str.lastIndexOf(']');
  const end = Math.max(lastBrace, lastBracket);
  if (end !== -1) str = str.substring(0, end + 1);
  // Remove control characters that break JSON
  str = str.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Fix common JSON issues
  str = str
    .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
    .replace(/\n/g, '\\n') // Escape newlines in strings
    .replace(/\r/g, '') // Remove carriage returns
    .replace(/\t/g, '\\t') // Escape tabs
    .replace(/"/g, '"') // Fix smart quotes
    .replace(/"/g, '"') // Fix smart quotes
    .replace(/'/g, "'"); // Fix smart single quotes
  
  return str.trim();
}

const SCRIBE_SYSTEM_PROMPT = `You are The Scribe - synthesize debates ONLY using evidence from the original report.

CRITICAL RULES:
1. Cross-check all claims against the original report data
2. Flag any claims not supported by the report as "Unverified"
3. Note missing data that limits analysis confidence
4. Do NOT make recommendations requiring data not in the report
5. Ground every statement in actual report evidence
6. Return ONLY valid JSON

Format:
{
  "verdict": "your judgment with [Source: report data]",
  "what_worked": [
    "Verified positive point [Source: specific report data]"
  ],
  "what_failed": [
    "Verified negative point [Source: specific report data]"
  ],
  "why_it_happened": "analysis based ONLY on provided data",
  "how_to_improve": [
    "Recommendation 1 based on ACTUAL data in report",
    "Recommendation 2 grounded in report evidence"
  ],
  "data_gaps": [
    "Critical missing information that limits analysis"
  ],
  "confidence": "High/Medium/Low - explain based on data availability"
}

Example:
{
  "verdict": "Concerning - Revenue growth outpaced by cost inefficiency [Source: 50% revenue growth vs 40% cost growth with only 10% profit growth]",
  "what_worked": [
    "Revenue increased 50% [Source: Report states $5.2M up from $3.47M]",
    "Profit is positive at 10% growth [Source: Report states $880K up from $800K]"
  ],
  "what_failed": [
    "Costs grew 40% [Source: Report states $3.12M up from $2.23M]",
    "Profit growth (10%) lags revenue growth (50%)"
  ],
  "why_it_happened": "Every $1 of new revenue requires $0.80 in new costs, suggesting scaling inefficiencies",
  "how_to_improve": [
    "Analyze cost breakdown to identify high-growth categories",
    "Target profit margins that scale with revenue"
  ],
  "data_gaps": [
    "Cost breakdown by category not provided",
    "Industry benchmarks not available",
    "Customer acquisition costs not specified"
  ],
  "confidence": "Medium - Analysis limited by minimal cost data provided"
}`;

async function synthesizeDebate(factor, advocateArg, skepticArg, reportText) {
  // Truncate report if too long to avoid token limits
  const maxReportLength = 1000; // Reduced to 1000 characters
  const truncatedReport = reportText.length > maxReportLength 
    ? reportText.substring(0, maxReportLength) + '...[truncated]'
    : reportText;
    
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

REPORT CONTEXT:
${truncatedReport}

Create a balanced synthesis. Return ONLY valid JSON with: factor, verdict, what_worked, what_failed, why_it_happened, how_to_improve, confidence. No other text.`;

  let response;
  try {
    response = await callGemini(prompt, SCRIBE_SYSTEM_PROMPT, 3, null, 'scribe');
    console.log('Scribe synthesis raw response (first 300):', response.substring(0, 300));
    
    // Try to extract and parse JSON directly
    let cleanedJSON = sanitizeJSON(response);
    console.log('Cleaned JSON length:', cleanedJSON.length);
    
    if (!cleanedJSON || cleanedJSON.length < 10) {
      console.error('No valid JSON after sanitization. Original response:', response);
      throw new Error('Failed to synthesize debate - no JSON in response');
    }
    
    // Try to fix unterminated strings by ensuring proper closing
    try {
      const parsed = JSON.parse(cleanedJSON);
      return parsed;
    } catch (parseError) {
      console.error('Initial parse failed, attempting repair...', parseError.message);
      
      // Attempt to fix by ensuring all strings are properly terminated
      // Count opening and closing braces to find where JSON should end
      let braceCount = 0;
      let inString = false;
      let escape = false;
      let validEnd = -1;
      
      for (let i = 0; i < cleanedJSON.length; i++) {
        const char = cleanedJSON[i];
        
        if (escape) {
          escape = false;
          continue;
        }
        
        if (char === '\\') {
          escape = true;
          continue;
        }
        
        if (char === '"' && !escape) {
          inString = !inString;
        }
        
        if (!inString) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
          
          if (braceCount === 0 && validEnd === -1) {
            validEnd = i + 1;
            break;
          }
        }
      }
      
      if (validEnd > 0) {
        cleanedJSON = cleanedJSON.substring(0, validEnd);
        console.log('Repaired JSON by truncating at valid end position');
        const parsed = JSON.parse(cleanedJSON);
        return parsed;
      }
      
      throw parseError;
    }
  } catch (error) {
    console.error('Scribe synthesis error details:', error.message);
    if (response) {
      console.error('Response that failed (first 1000 chars):', response.substring(0, 1000));
      const cleanedJSON = sanitizeJSON(response);
      console.error('Cleaned JSON that failed:', cleanedJSON.substring(0, 1000));
    }
    throw new Error(`Failed to synthesize debate: ${error.message}`);
  }
}

async function generateFinalReport(allSyntheses, reportText) {
  const prompt = `Create a comprehensive final report from these individual factor analyses:

${JSON.stringify(allSyntheses, null, 2)}

ORIGINAL REPORT:
${reportText}

Generate an executive summary and prioritized recommendations across all factors. Return ONLY valid JSON with this structure:
{
  "executive_summary": "2-3 paragraph overview",
  "key_findings": ["finding 1", "finding 2", ...],
  "top_priorities": ["priority 1", "priority 2", "priority 3"],
  "overall_assessment": "Brief verdict"
}
No other text.`;

  let response;
  try {
    response = await callGemini(prompt, SCRIBE_SYSTEM_PROMPT, 3, null, 'scribe');
    console.log('Scribe final report raw response:', response?.substring(0, 300) || 'undefined response');
    
    if (!response) {
      throw new Error('API returned undefined response');
    }
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in final report response:', response);
      throw new Error('Failed to generate final report - no JSON in response');
    }
    
    const cleanedJSON = sanitizeJSON(jsonMatch[0]);
    console.log('Cleaned JSON:', cleanedJSON.substring(0, 200));
    const parsed = JSON.parse(cleanedJSON);
    return parsed;
  } catch (error) {
    console.error('Scribe final report error details:', error.message);
    if (response) {
      console.error('Response that failed:', response.substring(0, 500));
    } else {
      console.error('Response was undefined - API call may have failed');
    }
    throw new Error(`Failed to generate final report: ${error.message}`);
  }
}

module.exports = { synthesizeDebate, generateFinalReport };