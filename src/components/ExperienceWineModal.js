import React, { useState, useEffect } from 'react';
import Modal from './Modal.js'; // Import Modal
import AlertMessage from './AlertMessage.js'; // Import AlertMessage

// --- Icons (local for this component, but ideally would be imported from a central Icons.js) ---
const StarIcon = ({ className = "w-4 h-4", onClick }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" onClick={onClick}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.109 5.625.441a.562.562 0 0 1 .322.978l-4.307 3.972 1.282 5.586a.562.562 0 0 1-.84.61l-4.908-2.921-4.908 2.921a.562.562 0 0 1-.84-.61l1.282-5.586-4.307-3.972a.562.562 0 0 1 .322-.978l5.625-.441L11.48 3.499Z" />
    </svg>
);


const ExperienceWineModal = ({ isOpen, onClose, wine, onExperience }) => {
    const [tastingNotes, setTastingNotes] = useState('');
    const [rating, setRating] = useState(0); // 0 to 5 stars
    const [consumedDate, setConsumedDate] = useState(new Date().toISOString().slice(0, 10)); //YYYY-MM-DD
    const [modalError, setModalError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTastingNotes('');
            setRating(0);
            setConsumedDate(new Date().toISOString().slice(0, 10));
            setModalError('');
        }
    }, [isOpen, wine]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setModalError('');
        setIsLoading(true);

        if (!consumedDate) {
            setModalError('Consumed date is required.');
            setIsLoading(false);
            return;
        }

        try {
            await onExperience(wine.id, tastingNotes, rating, consumedDate);
            onClose(); // Close on success
        } catch (err) {
            setModalError(`Failed to save experience: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!wine) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Experience Wine: ${wine.name || wine.producer}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {modalError && <AlertMessage message={modalError} type="error" onDismiss={() => setModalError('')} />}
                
                <div>
                    <label htmlFor="consumedDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date Consumed <span className="text-red-500">*</span></label>
                    <input
                        type="date"
                        id="consumedDate"
                        value={consumedDate}
                        onChange={(e) => setConsumedDate(e.target.value)}
                        className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-green-500 focus:border-green-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="rating" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Rating (1-5)</label>
                    <div className="flex items-center mt-1 space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon
                                key={star}
                                className={`w-6 h-6 inline-block cursor-pointer ${ 
                                    star <= rating ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'
                                }`}
                                onClick={() => {
                                    setRating(star);
                                }} 
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <label htmlFor="tastingNotes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tasting Notes</label>
                    <textarea
                        id="tastingNotes"
                        value={tastingNotes}
                        onChange={(e) => setTastingNotes(e.target.value)}
                        rows="4"
                        className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-green-500 focus:border-green-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200"
                        placeholder="e.g., Fruity, earthy, paired well with..."
                    ></textarea>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-md border border-slate-300 dark:border-slate-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Saving...' : 'Save Experience & Drink'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ExperienceWineModal;
