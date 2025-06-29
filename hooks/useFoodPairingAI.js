import { useState } from 'react';

export const useFoodPairingAI = (setError) => {
    const [foodPairingSuggestion, setFoodPairingSuggestion] = useState('');
    const [isLoadingPairing, setIsLoadingPairing] = useState(false);
    const [pairingError, setPairingError] = useState(null);

    const fetchFoodPairing = async (selectedWineForPairing) => {
        if (!selectedWineForPairing) {
            setPairingError("No wine selected for pairing.");
            return;
        }
        setIsLoadingPairing(true);
        setPairingError(null);
        setFoodPairingSuggestion(''); // Clear previous suggestion

        const { producer, year, region, color, name } = selectedWineForPairing;
        const wineDescription = `${name ? name + " " : ""}${producer} ${color} wine from ${region}, year ${year || 'N/A'}`;
        const prompt = `Suggest a specific food pairing for the following wine: ${wineDescription}. Provide a concise suggestion (1-2 sentences).`;

        let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = { contents: chatHistory };
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY || ""; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
            }
            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                setFoodPairingSuggestion(text);
            } else {
                setFoodPairingSuggestion("Could not retrieve a pairing suggestion at this time (unexpected AI response).");
            }
        } catch (err) {
            console.error("Error fetching food pairing:", err);
            setPairingError(`Food pairing suggestion failed: ${err.message}`);
            setFoodPairingSuggestion(`Failed to get suggestion: ${err.message}`);
            setError(prev => prev ? prev + "; " + err.message : err.message); // Propagate to main app error
        } finally {
            setIsLoadingPairing(false);
        }
    };

    const findWineForFood = async (foodItem, winesInCellar) => {
        if (!foodItem.trim()) {
            setPairingError("Please enter a food item to find a wine pairing.");
            return;
        }
        if (winesInCellar.length === 0) {
            setPairingError("Your cellar is empty. Add some wines first to find a pairing.");
            return;
        }

        setIsLoadingPairing(true);
        setPairingError(null);
        setFoodPairingSuggestion(''); // Use this for reverse pairing result

        const wineListForPrompt = winesInCellar.map((wine, index) => 
            `${index + 1}. Name: ${wine.name || 'N/A'}, Producer: ${wine.producer}, Color: ${wine.color}, Region: ${wine.region}, Year: ${wine.year || 'N/A'}`
        ).join('\n');

        const prompt = `I want to eat "${foodItem}". From the following list of wines in my cellar, which one would be the BEST match? Also, list up to two other good alternatives if any. For each suggested wine, briefly explain your choice. If no wines are a good match, please state that.
My wines are:
${wineListForPrompt}`;
        
        let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = { contents: chatHistory };
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY || ""; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
            }
            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                setFoodPairingSuggestion(text); // Using same state for both types of suggestions
            } else {
                setFoodPairingSuggestion("Could not get a wine suggestion at this time (unexpected AI response).");
            }
        } catch (err) {
            console.error("Error finding wine for food:", err);
            setPairingError(`Finding wine for food failed: ${err.message}`);
            setFoodPairingSuggestion(`Failed to get suggestion: ${err.message}`);
            setError(prev => prev ? prev + "; " + err.message : err.message); // Propagate to main app error
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
        setPairingError // Allow clearing pairing specific errors from views
    };
};
