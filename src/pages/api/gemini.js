const API_VERSION = process.env.GEMINI_API_VERSION || 'v1beta';
const API_BASE_URL = (process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com').replace(/\/$/, '');

const normaliseModel = (model) => {
  if (!model || typeof model !== 'string') {
    return null;
  }

  return model.startsWith('models/') ? model.slice('models/'.length) : model;
};

const DEFAULT_MODEL = normaliseModel(process.env.GEMINI_MODEL) || 'gemini-2.5-flash';

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
  const model = requestedModel || DEFAULT_MODEL;

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
    const primaryAttempt = await attemptGeminiCall(model);

    if (primaryAttempt.response.ok) {
      res.setHeader('x-gemini-model-used', primaryAttempt.modelName);
      return res.status(200).json(primaryAttempt.parsed || {});
    }

    const attemptedModels = [primaryAttempt.modelName];

    if (primaryAttempt.response.status === 404 && primaryAttempt.modelName !== DEFAULT_MODEL) {
      const fallbackAttempt = await attemptGeminiCall(DEFAULT_MODEL);
      attemptedModels.push(DEFAULT_MODEL);

      if (fallbackAttempt.response.ok) {
        res.setHeader('x-gemini-model-used', fallbackAttempt.modelName);
        res.setHeader('x-gemini-model-fallback', primaryAttempt.modelName);
        return res.status(200).json(fallbackAttempt.parsed || {});
      }

      if (fallbackAttempt.response.status === 404) {
        const availableModels = await fetchAvailableModels(apiKey);
        return res.status(404).json({
          error: `Gemini API Error: Requested models ${attemptedModels
            .map((name) => `"${name}"`)
            .join(', ')} are not available for API version "${API_VERSION}" at ${API_BASE_URL}.`,
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
      const availableModels = await fetchAvailableModels(apiKey);
      return res.status(404).json({
        error: `Gemini API Error: Model "${primaryAttempt.modelName}" is not available for API version "${API_VERSION}" at ${API_BASE_URL}.`,
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
    return res.status(500).json({ error: `Proxy Error: ${err.message}` });
  }
}
