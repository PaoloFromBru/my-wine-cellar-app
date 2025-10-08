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

dotenv.config();

app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['POST'],
  }),
);

app.use(express.json());

console.log('✅ Loaded OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'YES' : 'NO');

const PORT = process.env.PORT || 5001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_BASE_URL = (process.env.OPENAI_API_BASE_URL || 'https://api.openai.com').replace(/\/$/, '');
const CHAT_COMPLETIONS_PATH = process.env.OPENAI_CHAT_COMPLETIONS_PATH || '/v1/chat/completions';

const buildCompletionsUrl = () =>
  `${OPENAI_BASE_URL}${CHAT_COMPLETIONS_PATH.startsWith('/') ? '' : '/'}${CHAT_COMPLETIONS_PATH}`;

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

const resolveModel = (model) => {
  if (!shouldIgnoreRequestedModel(model)) {
    return model.trim();
  }

  return OPENAI_MODEL;
};

const normaliseMessages = (body) => {
  if (!body || typeof body !== 'object') {
    return null;
  }

  if (Array.isArray(body.messages) && body.messages.length > 0) {
    return body.messages;
  }

  if (typeof body.prompt === 'string' && body.prompt.trim()) {
    return [
      {
        role: 'user',
        content: body.prompt.trim(),
      },
    ];
  }

  if (Array.isArray(body.contents) && body.contents.length > 0) {
    const mapped = body.contents
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

app.post('/api/openai', async (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Missing OpenAI API key.' });
  }

  const messages = normaliseMessages(req.body || {});

  if (!messages) {
    return res.status(400).json({ error: 'Request must include prompt, messages, or Gemini-style contents.' });
  }

  const {
    model: requestedModel,
    messages: _ignoredMessages,
    contents: _ignoredContents,
    prompt: _ignoredPrompt,
    ...restBody
  } = req.body || {};

  const payload = {
    ...restBody,
    model: resolveModel(requestedModel),
    messages,
  };

  try {
    const response = await fetchFn(buildCompletionsUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
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
    console.error('[OpenAI Proxy Error]', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🔄 OpenAI proxy running at http://localhost:${PORT}`);
});
