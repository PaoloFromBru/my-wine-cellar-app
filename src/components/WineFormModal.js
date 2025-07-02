// src/components/WineFormModal.js
import React, { useState, useEffect } from 'react'; // Removed useRef
// Removed Webcam import
// Removed getFunctions, httpsCallable, getApp, getAuth imports
import Modal from './Modal.js';
import AlertMessage from './AlertMessage.js';

const WineFormModal = ({ isOpen, onClose, onSubmit, wine, allWines }) => {
    const [formData, setFormData] = useState({
        name: '',
        producer: '',
        year: '',
        region: '',
        color: 'red',
        location: '',
        drinkingWindowStartYear: '',
        drinkingWindowEndYear: ''
    });
    const [formError, setFormError] = useState('');

    // Removed isScanning state
    // Removed webcamRef
    // Removed canvasRef
    // Removed isProcessingImage state
    // Removed scanResult state
    // Removed webcamKey state

    // Removed functions, callScanWineLabelFunction, auth initializations

    useEffect(() => {
        if (wine) {
            setFormData({
                name: wine.name || '',
                producer: wine.producer || '',
                year: wine.year || '',
                region: wine.region || '',
                color: wine.color || 'red',
                location: wine.location || '',
                drinkingWindowStartYear: wine.drinkingWindowStartYear || '',
                drinkingWindowEndYear: wine.drinkingWindowEndYear || ''
            });
        } else {
            setFormData({ name: '', producer: '', year: '', region: '', color: 'red', location: '', drinkingWindowStartYear: '', drinkingWindowEndYear: '' });
        }
        setFormError('');
        // Removed setIsScanning(false)
        // Removed setScanResult('')
        // Removed setIsProcessingImage(false)
        // Removed setWebcamKey(Date.now())
    }, [wine, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError('');
        if (!formData.producer || !formData.region || !formData.color || !formData.location) {
            setFormError('Producer, Region, Color, and Location are required.');
            return;
        }
        if (formData.year && (isNaN(parseInt(formData.year)) || parseInt(formData.year) < 1000 || parseInt(formData.year) > new Date().getFullYear() + 10)) {
            setFormError('Please enter a valid Year (e.g., 2020).');
            return;
        }

        const startYear = formData.drinkingWindowStartYear ? parseInt(formData.drinkingWindowStartYear, 10) : null;
        const endYear = formData.drinkingWindowEndYear ? parseInt(formData.drinkingWindowEndYear, 10) : null;

        if (formData.drinkingWindowStartYear && (isNaN(startYear) || startYear < 1000 || startYear > new Date().getFullYear() + 50)) {
            setFormError('Please enter a valid Drinking Window Start Year.');
            return;
        }
        if (formData.drinkingWindowEndYear && (isNaN(endYear) || endYear < 1000 || endYear > new Date().getFullYear() + 100)) {
            setFormError('Please enter a valid Drinking Window End Year.');
            return;
        }
        if (startYear && endYear && startYear > endYear) {
            setFormError('Drinking Window Start Year cannot be after End Year.');
            return;
        }


        if (formData.location && allWines) {
            const currentLocation = formData.location.trim().toLowerCase();
            let isLocationTaken = false;
            if (wine && wine.id) {
                isLocationTaken = allWines.some(
                    w => w.id !== wine.id && w.location && w.location.trim().toLowerCase() === currentLocation
                );
            } else {
                isLocationTaken = allWines.some(
                    w => w.location && w.location.trim().toLowerCase() === currentLocation
                );
            }

            if (isLocationTaken) {
                setFormError(`Location "${formData.location}" is already in use. Please choose a different one or clear the location of the other bottle first.`);
                return;
            }
        }
        onSubmit(formData);
    };

    const wineColorOptions = ['red', 'white', 'rose', 'sparkling', 'other'];

    // Removed captureAndSendToCloudFunction function

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={wine ? 'Edit Wine' : 'Add New Wine'}>
            {formError && <AlertMessage message={formError} type="error" onDismiss={() => setFormError('')} />}

            {/* Always show the form, as scanning functionality is removed */}
            <>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name (Optional)</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200"
                        />
                    </div>
                    <div>
                        <label htmlFor="producer" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Producer <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="producer"
                            id="producer"
                            value={formData.producer}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200"
                        />
                    </div>
                    <div>
                        <label htmlFor="year" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Year</label>
                        <input
                            type="number"
                            name="year"
                            id="year"
                            value={formData.year}
                            onChange={handleChange}
                            placeholder={`e.g., ${new Date().getFullYear() - 5}`}
                            className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200"
                        />
                    </div>
                    <div>
                        <label htmlFor="region" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Region <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="region"
                            id="region"
                            value={formData.region}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200"
                        />
                    </div>
                    <div>
                        <label htmlFor="color" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Color <span className="text-red-500">*</span></label>
                        <select
                            name="color"
                            id="color"
                            value={formData.color}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200"
                        >
                            {wineColorOptions.map(opt => (
                                <option key={opt} value={opt} className="capitalize">{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Cellar Location <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="location"
                            id="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g., Rack A, Shelf 3"
                            required
                            className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200"
                        />
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                        <h3 className="base font-semibold text-slate-700 dark:text-slate-200 mb-2">Drinking Window (Optional)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="drinkingWindowStartYear" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Start Year</label>
                                <input
                                    type="number"
                                    name="drinkingWindowStartYear"
                                    id="drinkingWindowStartYear"
                                    value={formData.drinkingWindowStartYear}
                                    onChange={handleChange}
                                    placeholder="e.g., 2023"
                                    className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200"
                                />
                            </div>
                            <div>
                                <label htmlFor="drinkingWindowEndYear" className="block text-sm font-medium text-slate-700 dark:text-slate-300">End Year</label>
                                <input
                                    type="number"
                                    name="drinkingWindowEndYear"
                                    id="drinkingWindowEndYear"
                                    value={formData.drinkingWindowEndYear}
                                    onChange={handleChange}
                                    placeholder="e.g., 2030"
                                    className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                        {/* Removed Scan Label button */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-md border border-slate-300 dark:border-slate-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            {wine ? 'Save Changes' : 'Add Wine'}
                        </button>
                    </div>
                </form>
            </>
            {/* Removed isScanning conditional block and Webcam/canvas JSX */}
        </Modal>
    );
};

export default WineFormModal;