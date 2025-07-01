// src/components/WineFormModal.js
import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
// REMOVED: No longer using createWorker from tesseract.js
import Modal from './Modal.js';
import AlertMessage from './AlertMessage.js';

// NEW IMPORTS FOR FIREBASE FUNCTIONS
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app'; // Needed to get the initialized Firebase app instance

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

    const [isScanning, setIsScanning] = useState(false);
    const webcamRef = useRef(null);
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [scanResult, setScanResult] = useState(''); 

    // Initialize Firebase Functions instance (only once per component lifecycle)
    const functions = getFunctions(getApp()); // Get functions instance from the default app
    const callScanWineLabelFunction = httpsCallable(functions, 'scanWineLabel'); // Reference to your deployed function

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
        setIsScanning(false);
        setScanResult(''); 
        setIsProcessingImage(false);
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
        if (formData.year && (isNaN(parseInt(formData.year)) || parseInt(formData.year) < 1000 || parseInt(formData.year) > new Date().getFullYear() + 10 )) { 
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

    // --- Function to capture photo and send to Firebase Cloud Function ---
    const captureAndSendToCloudFunction = async () => {
        if (webcamRef.current) {
            setIsProcessingImage(true);
            setScanResult(''); // Clear previous scan results
            setFormError(''); // Clear previous form errors
            const imageSrc = webcamRef.current.getScreenshot(); 

            if (!imageSrc) {
                setFormError("Failed to capture image from webcam.");
                setIsProcessingImage(false);
                return;
            }
            
            try {
                // Call the Firebase Cloud Function
                const response = await callScanWineLabelFunction({ image: imageSrc });
                const { success, fullText } = response.data; // Data is nested under .data for callable functions

                if (success) {
                    setScanResult(fullText); // Display the full text from the Cloud Function

                    // --- Basic Parsing of OCR output (refine this as needed) ---
                    // This is a very simple example assuming "Year: XXXX" format or finding a 4-digit number.
                    const yearMatch = fullText.match(/\b(19|20)\d{2}\b/);
                    
                    // You'll need more robust regex or logic here for other fields.
                    // Example: Try to find "Producer:", "Name:", "Region:", "Vol:" etc.
                    const producerMatch = fullText.match(/(?:Producer|Domaine|Château|Bodega|Winery)[:\s]*([^\n,]+)/i);
                    const nameMatch = fullText.match(/(?:Name|Wine|Label)[:\s]*([^\n,]+)/i);
                    const regionMatch = fullText.match(/(?:Region|Appellation)[:\s]*([^\n,]+)/i);

                    setFormData(prev => ({
                        ...prev,
                        year: yearMatch ? yearMatch[0] : prev.year,
                        producer: producerMatch ? producerMatch[1].trim() : prev.producer,
                        name: nameMatch ? nameMatch[1].trim() : prev.name,
                        region: regionMatch ? regionMatch[1].trim() : prev.region,
                        // You can add more logic here to parse other fields from fullText
                        // For instance, for color, you might check for keywords like "red", "white", "rosé"
                        // or try to infer from common grape varietals.
                    }));

                } else {
                    setFormError(fullText || "Could not extract information from the label (Cloud Function issue).");
                }
                
                setIsScanning(false); // Switch back to form view

            } catch (functionError) {
                console.error("Error calling Cloud Function:", functionError);
                // HttpsError details are in functionError.code and functionError.message
                setFormError(`Failed to scan label: ${functionError.message}. Please try again.`);
                setIsScanning(false); // Return to form on error
            } finally {
                setIsProcessingImage(false);
            }
        }
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={wine ? 'Edit Wine' : 'Add New Wine'}>
            {formError && <AlertMessage message={formError} type="error" onDismiss={() => setFormError('')} />}

            {!isScanning && ( // Show form if not scanning
                <>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Existing form fields */}
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

                        <div className="flex justify-between items-center space-x-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsScanning(true)}
                                className="px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-600 hover:bg-blue-200 dark:hover:bg-blue-500 rounded-md border border-blue-300 dark:border-blue-500"
                            >
                                <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                Scan Label
                            </button>
                            <div className="flex space-x-3">
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
                        </div>
                    </form>
                </>
            )}

            {isScanning && ( // Show camera view if scanning
                <div className="flex flex-col items-center">
                    <h3 className="text-xl font-semibold mb-3 text-slate-700 dark:text-slate-200">Scan Wine Label</h3>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden mb-4">
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            width={400} // Adjust as needed
                            height={300} // Adjust as needed
                            className="w-full h-full object-cover"
                            videoConstraints={{ facingMode: "environment" }} // Prefer rear camera on mobile
                        />
                    </div>
                    {isProcessingImage && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 flex items-center">
                            <svg className="animate-spin h-4 w-4 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing image with AI...
                        </p>
                    )}
                    {scanResult && (
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md mb-4 w-full text-sm text-slate-700 dark:text-blue-200 whitespace-pre-wrap">
                            **AI Scanned Text:** <br/> {scanResult}
                        </div>
                    )}
                    <div className="flex justify-end space-x-3 w-full">
                        <button
                            type="button"
                            onClick={() => setIsScanning(false)} // Back to form
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-md border border-slate-300 dark:border-slate-500"
                        >
                            Back to Form
                        </button>
                        <button
                            type="button"
                            onClick={captureAndSendToCloudFunction} // Call the Cloud Function
                            disabled={isProcessingImage}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Capture Photo & Scan with AI
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default WineFormModal;