// server.js
import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();

// 👇 Allow CORS from your Vite frontend
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['POST'],
}));


dotenv.config();

console.log("✅ Loaded GEMINI_API_KEY:", !!process.env.GEMINI_API_KEY ? "YES" : "NO");

const PORT = process.env.PORT || 5001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(express.json());

app.post('/api/gemini', async (req, res) => {
  const { prompt } = req.body;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Missing Gemini API key.' });
  }
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt text.' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: result.error?.message || 'Unknown API error' });
    }

    const suggestion = result.candidates?.[0]?.content?.parts?.[0]?.text || 'No suggestion received.';
    return res.status(200).json({ suggestion });
  } catch (err) {
    console.error('[Gemini Proxy Error]', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🔄 Gemini proxy running at http://localhost:${PORT}`);
});
