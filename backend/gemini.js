// Support multiple AI providers with agent-specific models for genuine debate
async function callAI(prompt, systemPrompt = '', retries = 3, imageData = null, agentRole = 'default') {
  const provider = process.env.AI_PROVIDER || 'groq';
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Calling ${provider.toUpperCase()} API (${agentRole})... (Attempt ${attempt}/${retries})`);
      
      let apiUrl, headers, body, apiKey;
      
      // Configure based on provider
      if (provider === 'groq') {
        apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
          throw new Error('GROQ_API_KEY is not set. Get one free at https://console.groq.com/keys');
        }
        
        // IMPORTANT: Use DIFFERENT models for each agent to create genuine debate
        // Using only verified available models on Groq (minimal set)
        let model;
        switch(agentRole) {
          case 'advocate':
            // Advocate: LLaMA 3.1 8B (lighter model for pro arguments)
            model = "llama-3.1-8b-instant";
            break;
          case 'skeptic':
            // Skeptic: LLaMA 3.3 70B (STRONGER model for powerful counter-arguments)
            model = "llama-3.3-70b-versatile";
            break;
          case 'analyst':
            // Analyst: LLaMA 3.1 8B (fast, focused factor extraction)
            model = "llama-3.1-8b-instant";
            break;
          case 'scribe':
            // Scribe: LLaMA 3.1 8B (SAME as analyst to avoid bias in synthesis)
            model = "llama-3.1-8b-instant";
            break;
          default:
            model = "llama-3.3-70b-versatile";
        }
        
        console.log(`Using ${model} for ${agentRole}`);
        
        if (imageData) {
          console.warn('Vision model not available - using text model with image description prompt');
        }
        
        apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        headers = {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        };
        
        // Build messages with or without image
        const messages = [
          { "role": "system", "content": systemPrompt }
        ];
        
        if (imageData) {
          // Vision models are currently unavailable, use text description instead
          messages.push({
            "role": "user",
            "content": `${prompt}\n\n[Note: An image was uploaded but vision analysis is temporarily unavailable. Please analyze based on the context provided.]`
          });
        } else {
          messages.push({ "role": "user", "content": prompt });
        }
        
        body = {
          "model": model,
          "messages": messages,
          "max_tokens": imageData ? 1500 : 1000,
          "temperature": agentRole === 'skeptic' ? 0.8 : 0.7 // Higher temp for more diverse skeptic
        };
        
        console.log(`Model: ${model}, Temp: ${body.temperature}`);
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
      
      // Check if it's a rate limit error (429)
      if (error.message.includes('429') || error.message.includes('rate_limit_exceeded')) {
        const waitTime = attempt === 1 ? 5000 : attempt * 5000; // 5s, 10s, 15s
        console.log(`⏳ Rate limit hit. Waiting ${waitTime/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // If this is the last attempt or not a retryable error, throw
      if (attempt === retries || error.message.includes('API_KEY')) {
        console.error('Full error:', error);
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

// Use Google Gemini API directly for scribe to avoid Groq rate limits
async function callGoogleGeminiForScribe(prompt, systemPrompt, retries = 3) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Calling Google Gemini API for scribe... (Attempt ${attempt}/${retries})`);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\n${prompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('Gemini API returned empty content');
      }
      
      console.log('Gemini API response received for scribe');
      return content;
    } catch (error) {
      console.error(`Gemini API attempt ${attempt} failed:`, error.message);
      
      if (attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${waitTime/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }
}

// Separate OpenRouter call for scribe to avoid Groq rate limits
async function callOpenRouterForScribe(prompt, systemPrompt, retries = 3) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Calling OpenRouter API for scribe... (Attempt ${attempt}/${retries})`);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5000",
          "X-Title": "AETHER Multi-Agent Analysis"
        },
        body: JSON.stringify({
          model: "google/gemini-flash-1.5:free",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('OpenRouter returned empty content');
      }
      
      console.log('OpenRouter response received for scribe');
      return content;
    } catch (error) {
      console.error(`OpenRouter attempt ${attempt} failed:`, error.message);
      
      if (attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${waitTime/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }
}

module.exports = { callGemini: callAI }; // Keep the same export name so other files don't break