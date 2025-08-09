exports.handler = async (event) => {
  try {
    const { tone, memories } = JSON.parse(event.body || '{}');
    const system = `You are Luke writing to Maxine. Voice: romantic, playful, spicy-cute, wholesome. Keep it 6-8 sentences. Include at least one inside joke and one place (Cabog-Cabog, Tala, Hanan). End with a short promise. Avoid sounding generic.`;
    const user = `Tone: ${tone || 'romantic'}\nMemories: ${Array.isArray(memories) ? memories.join('; ') : (memories || 'none')}`;

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      const fallback = `Maxine, from Cabog-Cabog sunsets to Tala escapes, you make ordinary days cinematic. I love your main character energy, the way Hanan turns my corny jokes into refills, and how “putangina” somehow became poetry. I’ll choose—and you’ll still choose—and I’ll still be smiling. Whatever happens, we’ll face it together. Always yours, Luke.`;
      return { statusCode: 200, body: JSON.stringify({ letter: fallback }) };
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
        temperature: 0.95,
        max_tokens: 320,
      }),
    });
    const data = await resp.json();
    const letter = data?.choices?.[0]?.message?.content?.trim() || 'I love you in every version of us.';
    return { statusCode: 200, body: JSON.stringify({ letter }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'compose_failed' }) };
  }
};


