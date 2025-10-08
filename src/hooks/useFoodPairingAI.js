import { useState } from 'react';

const DEFAULT_ERROR_MESSAGE = (status) => `OpenAI request failed with status ${status}.`;

const parseJsonSafely = async (response) => {
  const text = await response.text();
  if (!text) {
    return { parsed: null, rawText: '' };
  }

  try {
    return { parsed: JSON.parse(text), rawText: text };
  } catch (error) {
    return { parsed: null, rawText: text };
  }
};

const buildOpenAIError = (response, parsed, rawText) => {
  const message =
    (typeof parsed?.error === 'string' && parsed.error) ||
    parsed?.error?.message ||
    rawText ||
    DEFAULT_ERROR_MESSAGE(response.status);

  return message;
};

const sendOpenAIRequest = async (payload) => {
  const response = await fetch('/api/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const { parsed, rawText } = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(buildOpenAIError(response, parsed, rawText));
  }

  return parsed;
};

export const useFoodPairingAI = (setError) => {
  const [foodPairingSuggestion, setFoodPairingSuggestion] = useState(null);
  const [isLoadingPairing, setIsLoadingPairing] = useState(false);
  const [pairingError, setPairingError] = useState(null);

  const handleError = (message) => {
    setPairingError(message);
    if (typeof setError === 'function') {
      setError(message, 'error');
    }
  };

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
      const data = await sendOpenAIRequest({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const suggestion = data?.choices?.[0]?.message?.content?.trim();
      if (suggestion) {
        setFoodPairingSuggestion(suggestion);
      } else {
        setFoodPairingSuggestion('No specific pairing suggestion found.');
      }
    } catch (err) {
      console.error('Error fetching food pairing:', err);
      const message = `Food pairing suggestion failed: ${err.message}`;
      handleError(message);
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
      const data = await sendOpenAIRequest({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const suggestion = data?.choices?.[0]?.message?.content?.trim();
      if (suggestion) {
        setFoodPairingSuggestion(suggestion);
      } else {
        setFoodPairingSuggestion('No specific reverse pairing suggestion found.');
      }
    } catch (err) {
      console.error('Error finding wine for food:', err);
      const message = `Finding wine for food failed: ${err.message}`;
      handleError(message);
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
