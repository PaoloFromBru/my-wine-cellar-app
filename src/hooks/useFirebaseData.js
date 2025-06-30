import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    query,
    onSnapshot,
    Timestamp,
    setLogLevel
} from 'firebase/firestore';

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

export const useFirebaseData = () => {
    const [auth, setAuthInstance] = useState(null);
    const [db, setDbInstance] = useState(null);
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [wines, setWines] = useState([]);
    const [experiencedWines, setExperiencedWines] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [dataError, setDataError] = useState(null);

    useEffect(() => {
        if (Object.keys(firebaseConfig).length === 0) {
            setDataError("Firebase configuration is missing. Please contact support.");
            setIsAuthReady(true);
            return;
        }
        try {
            const app = initializeApp(firebaseConfig);
            const authInstance = getAuth(app);
            const dbInstance = getFirestore(app);
            setLogLevel('debug'); // Keep debug logging

            setAuthInstance(authInstance);
            setDbInstance(dbInstance);

			const unsubscribeAuth = onAuthStateChanged(authInstance, (firebaseUser) => {
			                if (firebaseUser) {
			                    setUser(firebaseUser);
			                    setUserId(firebaseUser.uid);
			                    console.log("DEBUG: Firebase user authenticated. UID:", firebaseUser.uid); // Add this line
			                    setDataError(null);
			                } else {
			                    setUser(null);
			                    setUserId(null);
			                    setWines([]); // Clear wines on logout/no user
			                    setExperiencedWines([]); // Clear experienced wines on logout/no user
			                    console.log("DEBUG: No Firebase user authenticated."); // Add this line
			                }
			                setIsAuthReady(true);
			            });
						return () => unsubscribeAuth();
        } catch (e) {
            console.error("Error initializing Firebase:", e);
            setDataError("Could not initialize Firebase. Some features may not work.");
            setIsAuthReady(true);
        }
    }, []);

    useEffect(() => {
        if (!db || !userId) {
            setWines([]);
            setExperiencedWines([]);
            setIsLoadingData(false); // No data to load if no db/user
            return;
        }

        setIsLoadingData(true);
        setDataError(null);

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
            setDataError(null);
        }, (err) => {
            console.error("Error fetching wines via onSnapshot:", err);
            setDataError(`Failed to fetch wines: ${err.message}.`);
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
            setDataError(null);
        }, (err) => {
            console.error("Error fetching experienced wines via onSnapshot:", err);
            // Don't set global dataError for this if main wines still loaded
            setExperiencedWines([]);
        });

        setIsLoadingData(false);

        return () => {
            unsubscribeWines();
            unsubscribeExperiencedWines();
        };
    }, [db, userId, isAuthReady]);

    return {
        auth, db, user, userId, isAuthReady,
        wines, experiencedWines,
        isLoadingData, dataError,
        appId // Export appId for use in data operations
    };
};
