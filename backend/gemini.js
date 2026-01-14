// Change to use standard fetch for OpenRouter
async function callAI(prompt, systemPrompt = '') {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000", // Required by OpenRouter for ranking
        "X-Title": "Aether Debate App"
      },
      body: JSON.stringify({
        "model": "openrouter/auto", // One of many free models
        "messages": [
          { "role": "system", "content": systemPrompt },
          { "role": "user", "content": prompt }
        ],
        "max_tokens": 2000
      })
    });

    const data = await response.json();
    
    // Check for errors from OpenRouter (like 429 rate limits)
    if (data.error) {
       throw new Error(`OpenRouter Error: ${data.error.message}`);
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI API Error:', error);
    throw error;
  }
}

module.exports = { callGemini: callAI }; // Keep the same export name so other files don't break