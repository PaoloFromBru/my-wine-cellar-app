import React, { useEffect } from 'react';
import Modal from './Modal.js'; // Import Modal
import AlertMessage from './AlertMessage.js'; // Import AlertMessage

// --- Icons (local for this component for now) ---
const FoodIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
);


const FoodPairingModal = ({ isOpen, onClose, wine, suggestion, isLoading, onFetchPairing }) => {
    useEffect(() => {
        if (isOpen && wine && !suggestion && !isLoading) {
            onFetchPairing();
        }
    }, [isOpen, wine, suggestion, isLoading, onFetchPairing]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Food Pairing for ${wine?.name || wine?.producer || 'Wine'}`}>
            {wine && (
                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-md">
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{wine.producer} {wine.year || 'N/A'}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{wine.region} - <span className="capitalize">{wine.color}</span></p>
                </div>
            )}
            {isLoading && (
                <div className="flex items-center justify-center space-x-2 text-slate-600 dark:text-slate-300 py-4">
                    <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Finding the perfect pairing...</span>
                </div>
            )}
            {!isLoading && suggestion && (
                <div className="p-3 bg-green-50 dark:bg-green-800/50 rounded-md border border-green-200 dark:border-green-700">
                    <p className="text-slate-700 dark:text-green-200 whitespace-pre-wrap">{suggestion}</p>
                </div>
            )}
             {!isLoading && !suggestion && wine && ( 
                <div className="text-center py-4">
                     <p className="text-slate-500 dark:text-slate-400 mb-4">Click below to get a food pairing suggestion for this wine.</p>
                     <button
                        onClick={onFetchPairing}
                        disabled={isLoading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-md shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                        <FoodIcon />
                        <span>Get Suggestion</span>
                    </button>
                </div>
            )}
            <div className="mt-6 flex justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-md border border-slate-300 dark:border-slate-500"
                >
                    Close
                </button>
            </div>
        </Modal>
    );
};

export default FoodPairingModal;