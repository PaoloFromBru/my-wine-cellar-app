import { useState, useCallback } from 'react';

export const useFoodPairingAI = (setError) => {
  const [foodPairingSuggestion, setFoodPairingSuggestion] = useState(null);
  const [isLoadingPairing, setIsLoadingPairing] = useState(false);
  const [pairingError, setPairingError] = useState(null);

  // Change this if deployed (e.g., "/api/gemini" or Vercel URL)
//  const GEMINI_PROXY_URL = 'http://localhost:5001/api/gemini';
  const GEMINI_PROXY_URL = '/api/gemini'; // ✅ relative path works on Vercel too

  const callGeminiProxy = async (prompt, contextLabel = '') => {
    console.log(`${contextLabel} 🧠 Prompt:`, prompt);

    try {
      const response = await fetch(GEMINI_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }

      return data.suggestion || 'No suggestion received.';
    } catch (err) {
      console.error(`${contextLabel} ❌ Proxy error:`, err);
      setPairingError(`Failed: ${err.message}`);
      setError(`Gemini proxy error: ${err.message}`, 'error');
      return null;
    }
  };

  const fetchFoodPairing = useCallback(async (wine) => {
    setIsLoadingPairing(true);
    setPairingError(null);
    setFoodPairingSuggestion(null);

    if (!wine || (!wine.name && !wine.producer && !wine.region)) {
      setPairingError('Please select a wine with enough details for pairing.');
      setIsLoadingPairing(false);
      return;
    }

    const wineDetails = `Wine Name: ${wine.name || 'N/A'}, Producer: ${wine.producer || 'N/A'}, Region: ${wine.region || 'N/A'}, Color: ${wine.color || 'N/A'}, Year: ${wine.year || 'N/A'}`;
    const prompt = `Given the wine: ${wineDetails}, what are 3-5 great food pairing suggestions? Provide concise suggestions.`;

    const suggestion = await callGeminiProxy(prompt, '[FoodPairing]');
    if (suggestion) setFoodPairingSuggestion(suggestion);

    setIsLoadingPairing(false);
  }, [setError]);

  const findWineForFood = useCallback(async (foodItem, allWines) => {
    setIsLoadingPairing(true);
    setPairingError(null);
    setFoodPairingSuggestion(null);

    if (!foodItem) {
      setPairingError('Please enter a food item.');
      setIsLoadingPairing(false);
      return;
    }

	const topWines = allWines; // use the entire wine list

    const wineListText = topWines.map(wine =>
      `Name: ${wine.name || 'N/A'}, Producer: ${wine.producer || 'N/A'}, Region: ${wine.region || 'N/A'}, Color: ${wine.color || 'N/A'}, Year: ${wine.year || 'N/A'}`
    ).join('\n');

    const prompt = `Given the food item: "${foodItem}", and the following wines from my cellar:\n\n${wineListText}\n\nSuggest 1-3 wines from the list that would pair well with "${foodItem}". Focus only on the provided wine list.`;

    const suggestion = await callGeminiProxy(prompt, '[ReversePairing]');
    if (suggestion) setFoodPairingSuggestion(suggestion);

    setIsLoadingPairing(false);
  }, [setError]);

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
