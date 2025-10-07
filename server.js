// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Use the built-in fetch available in Node 18+ or fall back to node-fetch
const fetchFn =
  typeof fetch === 'function'
    ? fetch
    : (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

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
const GEMINI_API_VERSION = process.env.GEMINI_API_VERSION || 'v1beta';
const GEMINI_BASE_URL = (process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com').replace(/\/$/, '');
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';

const normaliseModel = (model) => {
  if (!model || typeof model !== 'string') {
    return null;
  }

  return model.startsWith('models/') ? model.slice('models/'.length) : model;
};

const buildGeminiUrl = (model, apiKey) =>
  `${GEMINI_BASE_URL}/${GEMINI_API_VERSION}/models/${model}:generateContent?key=${apiKey}`;

app.use(express.json());

app.post('/api/gemini', async (req, res) => {
  const body = req.body || {};
  const { prompt } = body;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Missing Gemini API key.' });
  }
  if (!prompt && !Array.isArray(body.contents)) {
    return res.status(400).json({ error: 'Missing prompt text or contents array.' });
  }

  const requestedModel = normaliseModel(body.model);
  const model = requestedModel || DEFAULT_MODEL;

  const payload = {
    ...body,
    contents:
      Array.isArray(body.contents) && body.contents.length > 0
        ? body.contents
        : [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
    model: `models/${model}`,
  };

  delete payload.prompt;

  const fetchAvailableModels = async () => {
    try {
      const listRes = await fetchFn(`${GEMINI_BASE_URL}/${GEMINI_API_VERSION}/models?key=${GEMINI_API_KEY}`);
      if (!listRes.ok) {
        return null;
      }

      const listJson = await listRes.json();
      return listJson?.models?.map((item) => item?.name).filter(Boolean) || null;
    } catch (error) {
      console.error('[Gemini Proxy] Failed to list models:', error);
      return null;
    }
  };

  try {
    const response = await fetchFn(buildGeminiUrl(model, GEMINI_API_KEY), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        const availableModels = await fetchAvailableModels();
        return res.status(404).json({
          error:
            result.error?.message ||
            `Model "${model}" is not available for API version "${GEMINI_API_VERSION}" at ${GEMINI_BASE_URL}.`,
          availableModels,
        });
      }

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
