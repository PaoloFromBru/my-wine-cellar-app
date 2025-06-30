// src/hooks/useWineActions.js
import { useState } from 'react';
import {
    collection,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    Timestamp,
    writeBatch,
    getDocs,
    query,
    where,      // Explicitly imported
    documentId  // Explicitly imported
} from 'firebase/firestore';

export const useWineActions = (db, userId, appId, setError) => {
    const [isLoadingAction, setIsLoadingAction] = useState(false);
    const [actionError, setActionError] = useState(null);

    const winesCollectionPath = `artifacts/${appId}/users/${userId}/wines`;
    const experiencedWinesCollectionPath = `artifacts/${appId}/users/${userId}/experiencedWines`;

    const handleAddWine = async (wineData, allWines) => {
        if (!db || !userId) { setActionError("Database not ready or user not logged in."); return { success: false }; }
        setIsLoadingAction(true);
        setActionError(null);
        try {
            // Check for duplicate location before adding
            const isLocationTaken = allWines.some(
                w => w.location && w.location.trim().toLowerCase() === (wineData.location || '').trim().toLowerCase()
            );
            if (isLocationTaken) {
                setActionError(`Location "${wineData.location}" is already in use.`);
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
            setActionError(`Failed to add wine: ${err.message}`); 
            return { success: false, error: err.message };
        } finally { setIsLoadingAction(false); }
    };

    const handleUpdateWine = async (wineIdToUpdate, wineData, allWines) => { 
        if (!db || !userId) { setActionError("Database not ready or user not logged in."); return { success: false }; }
        setIsLoadingAction(true);
        setActionError(null);
        try {
            // Check for duplicate location, excluding the current wine being edited
            const isLocationTaken = allWines.some(
                w => w.id !== wineIdToUpdate && w.location && w.location.trim().toLowerCase() === (wineData.location || '').trim().toLowerCase()
            );
            if (isLocationTaken) {
                setActionError(`Location "${wineData.location}" is already in use by another wine.`);
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
            setActionError(`Failed to update wine: ${err.message}`); 
            return { success: false, error: err.message };
        } finally { setIsLoadingAction(false); }
    };

    const handleExperienceWine = async (wineToMoveId, notes, rating, consumedDate, allWines) => { 
        if (!db || !userId) { setActionError("Database not ready or user not logged in."); return { success: false }; }
        setIsLoadingAction(true);
        setActionError(null);

        // Find the wine from the local allWines array instead of fetching again
        const wineToMove = allWines.find(w => w.id === wineToMoveId);
        if (!wineToMove) {
            setActionError("Wine not found in current cellar to experience.");
            return { success: false, error: "Wine not found." };
        }

        try {
            const batch = writeBatch(db);
            const wineDocRef = doc(db, winesCollectionPath, wineToMoveId);
            const newExperiencedWineRef = doc(collection(db, experiencedWinesCollectionPath)); 

            // 1. Add to experienced wines collection
            batch.set(newExperiencedWineRef, {
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
            setActionError(`Failed to experience wine: ${err.message}`);
            return { success: false, error: err.message };
        } finally { setIsLoadingAction(false); }
    };

    const handleDeleteWine = async (wineId) => { // New function added for deleting a single active wine
        if (!db || !userId) { setActionError("Database not ready or user not logged in."); return { success: false }; }
        setIsLoadingAction(true);
        setActionError(null);
        try {
            const wineDocRef = doc(db, winesCollectionPath, wineId);
            await deleteDoc(wineDocRef);
            return { success: true };
        } catch (err) {
            console.error("Error deleting wine:", err);
            setActionError(`Failed to delete wine: ${err.message}`);
            return { success: false, error: err.message };
        } finally {
            setIsLoadingAction(false);
        }
    };

    const handleDeleteExperiencedWine = async (experiencedWineId) => {
        if (!db || !userId) { setActionError("Database not ready or user not logged in."); return { success: false }; }
        setIsLoadingAction(true);
        setActionError(null);
        console.log("DEBUG: Attempting to delete experienced wine with ID:", experiencedWineId);
        try {
            const experiencedWineDocRef = doc(db, experiencedWinesCollectionPath, experiencedWineId);
            await deleteDoc(experiencedWineDocRef);
            console.log("DEBUG: Experienced wine successfully deleted from Firestore:", experiencedWineId);
            return { success: true };
        } catch (err) {
            console.error("DEBUG: Error deleting experienced wine from Firestore:", err.code, err.message);
            setActionError(`Failed to delete experienced wine: ${err.message}. Check console for details.`);
            return { success: false, error: err.message };
        } finally { setIsLoadingAction(false); }
    };

    const handleEraseAllWines = async () => {
        if (!db || !userId) { setActionError("Database not ready or user not logged in."); return { success: false }; }
        setIsLoadingAction(true);
        setActionError(null);
        try {
            const q = query(collection(db, winesCollectionPath));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setActionError("Your cellar is already empty!");
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
            setActionError(`Failed to erase all wines: ${err.message}`);
            return { success: false, error: err.message };
        } finally { setIsLoadingAction(false); }
    };

    return {
        handleAddWine,
        handleUpdateWine,
        handleExperienceWine,
        handleDeleteWine, // Export the new function
        handleDeleteExperiencedWine,
        handleEraseAllWines,
        isLoadingAction,
        actionError
    };
};