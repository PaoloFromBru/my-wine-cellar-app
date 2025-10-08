import { useState } from 'react';

const DEFAULT_RECOMMENDED_MODEL = 'models/gemini-2.5-flash';

const formatModelName = (model) => {
  if (!model || typeof model !== 'string') {
    return null;
  }

  return model.startsWith('models/') ? model : `models/${model}`;
};

const pickRecommendedModel = (availableModels, explicitRecommendation) => {
  const formattedRecommendation = formatModelName(explicitRecommendation);
  if (formattedRecommendation) {
    return formattedRecommendation;
  }

  if (!Array.isArray(availableModels) || availableModels.length === 0) {
    return DEFAULT_RECOMMENDED_MODEL;
  }

  const formatted = availableModels.map(formatModelName).filter(Boolean);
  if (formatted.length === 0) {
    return DEFAULT_RECOMMENDED_MODEL;
  }

  const preferred = formatted.find((name) => name.endsWith('gemini-2.5-flash'));
  return preferred || formatted[0];
};

const parseGeminiResponse = async (response) => {
  const rawText = await response.text();
  let parsed = null;

  if (rawText) {
    try {
      parsed = JSON.parse(rawText);
    } catch (err) {
      parsed = null;
    }
  }

  return { parsed, rawText };
};

const buildGeminiError = (response, parsed, rawText) => {
  let message =
    (typeof parsed?.error === 'string' && parsed.error) ||
    parsed?.error?.message ||
    rawText ||
    `Gemini request failed with status ${response.status}.`;

  const details = [];

  const attemptedModels = Array.isArray(parsed?.attemptedModels)
    ? parsed.attemptedModels.map(formatModelName).filter(Boolean)
    : [];

  if (attemptedModels.length > 0) {
    details.push(`Attempted models: ${attemptedModels.join(', ')}.`);
  }

  if (response.status === 404) {
    const recommendedModel = pickRecommendedModel(parsed?.availableModels, parsed?.recommendedModel);
    if (recommendedModel) {
      details.push(
        `Recommended model: "${recommendedModel}". Update your GEMINI_MODEL environment variable to this value and redeploy.`
      );
    }

    const formattedEnvModel = formatModelName(parsed?.envModel);
    if (formattedEnvModel) {
      details.push(`Your deployment is currently configured to use "${formattedEnvModel}".`);
    }

    if (Array.isArray(parsed?.availableModels) && parsed.availableModels.length > 0) {
      const availableFormatted = parsed.availableModels
        .map(formatModelName)
        .filter(Boolean)
        .join(', ');
      if (availableFormatted) {
        details.push(`Available models: ${availableFormatted}.`);
      }
    }
  }

  if (details.length > 0) {
    message = `${message} ${details.join(' ')}`.trim();
  }

  return message;
};

const sendGeminiRequest = async (payload) => {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const { parsed, rawText } = await parseGeminiResponse(response);

  if (!response.ok) {
    throw new Error(buildGeminiError(response, parsed, rawText));
  }

  return parsed;
};

export const useFoodPairingAI = (setError) => {
  const [foodPairingSuggestion, setFoodPairingSuggestion] = useState(null);
  const [isLoadingPairing, setIsLoadingPairing] = useState(false);
  const [pairingError, setPairingError] = useState(null);

  const fetchFoodPairing = async (wine) => {
    if (!wine) {
      setPairingError('No wine selected for pairing.');
      return;
    }

    setIsLoadingPairing(true);
    setPairingError(null);
    setFoodPairingSuggestion(null);

    const { producer, year, region, color, name } = wine;
    const wineDescription = `${name ? name + ' ' : ''}${producer} ${color} wine from ${region}, year ${year || 'N/A'}`;
    const prompt = `Suggest a specific food pairing for the following wine: ${wineDescription}. Provide a concise suggestion (1-2 sentences).`;

    try {
      const data = await sendGeminiRequest({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      });
      const suggestion = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (suggestion) {
        setFoodPairingSuggestion(suggestion);
      } else {
        setFoodPairingSuggestion('No specific pairing suggestion found.');
      }
    } catch (err) {
      console.error('Error fetching food pairing:', err);
      const message = `Food pairing suggestion failed: ${err.message}`;
      setPairingError(message);
      if (typeof setError === 'function') {
        setError(message, 'error');
      }
    } finally {
      setIsLoadingPairing(false);
    }
  };

  const findWineForFood = async (foodItem, wines) => {
    if (!foodItem.trim()) {
      setPairingError('Please enter a food item to find a wine pairing.');
      return;
    }
    if (!wines || wines.length === 0) {
      setPairingError('Your cellar is empty. Add some wines first to find a pairing.');
      return;
    }

    setIsLoadingPairing(true);
    setPairingError(null);
    setFoodPairingSuggestion(null);

    const wineListText = wines
      .map(
        (wine, idx) =>
          `${idx + 1}. Name: ${wine.name || 'N/A'}, Producer: ${wine.producer}, Color: ${wine.color}, Region: ${wine.region}, Year: ${wine.year || 'N/A'}`,
      )
      .join('\n');

    const prompt = `I want to eat "${foodItem}". From the following list of wines in my cellar, which one would be the BEST match? Also, list up to two other good alternatives if any. For each suggested wine, briefly explain your choice. If no wines are a good match, please state that.\nMy wines are:\n${wineListText}`;

    try {
      const data = await sendGeminiRequest({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      });
      const suggestion = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (suggestion) {
        setFoodPairingSuggestion(suggestion);
      } else {
        setFoodPairingSuggestion('No specific reverse pairing suggestion found.');
      }
    } catch (err) {
      console.error('Error finding wine for food:', err);
      const message = `Finding wine for food failed: ${err.message}`;
      setPairingError(message);
      if (typeof setError === 'function') {
        setError(message, 'error');
      }
    } finally {
      setIsLoadingPairing(false);
    }
  };

  return {
    foodPairingSuggestion,
    isLoadingPairing,
    pairingError,
    fetchFoodPairing,
    findWineForFood,
    setFoodPairingSuggestion,
    setPairingError,
  };
};

