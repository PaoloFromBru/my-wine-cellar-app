import React from 'react';
import AlertMessage from '../components/AlertMessage'; // Import AlertMessage
// --- Icons (local for this component for now, but ideally would be imported from a central Icons.js) ---
const SparklesIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L21.75 9 18.937 5.154a4.5 4.5 0 0 0-3.09-3.09L12.75 3l-2.846.813a4.5 4.5 0 0 0-3.09 3.09L6 9l2.846.813a4.5 4.5 0 0 0 3.09 3.09L12.75 12l-.813 2.846a4.5 4.5 0 0 0-3.09 3.09L9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813" />
    </svg>
);
const WineBottleIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.252 2.262A2.25 2.25 0 0 0 5.254 4.24v11.517a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25V4.24a2.25 2.25 0 0 0-1.998-1.978A2.253 2.253 0 0 0 15 2.25H9c-1.014 0-1.881.676-2.172 1.622a2.24 2.24 0 0 1 .424-1.61ZM9 4.5h6M9 7.5h6m-6 3h6m-3.75 3h.008v.008h-.008V15Z" />
    </svg>
);


const FoodPairingView = ({ foodForReversePairing, setFoodForReversePairing, handleFindWineForFood, isLoadingReversePairing, wines }) => {
    return (
        <>
            {/* Reverse Food Pairing Section */}
            <div className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">Find the Perfect Wine for Your Meal</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Enter a food item and the app will suggest the best wine from your cellar.
                </p>
                <div className="flex flex-col sm:flex-row items-end gap-3">
                    <div className="flex-grow w-full">
                        <label htmlFor="foodItem" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">What are you eating?</label>
                        <input
                            id="foodItem"
                            type="text"
                            placeholder="e.g., Grilled Chicken, Spicy Pasta"
                            value={foodForReversePairing}
                            onChange={(e) => setFoodForReversePairing(e.target.value)}
                            className="w-full p-3 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none dark:bg-slate-700 dark:text-slate-200"
                        />
                    </div>
                    <button
                        onClick={handleFindWineForFood}
                        disabled={isLoadingReversePairing || wines.length === 0}
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-md shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <SparklesIcon /> 
                        <span>Suggest Wine</span>
                    </button>
                </div>
                {wines.length === 0 && (
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">Add some wines to your cellar to use this feature.</p>
                )}
            </div>
            <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">Individual Wine Pairing</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    You can also find food pairings for specific wines from your main cellar list.
                </p>
                <button
                    onClick={() => { /* In a real app, this would change the view state in parent App */ }}
                    className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold flex items-center space-x-2"
                >
                    <WineBottleIcon className="w-4 h-4" />
                    <span>Go to My Cellar to pick a wine</span>
                </button>
            </div>
        </>
    );
};

export default FoodPairingView;
