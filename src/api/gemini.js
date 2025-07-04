export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
	  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: result.error?.message || 'Gemini error' });
    }

    const suggestion = result.candidates?.[0]?.content?.parts?.[0]?.text || 'No suggestion received';
    return res.status(200).json({ suggestion });
  } catch (err) {
  		console.error('Gemini proxy error:', err); // Vercel will log this
  		return res.status(500).json({ error: 'Server error: ' + err.message });
    }
}
