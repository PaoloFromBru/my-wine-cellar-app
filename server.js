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

const STABLE_MODEL = 'gemini-2.5-flash';
const ENV_CONFIGURED_MODEL = normaliseModel(process.env.GEMINI_MODEL);
const DEFAULT_MODEL = ENV_CONFIGURED_MODEL || STABLE_MODEL;

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
  const primaryModel = requestedModel || DEFAULT_MODEL;

  const fallbackQueue = [];
  const enqueueFallback = (candidate) => {
    if (!candidate) {
      return;
    }

    if (candidate === primaryModel) {
      return;
    }

    if (fallbackQueue.includes(candidate)) {
      return;
    }

    fallbackQueue.push(candidate);
  };

  enqueueFallback(DEFAULT_MODEL);
  enqueueFallback(STABLE_MODEL);

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
    const attempts = [];
    const modelsToTry = [primaryModel, ...fallbackQueue];
    let successfulAttempt = null;

    for (const modelName of modelsToTry) {
      const attempt = await attemptGeminiCall(modelName);
      attempts.push(attempt);

      if (attempt.response.ok) {
        successfulAttempt = attempt;
        break;
      }

      if (attempt.response.status !== 404) {
        break;
      }
    }

    const attemptedModels = attempts.map((attempt) => attempt.modelName);

    if (successfulAttempt) {
      const modelUsed = successfulAttempt.modelName;
      const firstAttemptModel = attempts[0]?.modelName;

      res.set('x-gemini-model-used', modelUsed);
      if (firstAttemptModel && firstAttemptModel !== modelUsed) {
        res.set('x-gemini-model-fallback', firstAttemptModel);
      }

      const suggestion =
        successfulAttempt.parsed?.candidates?.[0]?.content?.parts?.[0]?.text || 'No suggestion received.';
      return res.status(200).json({ suggestion });
    }

    const lastAttempt = attempts[attempts.length - 1];

    if (!lastAttempt) {
      throw new Error('Gemini proxy failed before attempting any models.');
    }

    if (lastAttempt.response.status === 404) {
      const availableModels = await fetchAvailableModels();
      const unavailableMessage = `Model(s) ${attemptedModels
        .map((name) => `"${name}"`)
        .join(', ')} are not available for API version "${GEMINI_API_VERSION}" at ${GEMINI_BASE_URL}.`;

      return res.status(404).json({
        error: unavailableMessage,
        availableModels,
        attemptedModels,
        recommendedModel: `models/${STABLE_MODEL}`,
        envModel: ENV_CONFIGURED_MODEL ? `models/${ENV_CONFIGURED_MODEL}` : null,
        rawError: lastAttempt.parsed || lastAttempt.rawText || null,
      });
    }

    return res.status(lastAttempt.response.status).json({
      error:
        lastAttempt.parsed?.error?.message ||
        lastAttempt.parsed?.error ||
        lastAttempt.rawText ||
        `Gemini API Error (HTTP ${lastAttempt.response.status}).`,
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
