// src/App.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInAnonymously,
    signInWithCustomToken,
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    addDoc,
    doc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    onSnapshot,
    Timestamp,
    writeBatch,
    setLogLevel
} from 'firebase/firestore';

// Import modularized components (with explicit .js extensions)
import Modal from './components/Modal.js';
import AlertMessage from './components/AlertMessage.js';
import AuthModal from './components/AuthModal.js';
import WineFormModal from './components/WineFormModal.js';
import FoodPairingModal from './components/FoodPairingModal.js';
import ReverseFoodPairingModal from './components/ReverseFoodPairingModal.js';
import ExperienceWineModal from './components/ExperienceWineModal.js';

// Import custom hooks (with explicit .js extensions)
import { useFirebaseData } from './hooks/useFirebaseData.js';
import { useAuthManager } from './hooks/useAuthManager.js';
import { useWineActions } from './hooks/useWineActions.js';
import { useFoodPairingAI } from './hooks/useFoodPairingAI.js';

// Import CSV utilities (with explicit .js extensions)
import { parseCsv, exportToCsv } from './utils/csvUtils.js'; 

// Import modularized views (with explicit .js extensions)
import CellarView from './views/CellarView.js';
import DrinkSoonView from './views/DrinkSoonView.js';
import FoodPairingView from './views/FoodPairingView.js';
import ImportExportView from './views/ImportExportView.js';
import ExperiencedWinesView from './views/ExperiencedWinesView.js';


// --- Icons (kept here for simplicity, but can be further modularized if desired) ---
const WineBottleIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.252 2.262A2.25 2.25 0 0 0 5.254 4.24v11.517a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25V4.24a2.25 2.25 0 0 0-1.998-1.978A2.253 2.253 0 0 0 15 2.25H9c-1.014 0-1.881.676-2.172 1.622a2.24 2.24 0 0 1 .424-1.61ZM9 4.5h6M9 7.5h6m-6 3h6m-3.75 3h.008v.008h-.008V15Z" />
    </svg>
);

const UserIcon = ({className = "w-5 h-5"}) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

const LogoutIcon = ({className = "w-5 h-5"}) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
);

const ClockIcon = ({className="w-5 h-5"}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const FoodIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
);

const UploadIcon = ({ className="w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
);

const CellarIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.75A2.25 2.25 0 0 1 10.5 14h3A2.25 2.25 0 0 1 15.75 16.25V21m-4.5 0H5.625c-.621 0-1.125-.504-1.125-1.125V11.25a9.75 9.75 0 0 1 18 0v8.625c0 .621-.504 1.125-1.125 1.125h-4.5M12 10.5h.008v.008H12V10.5Zm0 3h.008v.008H12V13.5Zm0 3h.008v.008H12V16.5Z" />
    </svg>
);

const CheckCircleIcon = ({className="w-5 h-5"}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);


// --- Firebase Config ---
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCE3XzbBO96yY2uRdK2zuwnWSKjF4SnvSw",
  authDomain: "mypublicwinecellar.firebaseapp.com",
  projectId: "mypublicwinecellar",
  storageBucket: "mypublicwinecellar.firebasestorage.app",
  messagingSenderId: "554888373269",
  appId: "1:554888373269:web:aa83e35df32658acae5a1c",
  measurementId: "G-EVTT48644N"
};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'my-public-wine-cellar-data';


