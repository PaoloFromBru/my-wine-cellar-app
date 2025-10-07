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

const normaliseModel = (model) => {
  if (!model || typeof model !== 'string') {
    return null;
  }

  return model.startsWith('models/') ? model.slice('models/'.length) : model;
};

const DEFAULT_MODEL = normaliseModel(process.env.GEMINI_MODEL) || 'gemini-2.5-flash';

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

  const {
    model: _ignoredModel,
    prompt: _ignoredPrompt,
    contents: incomingContents,
    ...restBody
  } = body;

  const payloadContents =
    Array.isArray(incomingContents) && incomingContents.length > 0
      ? incomingContents
      : [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ];

  const buildPayloadForModel = (modelName) => ({
    ...restBody,
    contents: payloadContents,
    model: `models/${modelName}`,
  });

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

  const attemptGeminiCall = async (modelName) => {
    const response = await fetchFn(buildGeminiUrl(modelName, GEMINI_API_KEY), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayloadForModel(modelName)),
    });

    const rawText = await response.text();
    let parsed;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch (error) {
      parsed = null;
    }

    return {
      response,
      parsed,
      rawText,
      modelName,
    };
  };

  try {
    const primaryAttempt = await attemptGeminiCall(model);

    if (primaryAttempt.response.ok) {
      res.set('x-gemini-model-used', primaryAttempt.modelName);
      const suggestion =
        primaryAttempt.parsed?.candidates?.[0]?.content?.parts?.[0]?.text || 'No suggestion received.';
      return res.status(200).json({ suggestion });
    }

    const attemptedModels = [primaryAttempt.modelName];

    if (primaryAttempt.response.status === 404 && primaryAttempt.modelName !== DEFAULT_MODEL) {
      const fallbackAttempt = await attemptGeminiCall(DEFAULT_MODEL);
      attemptedModels.push(DEFAULT_MODEL);

      if (fallbackAttempt.response.ok) {
        res.set('x-gemini-model-used', fallbackAttempt.modelName);
        res.set('x-gemini-model-fallback', primaryAttempt.modelName);
        const suggestion =
          fallbackAttempt.parsed?.candidates?.[0]?.content?.parts?.[0]?.text || 'No suggestion received.';
        return res.status(200).json({ suggestion });
      }

      if (fallbackAttempt.response.status === 404) {
        const availableModels = await fetchAvailableModels();
        const unavailableMessage = `Model(s) ${attemptedModels
          .map((name) => `"${name}"`)
          .join(', ')} are not available for API version "${GEMINI_API_VERSION}" at ${GEMINI_BASE_URL}.`;
        return res.status(404).json({
          error: unavailableMessage,
          availableModels,
          attemptedModels,
          rawError: fallbackAttempt.parsed || fallbackAttempt.rawText || null,
        });
      }

      return res.status(fallbackAttempt.response.status).json({
        error:
          fallbackAttempt.parsed?.error?.message ||
          fallbackAttempt.parsed?.error ||
          fallbackAttempt.rawText ||
          `Gemini API Error (HTTP ${fallbackAttempt.response.status}).`,
        attemptedModels,
      });
    }

    if (primaryAttempt.response.status === 404) {
      const availableModels = await fetchAvailableModels();
      const notFoundMessage = `Model "${primaryAttempt.modelName}" is not available for API version "${GEMINI_API_VERSION}" at ${GEMINI_BASE_URL}.`;
      return res.status(404).json({
        error: notFoundMessage,
        availableModels,
        attemptedModels,
        rawError: primaryAttempt.parsed || primaryAttempt.rawText || null,
      });
    }

    return res.status(primaryAttempt.response.status).json({
      error:
        primaryAttempt.parsed?.error?.message ||
        primaryAttempt.parsed?.error ||
        primaryAttempt.rawText ||
        `Gemini API Error (HTTP ${primaryAttempt.response.status}).`,
      attemptedModels,
    });
  } catch (err) {
    console.error('[Gemini Proxy Error]', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🔄 Gemini proxy running at http://localhost:${PORT}`);
});
