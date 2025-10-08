const API_BASE_URL = (process.env.OPENAI_API_BASE_URL || 'https://api.openai.com').replace(/\/$/, '');
const CHAT_COMPLETIONS_PATH = process.env.OPENAI_CHAT_COMPLETIONS_PATH || '/v1/chat/completions';
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const shouldIgnoreRequestedModel = (model) => {
  if (typeof model !== 'string') {
    return true;
  }

  const trimmed = model.trim();

  if (!trimmed) {
    return true;
  }

  return /^models\//.test(trimmed) || trimmed.includes(':');
};

const resolveModel = (requestedModel) => {
  if (!shouldIgnoreRequestedModel(requestedModel)) {
    return requestedModel.trim();
  }

  return DEFAULT_MODEL;
};

const normaliseMessages = (requestBody) => {
  if (!requestBody || typeof requestBody !== 'object') {
    return null;
  }

  if (Array.isArray(requestBody.messages) && requestBody.messages.length > 0) {
    return requestBody.messages;
  }

  if (typeof requestBody.prompt === 'string' && requestBody.prompt.trim()) {
    return [
      {
        role: 'user',
        content: requestBody.prompt.trim(),
      },
    ];
  }

  if (Array.isArray(requestBody.contents) && requestBody.contents.length > 0) {
    const mapped = requestBody.contents
      .map((entry) => {
        const parts = Array.isArray(entry?.parts)
          ? entry.parts.map((part) => (typeof part?.text === 'string' ? part.text : '')).join('\n').trim()
          : '';

        if (!parts) {
          return null;
        }

        return {
          role: entry?.role || 'user',
          content: parts,
        };
      })
      .filter(Boolean);

    if (mapped.length > 0) {
      return mapped;
    }
  }

  return null;
};

const buildCompletionsUrl = () =>
  `${API_BASE_URL}${CHAT_COMPLETIONS_PATH.startsWith('/') ? '' : '/'}${CHAT_COMPLETIONS_PATH}`;

const parseResponseBody = async (response) => {
  const rawText = await response.text();
  let parsed = null;

  if (rawText) {
    try {
      parsed = JSON.parse(rawText);
    } catch (error) {
      parsed = null;
    }
  }

  return { rawText, parsed };
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OpenAI API key in environment variables.' });
  }

  const requestBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const messages = normaliseMessages(requestBody);

  if (!messages) {
    return res.status(400).json({ error: 'Request must include prompt, messages, or Gemini-style contents.' });
  }

  const { model: requestedModel, messages: _ignoredMessages, contents: _ignoredContents, prompt: _ignoredPrompt, ...rest } =
    requestBody;

  const payload = {
    ...rest,
    model: resolveModel(requestedModel),
    messages,
  };

  try {
    const response = await fetch(buildCompletionsUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const { parsed, rawText } = await parseResponseBody(response);

    if (!response.ok) {
      const errorMessage =
        parsed?.error?.message || parsed?.error || rawText || `OpenAI API Error (HTTP ${response.status}).`;

      return res.status(response.status).json({
        error: errorMessage,
        rawError: parsed || rawText || null,
      });
    }

    return res.status(200).json(parsed || {});
  } catch (err) {
    return res.status(500).json({ error: `Proxy Error: ${err.message}` });
  }
}