function App() {
    // --- Global Error State ---
    const [globalError, setGlobalError] = useState(null); 

    // --- Data and Auth Hooks ---
    const { auth, db, user, userId, isAuthReady, wines, experiencedWines, isLoadingData, dataError } = useFirebaseData();
    const { authError, isLoadingAuth, login, register, logout, performInitialAuth } = useAuthManager(auth, typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : undefined);
    
    // Wrapped setGlobalError in useCallback for stability when passing to hooks
    const setGlobalErrorCallback = useCallback((msg) => {
        setGlobalError(msg);
    }, []);

    const { 
        handleAddWine, 
        handleUpdateWine, 
        handleExperienceWine, 
        handleDeleteWine, // Import the new function
        handleDeleteExperiencedWine, 
        handleEraseAllWines, 
        isLoadingAction, 
        actionError: wineActionError 
    } = useWineActions(db, userId, appId, setGlobalErrorCallback); 

    const { 
        foodPairingSuggestion, 
        isLoadingPairing, 
        pairingError, 
        fetchFoodPairing, 
        findWineForFood,
        setFoodPairingSuggestion: setFoodPairingSuggestionState, // Renamed to avoid conflict
        setPairingError: setFoodPairingError // Renamed to avoid conflict with global setError
    } = useFoodPairingAI(setGlobalErrorCallback); 


    // --- Local UI State (Managed within App.js) ---
    const [searchTerm, setSearchTerm] = useState('');
    const [showWineFormModal, setShowWineFormModal] = useState(false);
    const [currentWineToEdit, setCurrentWineToEdit] = useState(null);
    const [showFoodPairingModal, setShowFoodPairingModal] = useState(false);
    const [selectedWineForPairing, setSelectedWineForPairing] = useState(null);
    const [csvFile, setCsvFile] = useState(null);
    const [isImportingCsv, setIsImportingCsv] = useState(false);
    const [csvImportStatus, setCsvImportStatus] = useState({ message: '', type: '', errors: [] });
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [currentView, setCurrentView] = useState('myCellar'); 
    const [showExperienceWineModal, setShowExperienceWineModal] = useState(false);
    const [wineToExperience, setWineToExperience] = useState(null);
    const [showEraseAllConfirmModal, setShowEraseAllConfirmModal] = useState(false);

    // FIX: Add missing state variables
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false); // Defined
    const [showDeleteExperiencedConfirmModal, setShowDeleteExperiencedConfirmModal] = useState(false); // Defined
    const [experiencedWineToDelete, setExperiencedWineToDelete] = useState(null);
    const [wineToDelete, setWineToDelete] = useState(null); 
    const [showReversePairingModal, setShowReversePairingModal] = useState(false); // Defined
    const [foodForReversePairing, setFoodForReversePairing] = useState(''); 


    // Combined global error for display (prioritizing order)
    const currentDisplayError = useMemo(() => {
        return globalError || dataError || authError || wineActionError || pairingError;
    }, [globalError, dataError, authError, wineActionError, pairingError]);


    // FIX: Move useMemo out of conditional render for DrinkSoonView
    const winesApproachingEnd = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const winesToConsider = [];
        wines.forEach(wine => {
            const startYear = wine.drinkingWindowStartYear;
            const endYear = wine.drinkingWindowEndYear;
            if (startYear && endYear) {
                if (endYear < currentYear) {
                    winesToConsider.push({ ...wine, drinkingStatus: 'Drink Window Closed' });
                } else if (endYear === currentYear) {
                    winesToConsider.push({ ...wine, drinkingStatus: 'Drink Soon (This Year)' });
                }
            }
        });
        return winesToConsider.sort((a, b) => {
            const statusOrder = { 'Drink Window Closed': 1, 'Drink Soon (This Year)': 2 };
            const statusCompare = statusOrder[a.drinkingStatus] - statusOrder[b.drinkingStatus];
            if (statusCompare !== 0) return statusCompare;
            return (a.drinkingWindowEndYear || Infinity) - (b.drinkingWindowEndYear || Infinity);
        });
    }, [wines]);


    // --- Handlers for Modals / Actions defined in App.js ---
    const handleOpenWineForm = useCallback((wine = null) => { 
        setCurrentWineToEdit(wine); 
        setShowWineFormModal(true); 
    }, []);

    const confirmExperienceWine = useCallback((wineId) => {
        const wine = wines.find(w => w.id === wineId);
        setWineToExperience(wine);
        setShowExperienceWineModal(true);
    }, [wines]); 

    const handleOpenFoodPairing = useCallback((wine) => { 
        setSelectedWineForPairing(wine); 
        setFoodPairingSuggestionState(''); 
        setFoodPairingError(null); 
        setShowFoodPairingModal(true); 
    }, [setFoodPairingSuggestionState, setFoodPairingError]); 

    // FIX: Use handleDeleteWine from useWineActions
    const confirmDeleteWinePermanently = useCallback((wineId) => { 
        const wine = wines.find(w => w.id === wineId);
        setWineToDelete(wine);
        setShowDeleteConfirmModal(true);
    }, [wines]);

    // FIX: Use handleDeleteWine from useWineActions
    const handleActualDeleteWinePermanently = useCallback(async () => { 
        if (!wineToDelete) return;
        await handleDeleteWine(wineToDelete.id); 
        setShowDeleteConfirmModal(false);
        setWineToDelete(null);
    }, [wineToDelete, handleDeleteWine]); 

    // FIX: Define confirmDeleteExperiencedWine
    const confirmDeleteExperiencedWine = useCallback((wineId) => {
        const wine = experiencedWines.find(w => w.id === wineId);
        setExperiencedWineToDelete(wine);
        setShowDeleteExperiencedConfirmModal(true);
    }, [experiencedWines]);

    const handleActualDeleteExperiencedWine = useCallback(async () => {
        if (!experiencedWineToDelete) return;
        await handleDeleteExperiencedWine(experiencedWineToDelete.id);
        setShowDeleteExperiencedConfirmModal(false);
        setExperiencedWineToDelete(null);
    }, [experiencedWineToDelete, handleDeleteExperiencedWine]);

    const confirmEraseAllWines = useCallback(() => {
        if (wines.length === 0) {
            setGlobalError("Your cellar is already empty!"); 
            return;
        }
        setShowEraseAllConfirmModal(true);
    }, [wines, setGlobalError]);


    // CSV Handlers from useCase/App.js scope
    const handleCsvFileChange = useCallback((event) => {
        setCsvFile(event.target.files[0]);
        setCsvImportStatus({ message: '', type: '', errors: [] }); 
    }, []);

    const importCsvData = useCallback(async () => {
        if (!csvFile) {
            setCsvImportStatus({ message: 'Please select a CSV file first.', type: 'error', errors: [] });
            return;
        }
        if (!db || !userId) { 
            setCsvImportStatus({ message: 'Database not ready or user not logged in.', type: 'error', errors: [] });
            return;
        }

        setIsImportingCsv(true);
        setCsvImportStatus({ message: 'Processing CSV...', type: 'info', errors: [] });

        const reader = new FileReader();
        reader.onload = async (event) => { 
            const csvText = event.target.result;
            const { headers, data: parsedData } = parseCsv(csvText); 
            
            const expectedHeaders = ['name', 'producer', 'year', 'region', 'color', 'location', 'drinkingwindowstartyear', 'drinkingwindowendyear'];
            const requiredHeaders = ['producer', 'year', 'region', 'color', 'location'];
            const missingHeaders = requiredHeaders.filter(eh => !headers.includes(eh));
            
            if (missingHeaders.length > 0) {
                setCsvImportStatus({ 
                    message: `CSV import failed. Missing required headers: ${missingHeaders.join(', ')}. Expected at least: ${requiredHeaders.join(', ')}.`, 
                    type: 'error', 
                    errors: [] 
                });
                setIsImportingCsv(false);
                return;
            }

            const winesToImport = [];
            const importErrors = [];
            // Get current locations to check for duplicates
            const currentCellarLocations = wines.map(w => w.location.trim().toLowerCase());
            const locationsInCsv = new Set(); 

            for (let i = 0; i < parsedData.length; i++) { 
                const row = parsedData[i];
                const wineData = {
                    name: row.name || '', 
                    producer: row.producer || '',
                    year: row.year ? parseInt(row.year, 10) : null,
                    region: row.region || '',
                    color: (row.color || 'other').toLowerCase(),
                    location: row.location || '',
                    drinkingWindowStartYear: row.drinkingwindowstartyear ? parseInt(row.drinkingwindowstartyear, 10) : null, 
                    drinkingWindowEndYear: row.drinkingwindowendyear ? parseInt(row.drinkingwindowendyear, 10) : null,     
                };

                // Basic validation
                if (!wineData.producer || !wineData.region || !wineData.color || !wineData.location) {
                    importErrors.push(`Row ${i + 2}: Missing required fields (Producer, Region, Color, Location). Skipped.`);
                    continue;
                }
                if (row.year && (isNaN(wineData.year) || wineData.year < 1000 || wineData.year > new Date().getFullYear() + 10)) {
                    importErrors.push(`Row ${i + 2}: Invalid year "${row.year}". Skipped.`);
                    continue;
                }
                if (wineData.drinkingWindowStartYear && isNaN(wineData.drinkingWindowStartYear)) {
                    importErrors.push(`Row ${i + 2}: Invalid Drinking Window Start Year "${row.drinkingwindowstartyear}". Skipped.`);
                    continue;
                }
                if (wineData.drinkingWindowEndYear && isNaN(wineData.drinkingWindowEndYear)) {
                    importErrors.push(`Row ${i + 2}: Invalid Drinking Window End Year "${row.drinkingwindowendyear}". Skipped.`);
                    continue;
                }
                if (wineData.drinkingWindowStartYear && wineData.drinkingWindowEndYear && wineData.drinkingWindowStartYear > wineData.drinkingWindowEndYear) {
                    importErrors.push(`Row ${i + 2}: Drinking Window Start Year (${wineData.drinkingWindowStartYear}) cannot be after End Year (${wineData.drinkingWindowEndYear}). Skipped.`);
                    continue;
                }


                const trimmedLocation = wineData.location.trim().toLowerCase();
                if (currentCellarLocations.includes(trimmedLocation) || locationsInCsv.has(trimmedLocation)) {
                    importErrors.push(`Row ${i + 2}: Location "${wineData.location}" is already in use. Skipped.`);
                    continue;
                }
                
                locationsInCsv.add(trimmedLocation);
                winesToImport.push({ ...wineData, addedAt: Timestamp.now() });
            }

            if (winesToImport.length > 0) {
                try {
                    const batch = writeBatch(db);
                    const winesCollectionPath = `artifacts/${appId}/users/${userId}/wines`;
                    
                    winesToImport.forEach(wineDoc => {
                        const newWineRef = doc(collection(db, winesCollectionPath));
                        batch.set(newWineRef, wineDoc);
                    });
                    await batch.commit();
                    
                    let successMsg = `${winesToImport.length} wine(s) imported successfully.`;
                    if(importErrors.length > 0) {
                        successMsg += ` ${importErrors.length} row(s) had errors.`;
                    }
                    setCsvImportStatus({ message: successMsg, type: 'success', errors: importErrors });

                } catch (dbError) {
                    console.error("Database error during import:", dbError);
                    setCsvImportStatus({ message: `Database error during import: ${dbError.message}`, type: 'error', errors: importErrors });
                }
            } else {
                 let noImportMsg = 'No wines were imported.';
                 if(importErrors.length > 0) noImportMsg += ` ${importErrors.length} row(s) had errors.`
                 else if(parsedData.length === 0) noImportMsg = 'CSV file is empty or has no data rows.'
                 else noImportMsg = 'All rows in CSV had errors or were duplicates.'

                setCsvImportStatus({ message: noImportMsg, type: importErrors.length > 0 ? 'warning' : 'info', errors: [] });
            }
            setIsImportingCsv(false);
            setCsvFile(null); 
            if (document.getElementById('csvFileInput')) { 
                document.getElementById('csvFileInput').value = "";
            }
        };

        reader.onerror = () => {
            console.error("Error reading CSV file:", reader.error);
            setCsvImportStatus({ message: 'Failed to read the CSV file.', type: 'error', errors: [] });
            setIsImportingCsv(false);
        };
        reader.readAsText(csvFile);
    }, [csvFile, db, userId, appId, wines]); 

    const exportCurrentCellar = useCallback(() => {
        exportToCsv(wines, 'my_wine_cellar', null, false);
        setGlobalError(null); 
    }, [wines]);

    const exportExperiencedWines = useCallback(() => {
        exportToCsv(experiencedWines, 'my_experienced_wine_cellar', null, true);
        setGlobalError(null); 
    }, [experiencedWines]);


    // --- Call initial auth logic on component mount ---
    useEffect(() => {
        if (auth && !user && isAuthReady && !isLoadingAuth) {
            performInitialAuth();
        }
    }, [auth, user, isAuthReady, isLoadingAuth, performInitialAuth]);


    // --- Render Logic ---
    if (!isAuthReady || isLoadingData || isLoadingAuth) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200">
                Loading application...
            </div>
        );
    }
    
    if (dataError) { 
         return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
                <AlertMessage message={dataError} type="error" onDismiss={() => setGlobalError(null)} />
                <p className="text-slate-600 dark:text-slate-400 mt-2">Please ensure the application is correctly configured and Firebase is reachable.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 md:p-8 transition-colors duration-300">
            <header className="mb-6">
                <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
                    <div className="flex items-center space-x-2 mb-4 sm:mb-0">
                        <WineBottleIcon className="w-10 h-10 text-red-700 dark:text-red-500" />
                        <h1 className="text-3xl font-bold text-slate-700 dark:text-slate-100">My Wine Cellar</h1>
                    </div>
                    {user ? (
                        <div className="flex items-center space-x-3">
                            <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center" title={`User ID: ${userId}`}>
                                <UserIcon className="w-4 h-4 mr-1" />
                                {user.isAnonymous ? `Guest (ID: ${userId ? userId.substring(0,8) : 'N/A'}...)` : (user.email || `User (ID: ${userId ? userId.substring(0,8) : 'N/A'}...)`)}
                            </span>
                            <button
                                onClick={logout} 
                                className="p-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm flex items-center space-x-1"
                            >
                                <LogoutIcon className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowLoginModal(true)}
                                className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-semibold"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => setShowRegisterModal(true)}
                                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                            >
                                Register
                            </button>
                        </div>
                    )}
                </div>
                 {/* Display global errors */}
                 {currentDisplayError && <AlertMessage message={currentDisplayError} type="error" onDismiss={() => { setGlobalError(null); if (setFoodPairingError) setFoodPairingError(null); }} />}
            </header>

            <main className="container mx-auto">
                {!user && isAuthReady && !currentDisplayError && (
                     <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow">
                        <p className="text-lg mb-4">Please Login or Register to manage your wine cellar.</p>
                        <div className="flex justify-center items-center space-x-3 mt-4">
                            <button
                                onClick={() => setShowLoginModal(true)}
                                className="px-6 py-3 rounded-md bg-green-600 hover:bg-green-700 text-white text-lg font-semibold"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => setShowRegisterModal(true)}
                                className="px-6 py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold"
                            >
                                Register
                            </button>
                        </div>
                    </div>
                )}
                {/* Conditionally render content only if user is logged in */}
                {user && (
                    <>
                        {/* Navigation Menu */}
                        <nav className="mb-6 p-2 bg-white dark:bg-slate-800 rounded-lg shadow flex justify-around sm:justify-start space-x-2 sm:space-x-4 overflow-x-auto">
                            <button
                                onClick={() => setCurrentView('myCellar')}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                                    currentView === 'myCellar' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                                }`}
                            >
                                <CellarIcon className="w-5 h-5" />
                                <span>My Cellar</span>
                            </button>
                            <button
                                onClick={() => setCurrentView('drinkSoon')}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                                    currentView === 'drinkSoon' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                                }`}
                            >
                                <ClockIcon className="w-5 h-5" />
                                <span>Drink Soon</span>
                            </button>
                            <button
                                onClick={() => setCurrentView('foodPairing')}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                                    currentView === 'foodPairing' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                                }`}
                            >
                                <FoodIcon className="w-5 h-5" />
                                <span>Food Pairing</span>
                            </button>
                            <button
                                onClick={() => setCurrentView('importWines')}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                                    currentView === 'importWines' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                                }`}
                            >
                                <UploadIcon className="w-5 h-5" />
                                <span>Import/Export</span>
                            </button>
                            <button
                                onClick={() => setCurrentView('experiencedWines')}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                                    currentView === 'experiencedWines' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                                }`}
                            >
                                <CheckCircleIcon className="w-5 h-5" />
                                <span>Experienced Wines</span>
                            </button>
                        </nav>

                        {/* Conditional Rendering of Views */}
                        {currentView === 'myCellar' && (
                            <CellarView
                                wines={wines}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                handleOpenWineForm={handleOpenWineForm}
                                confirmExperienceWine={confirmExperienceWine}
                                handleOpenFoodPairing={handleOpenFoodPairing}
                                isLoadingWines={isLoadingData} 
                                user={user}
                                confirmDeleteWinePermanently={confirmDeleteWinePermanently} // Pass down the confirm function
                            />
                        )}

                        {currentView === 'drinkSoon' && (
                            <DrinkSoonView
                                winesApproachingEnd={winesApproachingEnd} // Use the unconditionally defined memoized value
                                handleOpenWineForm={handleOpenWineForm}
                                confirmExperienceWine={confirmExperienceWine}
                                handleOpenFoodPairing={handleOpenFoodPairing}
                            />
                        )}

                        {currentView === 'foodPairing' && (
                            <FoodPairingView
                                foodForReversePairing={foodForReversePairing}
                                setFoodForReversePairing={setFoodForReversePairing} 
                                handleFindWineForFood={() => { // Modified to show ReverseFoodPairingModal
                                    findWineForFood(foodForReversePairing, wines);
                                    setShowReversePairingModal(true); // Open the modal
                                }} 
                                isLoadingReversePairing={isLoadingPairing}
                                wines={wines}
                            />
                        )}

                        {currentView === 'importWines' && (
                            <ImportExportView
                                csvFile={csvFile}
                                handleCsvFileChange={handleCsvFileChange}
                                handleImportCsv={importCsvData} 
                                isImportingCsv={isImportingCsv}
                                csvImportStatus={csvImportStatus}
                                handleExportCsv={exportCurrentCellar} 
                                wines={wines}
                                handleExportExperiencedCsv={exportExperiencedWines} 
                                experiencedWines={experiencedWines}
                                confirmEraseAllWines={() => setShowEraseAllConfirmModal(true)} 
                                setCsvImportStatus={setCsvImportStatus} // Pass setCsvImportStatus as prop
                            />
                        )}

                        {currentView === 'experiencedWines' && (
                            <ExperiencedWinesView
                                experiencedWines={experiencedWines}
                                confirmDeleteExperiencedWine={confirmDeleteExperiencedWine} // Pass down the confirm function
                            />
                        )}
                    </>
                )}

                {/* Modals (remain outside conditional rendering to be accessible from all views) */}
                <WineFormModal isOpen={showWineFormModal} onClose={() => { setShowWineFormModal(false); setCurrentWineToEdit(null); }} onSubmit={currentWineToEdit ? (data) => handleUpdateWine(currentWineToEdit.id, data, wines) : (data) => handleAddWine(data, wines)} wine={currentWineToEdit} allWines={wines} />
                <FoodPairingModal isOpen={showFoodPairingModal} onClose={() => setShowFoodPairingModal(false)} wine={selectedWineForPairing} suggestion={foodPairingSuggestion} isLoading={isLoadingPairing} onFetchPairing={() => fetchFoodPairing(selectedWineForPairing)} />
                <ReverseFoodPairingModal isOpen={showReversePairingModal} onClose={() => setShowReversePairingModal(false)} foodItem={foodForReversePairing} suggestion={foodPairingSuggestion} isLoading={isLoadingPairing} />
                
                {/* Delete Active Wine Confirmation Modal */}
                <Modal isOpen={showDeleteConfirmModal} onClose={() => setShowDeleteConfirmModal(false)} title="Confirm Permanent Deletion">
                    <p className="text-slate-700 dark:text-slate-300 mb-4">
                        Are you sure you want to **permanently delete** the wine: <strong className="font-semibold">{wineToDelete?.name || wineToDelete?.producer} ({wineToDelete?.year || 'N/A'})</strong>? This action cannot be undone and it will not be moved to "Experienced Wines".
                    </p>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setShowDeleteConfirmModal(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-md border border-slate-300 dark:border-slate-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleActualDeleteWinePermanently} 
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm"
                        >
                            Delete Permanently
                        </button>
                    </div>
                </Modal>

                <ExperienceWineModal
                    isOpen={showExperienceWineModal}
                    onClose={() => setShowExperienceWineModal(false)}
                    wine={wineToExperience}
                    onExperience={(id, notes, rating, date) => handleExperienceWine(id, notes, rating, date, wines)} 
                />

                {/* Erase All Wines Confirmation Modal */}
                <Modal isOpen={showEraseAllConfirmModal} onClose={() => setShowEraseAllConfirmModal(false)} title="Confirm Erase All Wines">
                    <p className="text-red-700 dark:text-red-300 mb-4 font-bold">
                        DANGER ZONE: This action will permanently delete ALL wines from your active cellar. This includes any tasting notes and associated data. This cannot be undone.
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 mb-4">
                        Are you absolutely sure you want to proceed?
                    </p>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setShowEraseAllConfirmModal(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-md border border-slate-300 dark:border-slate-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleEraseAllWines}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm"
                        >
                            Confirm Erase All
                        </button>
                    </div>
                </Modal>
                
                {/* Delete Experienced Wine Confirmation Modal */}
                <Modal isOpen={showDeleteExperiencedConfirmModal} onClose={() => setShowDeleteExperiencedConfirmModal(false)} title="Confirm Delete Experienced Wine">
                    <p className="text-slate-700 dark:text-slate-300 mb-4">
                        Are you sure you want to **permanently delete** this experienced wine entry: <strong className="font-semibold">{experiencedWineToDelete?.name || experiencedWineToDelete?.producer} ({experiencedWineToDelete?.year || 'N/A'})</strong>? This action cannot be undone.
                    </p>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setShowDeleteExperiencedConfirmModal(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-md border border-slate-300 dark:border-slate-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleActualDeleteExperiencedWine} 
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm"
                        >
                            Delete Permanently
                        </button>
                    </div>
                </Modal>

                <AuthModal
                    isOpen={showLoginModal}
                    onClose={() => setShowLoginModal(false)}
                    isRegister={false}
                    auth={auth} 
                    onAuthSuccess={() => setShowLoginModal(false)}
                    setError={(msg) => { setGlobalError(msg); setFoodPairingError(null); }} 
                />
                <AuthModal
                    isOpen={showRegisterModal}
                    onClose={() => setShowRegisterModal(false)}
                    isRegister={true}
                    auth={auth} 
                    onAuthSuccess={() => setShowRegisterModal(false)}
                    setError={(msg) => { setGlobalError(msg); setFoodPairingError(null); }} 
                />
            </main>
            <footer className="text-center mt-12 py-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Wine Cellar App &copy; {new Date().getFullYear()}
                </p>
            </footer>
        </div>
    );
}

export default App;