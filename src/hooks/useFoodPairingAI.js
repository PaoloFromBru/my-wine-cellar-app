import { useState } from 'react';

export default function useFoodPairingAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  const callGeminiProxy = async (food, wineList) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    const prompt = `Given the food item: "${food}", and the following wines from my cellar:\n\n${wineList}\n\nSuggest 1-3 wines from the list that would pair well with "${food}". Focus only on the provided wine list.`;

    console.log('[ReversePairing] 🧠 Prompt:\n', prompt);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      const data = await res.json();
      const output = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.';
      setResponse(output);
    } catch (err) {
      console.error('[ReversePairing] ❌ Proxy error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { callGeminiProxy, response, loading, error };
}