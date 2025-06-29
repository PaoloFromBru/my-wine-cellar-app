import React, { useMemo } from 'react';
import WineItem from '../components/WineItem'; // Path adjusted for views folder

// --- Icons (local for this component for now, but ideally would be imported from a central Icons.js) ---
const ClockIcon = ({className="w-5 h-5"}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);
const WineBottleIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.252 2.262A2.25 2.25 0 0 0 5.254 4.24v11.517a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25V4.24a2.25 2.25 0 0 0-1.998-1.978A2.253 2.253 0 0 0 15 2.25H9c-1.014 0-1.881.676-2.172 1.622a2.24 2.24 0 0 1 .424-1.61ZM9 4.5h6M9 7.5h6m-6 3h6m-3.75 3h.008v.008h-.008V15Z" />
    </svg>
);


const DrinkSoonView = ({ winesApproachingEnd, handleOpenWineForm, confirmExperienceWine, handleOpenFoodPairing }) => {
    return (
        <>
            {winesApproachingEnd.length > 0 ? (
                <div className="mb-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow border border-yellow-200 dark:border-yellow-700">
                    <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-300 mb-3 flex items-center space-x-2">
                        <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        <span>Drink Soon! Wines Requiring Attention</span>
                    </h2>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-4">
                        These wines are either past their ideal drinking window or their window ends this year.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {winesApproachingEnd.map(wine => (
                            <WineItem
                                key={wine.id}
                                wine={wine}
                                onEdit={() => handleOpenWineForm(wine)}
                                onExperience={() => confirmExperienceWine(wine.id)}
                                onPairFood={() => handleOpenFoodPairing(wine)} 
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-lg shadow-md mt-6">
                    <ClockIcon className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-slate-700 dark:text-slate-200">No wines currently requiring immediate attention!</h3>
                    <p className="text-slate-500 dark:text-slate-400">All wines are either not yet in their window or have ample time left.</p>
                </div>
            )}
        </>
    );
};

export default DrinkSoonView;