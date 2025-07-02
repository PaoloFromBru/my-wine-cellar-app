// src/hooks/useFoodPairingAI.js
import { useState, useCallback } from 'react';

export const useFoodPairingAI = (setError) => {
    const [foodPairingSuggestion, setFoodPairingSuggestion] = useState(null);
    const [isLoadingPairing, setIsLoadingPairing] = useState(false);
    const [pairingError, setPairingError] = useState(null);

    const fetchFoodPairing = useCallback(async (wine) => {
        setIsLoadingPairing(true);
        setPairingError(null);
        setFoodPairingSuggestion(null);

        // --- NEW DEBUG LOG ---
        const geminiApiKey = process.env.REACT_APP_GOOGLE_API_KEY;
        console.log("DEBUG AI: API Key (first 5 chars):", geminiApiKey ? geminiApiKey.substring(0,5) + "..." : "NOT SET");
        // --- END NEW DEBUG LOG ---

        if (!geminiApiKey) {
            setPairingError("Gemini API key is not configured.");
            setError("Gemini API key is missing. Please check .env setup.", 'error');
            setIsLoadingPairing(false);
            return;
        }

        if (!wine || (!wine.name && !wine.producer && !wine.region)) {
            setPairingError("Please select a wine with enough details for pairing.");
            return;
        }

        const wineDetails = `Wine Name: ${wine.name || 'N/A'}, Producer: ${wine.producer || 'N/A'}, Region: ${wine.region || 'N/A'}, Color: ${wine.color || 'N/A'}, Year: ${wine.year || 'N/A'}`;
        const prompt = `Given the wine: ${wineDetails}, what are 3-5 great food pairing suggestions? Provide concise suggestions.`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro-001:generateContent?key=${geminiApiKey}`; // Ensure this model supports text-only input

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Gemini API error response:", errorData);
                throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
            }

            const data = await response.json();
            const suggestion = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (suggestion) {
                setFoodPairingSuggestion(suggestion);
            } else {
                setFoodPairingSuggestion("No specific pairing suggestion found.");
            }
        } catch (err) {
            console.error("Error fetching food pairing:", err);
            setPairingError(`Failed to get suggestion: ${err.message}`);
            setError(`Failed to get suggestion: ${err.message}`, 'error');
        } finally {
            setIsLoadingPairing(false);
        }
    }, [setError]);

    // ... (findWineForFood and other functions remain unchanged)
    const findWineForFood = useCallback(async (foodItem, allWines) => {
        setIsLoadingPairing(true);
        setPairingError(null);
        setFoodPairingSuggestion(null); // Clear previous suggestions

        if (!foodItem) {
            setPairingError("Please enter a food item for reverse pairing.");
            setIsLoadingPairing(false);
            return;
        }

        const wineListText = allWines.map(wine =>
            `Name: ${wine.name || 'N/A'}, Producer: ${wine.producer || 'N/A'}, Region: ${wine.region || 'N/A'}, Color: ${wine.color || 'N/A'}, Year: ${wine.year || 'N/A'}`
        ).join('\n');

        const prompt = `Given the food item: "${foodItem}", and the following wines from my cellar:\n\n${wineListText}\n\nSuggest 1-3 wines from the list that would pair well with "${foodItem}". If no good pairing exists, state that. Focus only on the provided wine list.`;

        const geminiApiKey = process.env.REACT_APP_GOOGLE_API_KEY; // Re-get API key for this function too

        if (!geminiApiKey) {
            setPairingError("Gemini API key is not configured for reverse pairing.");
            setError("Gemini API key is missing. Please check .env setup.", 'error');
            setIsLoadingPairing(false);
            return;
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro-001:generateContent?key=${geminiApiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Gemini API reverse pairing error response:", errorData);
                throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
            }

            const data = await response.json();
            const suggestion = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (suggestion) {
                setFoodPairingSuggestion(suggestion);
            } else {
                setFoodPairingSuggestion("No specific reverse pairing suggestion found.");
            }
        } catch (err) {
            console.error("Error fetching reverse food pairing:", err);
            setPairingError(`Failed to get reverse suggestion: ${err.message}`);
            setError(`Failed to get reverse suggestion: ${err.message}`, 'error');
        } finally {
            setIsLoadingPairing(false);
        }
    }, [setError]);


    return {
        foodPairingSuggestion,
        isLoadingPairing,
        pairingError,
        fetchFoodPairing,
        findWineForFood,
        setFoodPairingSuggestion,
        setPairingError
    };
};