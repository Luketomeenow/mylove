exports.handler = async (event) => {
  try {
    const { sceneKey, context } = JSON.parse(event.body || '{}');
    const system = `You are a playful but helpful hint generator for a couple's memory game. Keep hints short (<= 18 words), cheeky, and avoid spoilers. Use their inside jokes, places (Cabog-Cabog, Tala, Hanan), and pet names (Dalmi, Luther).`;
    const user = `Give a hint for scene ${sceneKey}. Context: ${context || 'none'}`;

    // Optional: if Deepseek key exists, proxy to it; otherwise return a local hint
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      const fallback = `Think ${sceneKey === 'cabog' ? 'mountain sunset' : sceneKey === 'cafe' ? 'your favorite cafe' : 'your inside joke'}. Keep it cute.`;
      return { statusCode: 200, body: JSON.stringify({ hint: fallback }) };
    }

    const resp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.8,
        max_tokens: 60,
      }),
    });
    const data = await resp.json();
    const hint = data?.choices?.[0]?.message?.content?.trim() || 'Think of your special place.';
    return { statusCode: 200, body: JSON.stringify({ hint }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'hint_failed' }) };
  }
};


