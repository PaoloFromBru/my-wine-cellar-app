import React from 'react';
import ExperiencedWineItem from '../components/ExperiencedWineItem.js'; // Path adjusted for views folder

// --- Icons (local for this component for now) ---
const CheckCircleIcon = ({className="w-5 h-5"}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);


const ExperiencedWinesView = ({ experiencedWines, confirmDeleteExperiencedWine }) => {
    return (
        <>
            <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4 mt-8">Experienced Wines</h2>
            {experiencedWines.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {experiencedWines.map(wine => (
                        <ExperiencedWineItem 
                            key={wine.id} 
                            wine={wine} 
                            onDelete={() => confirmDeleteExperiencedWine(wine.id)} 
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-lg shadow-md mt-6">
                    <CheckCircleIcon className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-slate-700 dark:text-slate-200">No experienced wines yet.</h3>
                    <p className="text-slate-500 dark:text-slate-400">When you drink a wine, it will appear here!</p>
                </div>
            )}
        </>
    );
};

export default ExperiencedWinesView;
