const API_VERSION = process.env.GEMINI_API_VERSION || 'v1beta';
const API_BASE_URL = (process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com').replace(/\/$/, '');

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
  `${API_BASE_URL}/${API_VERSION}/models/${model}:generateContent?key=${apiKey}`;

const fetchAvailableModels = async (apiKey) => {
  try {
    const listRes = await fetch(`${API_BASE_URL}/${API_VERSION}/models?key=${apiKey}`);
    if (!listRes.ok) {
      return null;
    }

    const listJson = await listRes.json();
    return listJson?.models?.map((model) => model?.name).filter(Boolean) || null;
  } catch (error) {
    console.error('[Gemini] Failed to retrieve model list:', error);
    return null;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing Gemini API key in environment variables.' });
  }

  const requestBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const requestedModel = normaliseModel(requestBody.model);
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

  const { model: _ignoredModel, ...restRequestBody } = requestBody;
  const buildPayloadForModel = (modelName) => ({
    ...restRequestBody,
    model: `models/${modelName}`,
  });

  const attemptGeminiCall = async (modelName) => {
    const response = await fetch(buildGeminiUrl(modelName, apiKey), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
      const usedModel = successfulAttempt.modelName;
      const firstAttemptModel = attempts[0]?.modelName;

      res.setHeader('x-gemini-model-used', usedModel);
      if (firstAttemptModel && firstAttemptModel !== usedModel) {
        res.setHeader('x-gemini-model-fallback', firstAttemptModel);
      }

      return res.status(200).json(successfulAttempt.parsed || {});
    }

    const lastAttempt = attempts[attempts.length - 1];

    if (!lastAttempt) {
      throw new Error('Gemini proxy failed before attempting any models.');
    }

    if (lastAttempt.response.status === 404) {
      const availableModels = await fetchAvailableModels(apiKey);
      return res.status(404).json({
        error: `Gemini API Error: Model(s) ${attemptedModels
          .map((name) => `"${name}"`)
          .join(', ')} are not available for API version "${API_VERSION}" at ${API_BASE_URL}.`,
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
    return res.status(500).json({ error: `Proxy Error: ${err.message}` });
  }
}
