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

  const payload = {
    ...requestBody,
    model: `models/${model}`,
  };

  const geminiUrl = buildGeminiUrl(model, apiKey);

  try {
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!geminiRes.ok) {
      if (geminiRes.status === 404) {
        const availableModels = await fetchAvailableModels(apiKey);
        return res.status(404).json({
          error: `Gemini API Error: Model "${model}" is not available for API version "${API_VERSION}" at ${API_BASE_URL}.`,
          availableModels,
        });
      }

      const errorText = await geminiRes.text();
      return res.status(geminiRes.status).json({ error: `Gemini API Error: ${errorText}` });
    }

    const data = await geminiRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: `Proxy Error: ${err.message}` });
  }
}
