// src/hooks/useWineActions.js
import { useState } from 'react';
import {
    collection,
    addDoc,
    doc, // Make sure 'doc' is imported
    updateDoc,
    deleteDoc,
    Timestamp,
    writeBatch,
    getDocs,
    query,
    where,
    documentId
} from 'firebase/firestore';

export const useWineActions = (db, userId, appId, setError) => {
    const [isLoadingAction, setIsLoadingAction] = useState(false);
    const [actionError, setActionError] = useState(null);

    const winesCollectionPath = `artifacts/${appId}/users/${userId}/wines`;
    const experiencedWinesCollectionPath = `artifacts/${appId}/users/${userId}/experiencedWines`;

    const handleAddWine = async (wineData, allWines) => {
        if (!db || !userId) { setError("Database not ready or user not logged in."); return { success: false, error: "Database not ready or user not logged in." }; }
        setIsLoadingAction(true);
        setActionError(null);
        try {
            const isLocationTaken = allWines.some(
                w => w.location && w.location.trim().toLowerCase() === (wineData.location || '').trim().toLowerCase()
            );
            if (isLocationTaken) {
                setError(`Location "${wineData.location}" is already in use.`);
                return { success: false, error: `Location "${wineData.location}" is already in use.` };
            }

            await addDoc(collection(db, winesCollectionPath), {
                ...wineData, 
                year: wineData.year ? parseInt(wineData.year, 10) : null, 
                drinkingWindowStartYear: wineData.drinkingWindowStartYear ? parseInt(wineData.drinkingWindowStartYear, 10) : null,
                drinkingWindowEndYear: wineData.drinkingWindowEndYear ? parseInt(wineData.drinkingWindowEndYear, 10) : null,
                addedAt: Timestamp.now(),
            });
            return { success: true };
        } catch (err) { 
            console.error("Error adding wine:", err); 
            setError(`Failed to add wine: ${err.message}`); 
            return { success: false, error: err.message };
        } finally { setIsLoadingAction(false); }
    };

    const handleUpdateWine = async (wineIdToUpdate, wineData, allWines) => { 
        if (!db || !userId) { setError("Database not ready or user not logged in."); return { success: false, error: "Database not ready or user not logged in." }; }
        setIsLoadingAction(true);
        setActionError(null);
        try {
            const isLocationTaken = allWines.some(
                w => w.id !== wineIdToUpdate && w.location && w.location.trim().toLowerCase() === (wineData.location || '').trim().toLowerCase()
            );
            if (isLocationTaken) {
                setError(`Location "${wineData.location}" is already in use by another wine.`);
                return { success: false, error: `Location "${wineData.location}" is already in use.` };
            }

            const wineDocRef = doc(db, winesCollectionPath, wineIdToUpdate);
            await updateDoc(wineDocRef, { 
                ...wineData, 
                year: wineData.year ? parseInt(wineData.year, 10) : null,
                drinkingWindowStartYear: wineData.drinkingWindowStartYear ? parseInt(wineData.drinkingWindowStartYear, 10) : null,
                drinkingWindowEndYear: wineData.drinkingWindowEndYear ? parseInt(wineData.drinkingWindowEndYear, 10) : null,
            });
            return { success: true };
        } catch (err) { 
            console.error("Error updating wine:", err); 
            setError(`Failed to update wine: ${err.message}`); 
            return { success: false, error: err.message };
        } finally { setIsLoadingAction(false); }
    };

    const handleExperienceWine = async (wineToMoveId, notes, rating, consumedDate, allWines) => { 
        if (!db || !userId) { setError("Database not ready or user not logged in."); return { success: false, error: "Database not ready or user not logged in." }; }
        setIsLoadingAction(true);
        setActionError(null);

        const wineToMove = allWines.find(w => w.id === wineToMoveId);
        if (!wineToMove) {
            setError("Wine not found in current cellar to experience.");
            return { success: false, error: "Wine not found." };
        }

        try {
            const batch = writeBatch(db);
            const wineDocRef = doc(db, winesCollectionPath, wineToMoveId);
            
            // FIX START: Use the original wineToMoveId as the document ID for the experienced wine
            const experiencedWineDocRef = doc(db, experiencedWinesCollectionPath, wineToMoveId); 
            // FIX END

            // 1. Add to experienced wines collection (using the original ID)
            batch.set(experiencedWineDocRef, { // Changed from newExperiencedWineRef to experiencedWineDocRef
                ...wineToMove, 
                tastingNotes: notes,
                rating: rating,
                consumedAt: consumedDate ? Timestamp.fromDate(new Date(consumedDate)) : Timestamp.now(),
                experiencedAt: Timestamp.now(),
            });

            // 2. Delete from active wines collection
            batch.delete(wineDocRef);

            await batch.commit();
            return { success: true };
        } catch (err) {
            console.error("Error experiencing wine:", err);
            setError(`Failed to experience wine: ${err.message}`);
            return { success: false, error: err.message };
        } finally { setIsLoadingAction(false); }
    };

    const handleDeleteWine = async (wineId) => { 
        if (!db || !userId) { setError("Database not ready or user not logged in."); return { success: false }; }
        setIsLoadingAction(true);
        setActionError(null);
        try {
            const wineDocRef = doc(db, winesCollectionPath, wineId);
            await deleteDoc(wineDocRef);
            return { success: true };
        } catch (err) {
            console.error("Error deleting wine:", err);
            setError(`Failed to delete wine: ${err.message}`);
            return { success: false, error: err.message };
        } finally { setIsLoadingAction(false); }
    };

    const handleDeleteExperiencedWine = async (experiencedWineId) => {
        if (!db || !userId) { setError("Database not ready or user not logged in."); return { success: false, error: "Database not ready or user not logged in." }; }
        setIsLoadingAction(true);
        setActionError(null);
        console.log("DEBUG: Attempting to delete experienced wine with ID:", experiencedWineId);
        console.log("DEBUG: userId used in handleDeleteExperiencedWine:", userId);
        const fullDocPath = `artifacts/${appId}/users/${userId}/experiencedWines/${experiencedWineId}`; 
        console.log("DEBUG: Full Firestore document path for deletion:", fullDocPath); 

        try {
            const experiencedWineDocRef = doc(db, experiencedWinesCollectionPath, experiencedWineId); 
            await deleteDoc(experiencedWineDocRef);
            console.log("DEBUG: Experienced wine successfully deleted from Firestore (client-side acknowledgement):", experiencedWineId);
            return { success: true };
        } catch (err) {
            console.error("DEBUG: ERROR deleting experienced wine from Firestore:", err.code, err.message, err); 
            setError(`Failed to delete experienced wine: ${err.message}`, 'error');
            return { success: false, error: err.message };
        } finally { setIsLoadingAction(false); }
    };

    const handleEraseAllWines = async () => {
        if (!db || !userId) { setError("Database not ready or user not logged in."); return { success: false }; }
        setIsLoadingAction(true);
        setActionError(null);
        try {
            const q = query(collection(db, winesCollectionPath));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError("Your cellar is already empty!", 'info');
                return { success: true, message: "Cellar already empty." };
            }

            const batch = writeBatch(db);
            querySnapshot.forEach((docSnap) => {
                batch.delete(doc(db, winesCollectionPath, docSnap.id));
            });
            await batch.commit();
            
            return { success: true, message: "All wines have been successfully erased from your cellar." };
        } catch (err) {
            console.error("Error erasing all wines:", err);
            setError(`Failed to erase all wines: ${err.message}`);
            return { success: false, error: err.message };
        } finally { setIsLoadingAction(false); }
    };

    return {
        handleAddWine,
        handleUpdateWine,
        handleExperienceWine,
        handleDeleteWine, 
        handleDeleteExperiencedWine,
        handleEraseAllWines,
        isLoadingAction,
        actionError
    };
};