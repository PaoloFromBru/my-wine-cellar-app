import React, { useMemo } from 'react';
import WineItem from '../components/WineItem'; // Path adjusted for views folder

// --- Icons (local for this component for now, as in App.js) ---
// In a larger app, these icons would typically be in their own `src/assets/icons.js`
// or a similar central location and imported from there.
const SearchIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);
const PlusIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);
const WineBottleIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.252 2.262A2.25 2.25 0 0 0 5.254 4.24v11.517a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25V4.24a2.25 2.25 0 0 0-1.998-1.978A2.253 2.253 0 0 0 15 2.25H9c-1.014 0-1.881.676-2.172 1.622a2.24 2.24 0 0 1 .424-1.61ZM9 4.5h6M9 7.5h6m-6 3h6m-3.75 3h.008v.008h-.008V15Z" />
    </svg>
);


const CellarView = ({ wines, searchTerm, setSearchTerm, handleOpenWineForm, confirmExperienceWine, handleOpenFoodPairing, isLoadingWines, user }) => {
    const filteredWines = useMemo(() => {
        return wines.filter(wine => {
            const searchTermLower = searchTerm.toLowerCase();
            return (
                wine.name?.toLowerCase().includes(searchTermLower) ||
                wine.producer?.toLowerCase().includes(searchTermLower) ||
                wine.region?.toLowerCase().includes(searchTermLower) ||
                wine.color?.toLowerCase().includes(searchTermLower) ||
                wine.location?.toLowerCase().includes(searchTermLower) ||
                (wine.year && wine.year.toString().includes(searchTermLower))
            );
        });
    }, [wines, searchTerm]);

    return (
        <>
            {/* Action Bar: Search & Add Wine */}
            <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <label htmlFor="wineSearch" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Search Your Wines</label>
                        <div className="relative">
                            <input
                                id="wineSearch"
                                type="text"
                                placeholder="Producer, region, year..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-3 pl-10 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none dark:bg-slate-700 dark:text-slate-200"
                            />
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                        </div>
                    </div>
                    <button
                        onClick={() => handleOpenWineForm()}
                        className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-md shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                    >
                        <PlusIcon />
                        <span>Add New Wine</span>
                    </button>
                </div>
            </div>
            
            {/* Wine Collection Display */}
            {isLoadingWines && user && <p className="text-center py-4">Loading your wine collection...</p>}
            
            {!isLoadingWines && wines.length === 0 && !searchTerm && user && (
                <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-lg shadow-md mt-6">
                    <WineBottleIcon className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-slate-700 dark:text-slate-200">Your cellar is empty!</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Start by adding your first bottle or importing a CSV file.</p>
                </div>
            )}

            {!isLoadingWines && filteredWines.length === 0 && searchTerm && user && (
                <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-lg shadow-md mt-6">
                    <SearchIcon className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-slate-700 dark:text-slate-200">No wines found for "{searchTerm}"</h3>
                    <p className="text-slate-500 dark:text-slate-400">Try adjusting your search term.</p>
                </div>
            )}
            
            {filteredWines.length > 0 && user && (
                <>
                    <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4 mt-8">Your Wine Collection</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredWines.map(wine => (
                            <WineItem
                                key={wine.id}
                                wine={wine}
                                onEdit={() => handleOpenWineForm(wine)}
                                onExperience={() => confirmExperienceWine(wine.id)} 
                                onPairFood={() => handleOpenFoodPairing(wine)} 
                            />
                        ))}
                    </div>
                </>
            )}
        </>
    );
};

export default CellarView;
