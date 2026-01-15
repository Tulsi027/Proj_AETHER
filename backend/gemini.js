// Support multiple AI providers
async function callAI(prompt, systemPrompt = '', retries = 3) {
  const provider = process.env.AI_PROVIDER || 'groq'; // Default to Groq
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Calling ${provider.toUpperCase()} API... (Attempt ${attempt}/${retries})`);
      
      let apiUrl, headers, body, apiKey;
      
      // Configure based on provider
      if (provider === 'groq') {
        apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
          throw new Error('GROQ_API_KEY is not set. Get one free at https://console.groq.com/keys');
        }
        apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        headers = {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        };
        body = {
          "model": "llama-3.3-70b-versatile", // Fast and capable free model
          "messages": [
            { "role": "system", "content": systemPrompt },
            { "role": "user", "content": prompt }
          ],
          "max_tokens": 1000,
          "temperature": 0.7
        };
      } else if (provider === 'openrouter') {
        apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
          throw new Error('OPENROUTER_API_KEY is not set');
        }
        apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
        headers = {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Aether Debate App"
        };
        body = {
          "model": "openrouter/auto",
          "messages": [
            { "role": "system", "content": systemPrompt },
            { "role": "user", "content": prompt }
          ],
          "max_tokens": 800
        };
      } else {
        throw new Error(`Unknown AI provider: ${provider}`);
      }
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`${provider.toUpperCase()} HTTP Error:`, response.status, errorText);
        
        // Retry on rate limit errors
        if (response.status === 429 && attempt < retries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        throw new Error(`${provider.toUpperCase()} HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`${provider.toUpperCase()} response received`);
      
      // Check for errors
      if (data.error) {
         throw new Error(`${provider.toUpperCase()} Error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      // Check if response has expected structure
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Unexpected API response structure:', data);
        throw new Error('Invalid API response structure');
      }

      const content = data.choices[0].message.content;
      
      if (!content || content.trim() === '') {
        console.error('Empty content in API response');
        throw new Error('API returned empty content');
      }
      
      console.log('API returned content (first 200 chars):', content.substring(0, 200));
      return content;
    } catch (error) {
      console.error(`AI API Error (Attempt ${attempt}/${retries}):`, error.message);
      
      // If this is the last attempt or not a retryable error, throw
      if (attempt === retries || error.message.includes('API_KEY')) {
        console.error('Full error:', error);
        throw error;
      }
      
      // Wait before retrying
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

module.exports = { callGemini: callAI }; // Keep the same export name so other files don't break