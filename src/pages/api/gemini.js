export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing Gemini API key in environment variables.' });
  }

  // The Gemini Flash 1.5 model is only available on the v1beta API.
  // Using the latest alias keeps the integration working as Google retires specific revisions.
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  try {
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      return res.status(geminiRes.status).json({ error: `Gemini API Error: ${errorText}` });
    }

    const data = await geminiRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: `Proxy Error: ${err.message}` });
  }
}
