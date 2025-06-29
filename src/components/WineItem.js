import React from 'react';
// No Firebase Timestamp import needed directly in this component anymore

// --- Icons (local for this component for now, but ideally would be imported from a central Icons.js) ---
const FoodIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
);
const CheckCircleIcon = ({className="w-5 h-5"}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);
const EditIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);


const WineItem = ({ wine, onEdit, onExperience, onPairFood }) => { 
    const wineColors = {
        red: 'bg-red-200 dark:bg-red-800 border-red-400 dark:border-red-600',
        white: 'bg-yellow-100 dark:bg-yellow-700 border-yellow-300 dark:border-yellow-500',
        rose: 'bg-pink-100 dark:bg-pink-700 border-pink-300 dark:border-pink-500',
        sparkling: 'bg-blue-100 dark:bg-blue-700 border-blue-300 dark:border-blue-500',
        other: 'bg-slate-200 dark:bg-slate-600 border-slate-400 dark:border-slate-500',
    };
    const colorClass = wineColors[wine.color?.toLowerCase()] || wineColors.other;

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-2xl flex flex-col`}>
            <div className={`p-4 border-l-8 ${colorClass}`}>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate" title={wine.name || wine.producer}>{wine.name || wine.producer}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{wine.year || 'N/A'}</p>
            </div>
            <div className="p-5 space-y-3 flex-grow">
                <p><strong className="text-slate-600 dark:text-slate-300">Producer:</strong> <span className="text-slate-700 dark:text-slate-200">{wine.producer}</span></p>
                <p><strong className="text-slate-600 dark:text-slate-300">Region:</strong> <span className="text-slate-700 dark:text-slate-200">{wine.region}</span></p>
                <p><strong className="text-slate-600 dark:text-slate-300">Color:</strong> <span className="text-slate-700 dark:text-slate-200 capitalize">{wine.color}</span></p>
                <p><strong className="text-slate-600 dark:text-slate-300">Location:</strong> <span className="text-slate-700 dark:text-slate-200">{wine.location}</span></p>
                {/* Display Drinking Window if available */}
                {(wine.drinkingWindowStartYear && wine.drinkingWindowEndYear) ? (
                    <p><strong className="text-slate-600 dark:text-slate-300">Drink Window:</strong> <span className="text-slate-700 dark:text-slate-200">{wine.drinkingWindowStartYear} - {wine.drinkingWindowEndYear}</span></p>
                ) : (
                    <p className="text-sm text-slate-400 italic">No drinking window set</p>
                )}
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 flex justify-end space-x-2 border-t border-slate-200 dark:border-slate-700">
                <button
                    onClick={onPairFood} 
                    title="Pair with Food (AI)"
                    className="p-2 rounded-md text-sm text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-700 transition-colors"
                >
                    <FoodIcon />
                </button>
                <button
                    onClick={onExperience} 
                    title="Mark as Drank / Add Notes"
                    className="p-2 rounded-md text-sm text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-700 transition-colors"
                >
                    <CheckCircleIcon /> 
                </button>
                <button
                    onClick={onEdit}
                    title="Edit Wine"
                    className="p-2 rounded-md text-sm text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-700 transition-colors"
                >
                    <EditIcon />
                </button>
            </div>
        </div>
    );
};

export default WineItem;
