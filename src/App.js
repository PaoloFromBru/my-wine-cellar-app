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

// Import modularized components
import Modal from './components/Modal';
import AlertMessage from './components/AlertMessage';
import AuthModal from './components/AuthModal';
import WineFormModal from './components/WineFormModal';
import FoodPairingModal from './components/FoodPairingModal';
import ReverseFoodPairingModal from './components/ReverseFoodPairingModal';
import ExperienceWineModal from './components/ExperienceWineModal'; // Ensure this is correctly imported


// Import new modularized views
import CellarView from './views/CellarView';
import DrinkSoonView from './views/DrinkSoonView';
import FoodPairingView from './views/FoodPairingView';
import ImportExportView from './views/ImportExportView';
import ExperiencedWinesView from './views/ExperiencedWinesView';


// --- Icons (kept here as they are small, but can be further modularized) ---
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
    const [auth, setAuthInstance] = useState(null); 
    const [db, setDbInstance] = useState(null); 
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [wines, setWines] = useState([]);
    const [experiencedWines, setExperiencedWines] = useState([]); 
    const [isLoadingWines, setIsLoadingWines] = useState(true);
    const [error, setError] = useState(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    
    const [showWineFormModal, setShowWineFormModal] = useState(false);
    const [currentWineToEdit, setCurrentWineToEdit] = useState(null);

    const [showFoodPairingModal, setShowFoodPairingModal] = useState(false);
    const [selectedWineForPairing, setSelectedWineForPairing] = useState(null);
    const [foodPairingSuggestion, setFoodPairingSuggestion] = useState('');
    const [isLoadingPairing, setIsLoadingPairing] = useState(false);

    const [foodForReversePairing, setFoodForReversePairing] = useState('');
    const [reversePairingResult, setReversePairingResult] = useState('');
    const [isLoadingReversePairing, setIsLoadingReversePairing] = useState(false);
    const [showReversePairingModal, setShowReversePairingModal] = useState(false);

    const [csvFile, setCsvFile] = useState(null);
    const [isImportingCsv, setIsImportingCsv] = useState(false);
    const [csvImportStatus, setCsvImportStatus] = useState({ message: '', type: '', errors: [] });

    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    const [currentView, setCurrentView] = useState('myCellar'); 

    const [showExperienceWineModal, setShowExperienceWineModal] = useState(false);
    const [wineToExperience, setWineToExperience] = useState(null);

    const [showEraseAllConfirmModal, setShowEraseAllConfirmModal] = useState(false);

    const [showDeleteExperiencedConfirmModal, setShowDeleteExperiencedConfirmModal] = useState(false);
    const [experiencedWineToDelete, setExperiencedWineToDelete] = useState(null);


    useEffect(() => {
        if (Object.keys(firebaseConfig).length === 0) {
            setError("Firebase configuration is missing. Please contact support.");
            setIsAuthReady(true); 
            return;
        }
        try {
            const app = initializeApp(firebaseConfig);
            const authInstance = getAuth(app);
            const dbInstance = getFirestore(app);
            setLogLevel('debug'); 

            setAuthInstance(authInstance);
            setDbInstance(dbInstance);

            const unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser) => {
                if (firebaseUser) {
                    setUser(firebaseUser);
                    setUserId(firebaseUser.uid);
                    setError(null); 
                } else {
                    setUser(null);
                    setUserId(null);
                }
                setIsAuthReady(true);
            });
            return () => unsubscribe();
        } catch (e) {
            console.error("Error initializing Firebase:", e);
            setError("Could not initialize Firebase. Some features may not work.");
            setIsAuthReady(true); 
        }
    }, []);

    useEffect(() => {
        if (!db || !userId || !isAuthReady) {
            setIsLoadingWines(isAuthReady && (!db || !userId)); 
            return;
        }
        
        setIsLoadingWines(true);
        const winesCollectionPath = `artifacts/${appId}/users/${userId}/wines`;
        const experiencedWinesCollectionPath = `artifacts/${appId}/users/${userId}/experiencedWines`;

        const unsubscribeWines = onSnapshot(query(collection(db, winesCollectionPath)), (querySnapshot) => {
            const winesData = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            winesData.sort((a, b) => {
                const producerCompare = (a.producer || "").localeCompare(b.producer || "");
                if (producerCompare !== 0) return producerCompare;
                return (a.year || 0) - (b.year || 0);
            });
            setWines(winesData);
            setError(null); 
        }, (err) => {
            console.error("Error fetching wines:", err);
            setError(`Failed to fetch wines: ${err.message}. Check Firestore rules & connectivity.`);
            setWines([]); 
        });

        const unsubscribeExperiencedWines = onSnapshot(query(collection(db, experiencedWinesCollectionPath)), (querySnapshot) => {
            const experiencedWinesData = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            experiencedWinesData.sort((a, b) => {
                const dateA = a.consumedAt instanceof Timestamp ? a.consumedAt.toDate() : new Date(a.consumedAt);
                const dateB = b.consumedAt instanceof Timestamp ? b.consumedAt.toDate() : new Date(b.consumedAt);
                return dateB - dateA; 
            });
            setExperiencedWines(experiencedWinesData);
        }, (err) => {
            console.error("Error fetching experienced wines:", err);
            setExperiencedWines([]); 
        });

        setIsLoadingWines(false);
        
        return () => {
            unsubscribeWines();
            unsubscribeExperiencedWines();
        };
    }, [db, userId, isAuthReady]);

    const handleAddWine = async (wineData) => {
        if (!db || !userId) { setError("Database not ready or user not logged in."); return; }
        try {
            const winesCollectionPath = `artifacts/${appId}/users/${userId}/wines`;
            await addDoc(collection(db, winesCollectionPath), {
                ...wineData, 
                year: wineData.year ? parseInt(wineData.year, 10) : null, 
                drinkingWindowStartYear: wineData.drinkingWindowStartYear ? parseInt(wineData.drinkingWindowStartYear, 10) : null,
                drinkingWindowEndYear: wineData.drinkingWindowEndYear ? parseInt(wineData.drinkingWindowEndYear, 10) : null,
                addedAt: Timestamp.now(),
            });
            setShowWineFormModal(false); setCurrentWineToEdit(null); setError(null); 
        } catch (err) { console.error("Error adding wine:", err); setError(`Failed to add wine: ${err.message}`); }
    };

    const handleUpdateWine = async (wineIdToUpdate, wineData) => { 
        if (!db || !userId) { setError("Database not ready or user not logged in."); return; }
        try {
            const wineDocRef = doc(db, `artifacts/${appId}/users/${userId}/wines`, wineIdToUpdate);
            await updateDoc(wineDocRef, { 
                ...wineData, 
                year: wineData.year ? parseInt(wineData.year, 10) : null,
                drinkingWindowStartYear: wineData.drinkingWindowStartYear ? parseInt(wineData.drinkingWindowStartYear, 10) : null,
                drinkingWindowEndYear: wineData.drinkingWindowEndYear ? parseInt(wineData.drinkingWindowEndYear, 10) : null,
            });
            setShowWineFormModal(false); setCurrentWineToEdit(null); setError(null);
        } catch (err) { console.error("Error updating wine:", err); setError(`Failed to update wine: ${err.message}`); }
    };

    const handleExperienceWine = async (wineId, notes, rating, consumedDate) => {
        if (!db || !userId) { setError("Database not ready or user not logged in."); return; }
        const wineToMove = wines.find(w => w.id === wineId);
        if (!wineToMove) {
            setError("Wine not found in current cellar to experience.");
            return;
        }

        try {
            const batch = writeBatch(db);
            const wineDocRef = doc(db, `artifacts/${appId}/users/${userId}/wines`, wineId);
            const experiencedWineCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/experiencedWines`);
            
            await addDoc(experiencedWineCollectionRef, {
                ...wineToMove,
                tastingNotes: notes,
                rating: rating,
                consumedAt: consumedDate ? Timestamp.fromDate(new Date(consumedDate)) : Timestamp.now(),
                experiencedAt: Timestamp.now(), 
            });

            await deleteDoc(wineDocRef);

            setError(null);
            setShowExperienceWineModal(false);
            setWineToExperience(null);
        } catch (err) {
            console.error("Error experiencing wine:", err);
            setError(`Failed to experience wine: ${err.message}`);
        }
    };

    const confirmExperienceWine = (wineId) => {
        const wine = wines.find(w => w.id === wineId);
        setWineToExperience(wine);
        setShowExperienceWineModal(true);
    };

    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [wineToDelete, setWineToDelete] = useState(null);

    const confirmDeleteWinePermanently = (wineId) => { 
        const wine = wines.find(w => w.id === wineId);
        setWineToDelete(wine);
        setShowDeleteConfirmModal(true);
    };

    const handleDeleteWinePermanently = async () => { 
        if (!db || !userId || !wineToDelete) {
            setError("Database error or no wine selected for deletion.");
            setShowDeleteConfirmModal(false); return;
        }
        try {
            const wineDocRef = doc(db, `artifacts/${appId}/users/${userId}/wines`, wineToDelete.id);
            await deleteDoc(wineDocRef);
            setError(null); setShowDeleteConfirmModal(false); setWineToDelete(null);
        } catch (err) { console.error("Error deleting wine:", err); setError(`Failed to delete wine: ${err.message}`); setShowDeleteConfirmModal(false); }
    };

    const confirmDeleteExperiencedWine = (wineId) => {
        const wine = experiencedWines.find(w => w.id === wineId);
        setExperiencedWineToDelete(wine);
        setShowDeleteExperiencedConfirmModal(true);
    };

    const handleDeleteExperiencedWine = async () => {
        if (!db || !userId || !experiencedWineToDelete) {
            setError("Database error or no experienced wine selected for deletion.");
            setShowDeleteExperiencedConfirmModal(false);
            return;
        }
        console.log("DEBUG: Attempting to delete experienced wine with ID:", experiencedWineToDelete.id); 
        try {
            const experiencedWineCollectionPath = `artifacts/${appId}/users/${userId}/experiencedWines`; 
            const experiencedWineDocRef = doc(db, experiencedWineCollectionPath, experiencedWineToDelete.id);
            await deleteDoc(experiencedWineDocRef);
            console.log("DEBUG: Experienced wine successfully deleted from Firestore:", experiencedWineToDelete.id); 
            setError(null); 
            setShowDeleteExperiencedConfirmModal(false); 
            setExperiencedWineToDelete(null);
        } catch (err) {
            console.error("DEBUG: Error deleting experienced wine from Firestore:", err.code, err.message); 
            setError(`Failed to delete experienced wine: ${err.message}. Check browser console for details (Code: ${err.code}).`);
            setShowDeleteExperiencedConfirmModal(false);
        }
    };


    const handleOpenWineForm = (wine = null) => { setCurrentWineToEdit(wine); setShowWineFormModal(true); };
    const handleOpenFoodPairing = (wine) => { setSelectedWineForPairing(wine); setFoodPairingSuggestion(''); setShowFoodPairingModal(true); };

    const fetchFoodPairing = async () => {
        if (!selectedWineForPairing) return;
        setIsLoadingPairing(true);
        setError(null);

        const { producer, year, region, color, name } = selectedWineForPairing;
        const wineDescription = `${name ? name + " " : ""}${producer} ${color} wine from ${region}, year ${year || 'N/A'}`;
        const prompt = `Suggest a specific food pairing for the following wine: ${wineDescription}. Provide a concise suggestion (1-2 sentences).`;

        let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = { contents: chatHistory };
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY || ""; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
            }
            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                setFoodPairingSuggestion(text);
            } else {
                setFoodPairingSuggestion("Could not retrieve a pairing suggestion at this time (unexpected AI response).");
            }
        } catch (err) {
            console.error("Error fetching food pairing:", err);
            setError(prevError => prevError || `Food pairing suggestion failed: ${err.message}`);
            setFoodPairingSuggestion(`Failed to get suggestion: ${err.message}`);
        } finally {
            setIsLoadingPairing(false);
        }
    };

    const handleFindWineForFood = async () => {
        if (!foodForReversePairing.trim()) {
            setError("Please enter a food item to find a wine pairing.");
            return;
        }
        if (wines.length === 0) {
            setError("Your cellar is empty. Add some wines first to find a pairing.");
            return;
        }

        setIsLoadingReversePairing(true);
        setError(null);
        setReversePairingResult('');

        const wineListForPrompt = wines.map((wine, index) => 
            `${index + 1}. Name: ${wine.name || 'N/A'}, Producer: ${wine.producer}, Color: ${wine.color}, Region: ${wine.region}, Year: ${wine.year || 'N/A'}`
        ).join('\n');

        const prompt = `I want to eat "${foodForReversePairing}". From the following list of wines in my cellar, which one would be the BEST match? Also, list up to two other good alternatives if any. For each suggested wine, briefly explain your choice. If no wines are a good match, please state that.
My wines are:
${wineListForPrompt}`;
        
        let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = { contents: chatHistory };
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY || ""; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
            }
            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                setReversePairingResult(text);
            } else {
                setReversePairingResult("Could not get a wine suggestion at this time (unexpected AI response).");
            }
        } catch (err) {
            console.error("Error finding wine for food:", err);
            setError(prevError => prevError || `Finding wine for food failed: ${err.message}`);
            setReversePairingResult(`Failed to get suggestion: ${err.message}`);
        } finally {
            setIsLoadingReversePairing(false);
            setShowReversePairingModal(true);
        }
    };


    const handleLogout = async () => {
        if (auth) {
            try { await signOut(auth); setUser(null); setUserId(null); setWines([]); setExperiencedWines([]); } 
            catch (e) { console.error("Logout failed: ", e); setError("Logout failed. Please try again."); }
        }
    };
    
    // --- CSV IMPORT LOGIC ---
    const handleCsvFileChange = (event) => {
        setCsvFile(event.target.files[0]);
        setCsvImportStatus({ message: '', type: '', errors: [] }); 
    };

    const parseCsv = (csvText) => {
        // Remove Byte Order Mark (BOM) if present
        if (csvText.charCodeAt(0) === 0xFEFF) {
            csvText = csvText.substring(1);
        }

        const lines = csvText.split(/\r\n|\n/); 
        if (lines.length < 2) return { headers: [], data: [] }; 

        // Modified parseLine to handle semicolon delimiter
        const parseLine = (line) => {
            const result = [];
            let currentField = '';
            let inQuotes = false;
            // Iterate through the line character by character
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') { // Handle quotes for fields containing delimiters
                    inQuotes = !inQuotes;
                } else if (char === ';' && !inQuotes) { // Use semicolon as delimiter
                    result.push(currentField.trim());
                    currentField = '';
                } else {
                    currentField += char;
                }
            }
            result.push(currentField.trim()); // Add the last field
            return result;
        };
        
        const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) { 
            if (lines[i].trim() === '') continue; 
            const values = parseLine(lines[i]);
            const rowObject = {};
            headers.forEach((header, index) => {
                rowObject[header] = values[index] ? values[index].trim() : ''; 
            });
            data.push(rowObject);
        }
        return { headers, data };
    };


    const handleImportCsv = async () => {
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
    };

    // --- End CSV Import ---

    // --- Export Wines to CSV ---
    const handleExportCsv = () => {
        if (wines.length === 0) {
            setError("No wines in your cellar to export.");
            return;
        }

        const headers = ["Name", "Producer", "Year", "Region", "Color", "Location", "DrinkingWindowStartYear", "DrinkingWindowEndYear"];
        // Escape content with double quotes and handle semicolons
        const escapeCsvField = (field) => {
            if (field === null || field === undefined) return '';
            let value = String(field);
            if (value.includes(';') || value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        };

        const csvRows = [
            headers.join(';') // Use semicolon as delimiter
        ];

        wines.forEach(wine => {
            const row = [
                escapeCsvField(wine.name),
                escapeCsvField(wine.producer),
                escapeCsvField(wine.year),
                escapeCsvField(wine.region),
                escapeCsvField(wine.color),
                escapeCsvField(wine.location),
                escapeCsvField(wine.drinkingWindowStartYear),
                escapeCsvField(wine.drinkingWindowEndYear)
            ];
            csvRows.push(row.join(';'));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `my_wine_cellar_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        setError(null);
    };

    // --- Export Experienced Wines to CSV (NEW) ---
    const handleExportExperiencedCsv = () => {
        if (experiencedWines.length === 0) {
            setError("No experienced wines to export.");
            return;
        }

        const headers = ["Name", "Producer", "Year", "Region", "Color", "Location", "DrinkingWindowStartYear", "DrinkingWindowEndYear", "ConsumedAt", "Rating", "TastingNotes"];
        // Escape content with double quotes and handle semicolons
        const escapeCsvField = (field) => {
            if (field === null || field === undefined) return '';
            let value = String(field);
            if (value.includes(';') || value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        };

        const csvRows = [
            headers.join(';') // Use semicolon as delimiter
        ];

        experiencedWines.forEach(wine => {
            const row = [
                escapeCsvField(wine.name),
                escapeCsvField(wine.producer),
                escapeCsvField(wine.year),
                escapeCsvField(wine.region),
                escapeCsvField(wine.color),
                escapeCsvField(wine.location),
                escapeCsvField(wine.drinkingWindowStartYear),
                escapeCsvField(wine.drinkingWindowEndYear),
                escapeCsvField(wine.consumedAt ? (wine.consumedAt instanceof Timestamp ? wine.consumedAt.toDate().toISOString().slice(0, 10) : new Date(wine.consumedAt).toISOString().slice(0, 10)) : ''),
                escapeCsvField(wine.rating),
                escapeCsvField(wine.tastingNotes)
            ];
            csvRows.push(row.join(';'));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `my_experienced_wine_cellar_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        setError(null);
    };


    // --- Erase All Wines ---
    const confirmEraseAllWines = () => {
        if (wines.length === 0) {
            setError("Your cellar is already empty!");
            return;
        }
        setShowEraseAllConfirmModal(true);
    };

    const handleEraseAllWines = async () => {
        if (!db || !userId) {
            setError("Database not ready or user not logged in.");
            setShowEraseAllConfirmModal(false);
            return;
        }
        try {
            const winesCollectionPath = `artifacts/${appId}/users/${userId}/wines`;
            const q = query(collection(db, winesCollectionPath));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError("Your cellar is already empty!");
                setShowEraseAllConfirmModal(false);
                return;
            }

            const batch = writeBatch(db);
            querySnapshot.forEach((docSnap) => {
                batch.delete(doc(db, `artifacts/${appId}/users/${userId}/wines`, docSnap.id));
            });
            await batch.commit();
            
            setError({message: "All wines have been successfully erased from your cellar.", type: 'success'}); // Use object for success type
            setShowEraseAllConfirmModal(false);
        } catch (err) {
            console.error("Error erasing all wines:", err);
            setError(`Failed to erase all wines: ${err.message}`);
            setShowEraseAllConfirmModal(false);
        }
    };


    const getWinesApproachingEndOfWindow = useCallback(() => {
        const currentYear = new Date().getFullYear();
        const winesToConsider = [];

        wines.forEach(wine => {
            const startYear = wine.drinkingWindowStartYear;
            const endYear = wine.drinkingWindowEndYear;

            if (startYear && endYear) {
                // Rule 1: Wine is past its drinking window (endYear < currentYear)
                if (endYear < currentYear) { 
                    winesToConsider.push({ ...wine, drinkingStatus: 'Drink Window Closed' });
                }
                // Rule 2: Wine's drinking window ends THIS YEAR (endYear === currentYear)
                else if (endYear === currentYear) { 
                    winesToConsider.push({ ...wine, drinkingStatus: 'Drink Soon (This Year)' });
                }
            }
        });
        
        // Sort: First by drinking status (Closed first, then This Year), then by End Year (earliest first)
        return winesToConsider.sort((a, b) => {
            const statusOrder = { 'Drink Window Closed': 1, 'Drink Soon (This Year)': 2 };
            const statusCompare = statusOrder[a.drinkingStatus] - statusOrder[b.drinkingStatus];
            if (statusCompare !== 0) return statusCompare;
            
            return (a.drinkingWindowEndYear || Infinity) - (b.drinkingWindowEndYear || Infinity);
        });
    }, [wines]);

    const winesApproachingEnd = useMemo(() => getWinesApproachingEndOfWindow(), [wines, getWinesApproachingEndOfWindow]);


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

    if (!isAuthReady) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200">
                Loading authentication...
            </div>
        );
    }
    
    if (Object.keys(firebaseConfig).length === 0 && error && !auth) { 
         return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
                <AlertMessage message={error} type="error" onDismiss={() => setError(null)} />
                <p className="text-slate-600 dark:text-slate-400 mt-2">Please ensure the application is correctly configured.</p>
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
                                onClick={handleLogout}
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
                 {error && <AlertMessage message={error} type="error" onDismiss={() => setError(null)} />}
            </header>

            <main className="container mx-auto">
                {!user && isAuthReady && !error && (
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
                                isLoadingWines={isLoadingWines}
                                user={user}
                            />
                        )}

                        {currentView === 'drinkSoon' && (
                            <DrinkSoonView
                                winesApproachingEnd={useMemo(() => {
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
                                }, [wines])}
                                handleOpenWineForm={handleOpenWineForm}
                                confirmExperienceWine={confirmExperienceWine}
                                handleOpenFoodPairing={handleOpenFoodPairing}
                            />
                        )}

                        {currentView === 'foodPairing' && (
                            <FoodPairingView
                                foodForReversePairing={foodForReversePairing}
                                setFoodForReversePairing={setFoodForReversePairing}
                                handleFindWineForFood={handleFindWineForFood}
                                isLoadingReversePairing={isLoadingReversePairing}
                                wines={wines}
                                handleOpenFoodPairing={handleOpenFoodPairing} 
                            />
                        )}

                        {currentView === 'importWines' && (
                            <ImportExportView
                                csvFile={csvFile}
                                handleCsvFileChange={handleCsvFileChange}
                                handleImportCsv={handleImportCsv}
                                isImportingCsv={isImportingCsv}
                                csvImportStatus={csvImportStatus}
                                handleExportCsv={handleExportCsv}
                                wines={wines}
                                handleExportExperiencedCsv={handleExportExperiencedCsv}
                                experiencedWines={experiencedWines}
                                confirmEraseAllWines={confirmEraseAllWines}
                            />
                        )}

                        {currentView === 'experiencedWines' && (
                            <ExperiencedWinesView
                                experiencedWines={experiencedWines}
                                confirmDeleteExperiencedWine={confirmDeleteExperiencedWine}
                            />
                        )}
                    </>
                )}

                {/* Modals (remain outside conditional rendering to be accessible from all views) */}
                <WineFormModal isOpen={showWineFormModal} onClose={() => { setShowWineFormModal(false); setCurrentWineToEdit(null); }} onSubmit={currentWineToEdit ? (data) => handleUpdateWine(currentWineToEdit.id, data) : handleAddWine} wine={currentWineToEdit} allWines={wines} />
                <FoodPairingModal isOpen={showFoodPairingModal} onClose={() => setShowFoodPairingModal(false)} wine={selectedWineForPairing} suggestion={foodPairingSuggestion} isLoading={isLoadingPairing} onFetchPairing={fetchFoodPairing} />
                <ReverseFoodPairingModal isOpen={showReversePairingModal} onClose={() => setShowReversePairingModal(false)} foodItem={foodForReversePairing} suggestion={reversePairingResult} isLoading={isLoadingReversePairing} />
                
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
                            onClick={handleDeleteWinePermanently}
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
                    onExperience={handleExperienceWine}
                />

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
                            onClick={handleDeleteExperiencedWine}
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
                    setError={setError}
                />
                <AuthModal
                    isOpen={showRegisterModal}
                    onClose={() => setShowRegisterModal(false)}
                    isRegister={true}
                    auth={auth} 
                    onAuthSuccess={() => setShowLoginModal(false)}
                    setError={setError}
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