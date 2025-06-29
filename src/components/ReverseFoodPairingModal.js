import React from 'react';
import Modal from './Modal.js'; // Import Modal

// --- Icons (local for this component for now) ---
const SparklesIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L21.75 9 18.937 5.154a4.5 4.5 0 0 0-3.09-3.09L12.75 3l-2.846.813a4.5 4.5 0 0 0-3.09 3.09L6 9l2.846.813a4.5 4.5 0 0 0 3.09 3.09L12.75 12l-.813 2.846a4.5 4.5 0 0 0-3.09 3.09L9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813" />
    </svg>
);

const ReverseFoodPairingModal = ({ isOpen, onClose, foodItem, suggestion, isLoading }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Wine Suggestion for ${foodItem || 'Your Meal'}`}>
            {isLoading && (
                <div className="flex items-center justify-center space-x-2 text-slate-600 dark:text-slate-300 py-6">
                    <svg className="animate-spin h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Searching your cellar for the best match...</span>
                </div>
            )}
            {!isLoading && suggestion && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-700">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">For "{foodItem}":</h4>
                    <p className="text-slate-700 dark:text-blue-200 whitespace-pre-wrap">{suggestion}</p>
                </div>
            )}
            {!isLoading && !suggestion && (
                 <p className="text-slate-500 dark:text-slate-400 py-4 text-center">No suggestion available. Please try again.</p>
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

export default ReverseFoodPairingModal;
