import { useState } from 'react';
import {
    signInAnonymously,
    signInWithCustomToken,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'firebase/auth';

export const useAuthManager = (authInstance, initialAuthToken) => {
    const [authError, setAuthError] = useState(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(false);

    // Initial sign-in logic based on Canvas environment
    const performInitialAuth = async () => {
        if (!authInstance) return;

        setIsLoadingAuth(true);
        try {
            if (initialAuthToken && initialAuthToken !== 'undefined') {
                await signInWithCustomToken(authInstance, initialAuthToken);
            } else {
                await signInAnonymously(authInstance);
            }
            setAuthError(null);
        } catch (error) {
            console.error("Initial authentication failed: ", error);
            setAuthError(`Initial authentication failed: ${error.message}`);
        } finally {
            setIsLoadingAuth(false);
        }
    };

    const login = async (email, password) => {
        setIsLoadingAuth(true);
        setAuthError(null);
        try {
            await signInWithEmailAndPassword(authInstance, email, password);
            return { success: true };
        } catch (error) {
            console.error("Login failed:", error);
            let errorMessage = "Login failed. Please try again.";
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This user has been disabled.';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential': // Generic for wrong credentials
                    errorMessage = 'Invalid email or password.';
                    break;
                default:
                    errorMessage = `Login error: ${error.message}`;
            }
            setAuthError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoadingAuth(false);
        }
    };

    const register = async (email, password) => {
        setIsLoadingAuth(true);
        setAuthError(null);
        try {
            await createUserWithEmailAndPassword(authInstance, email, password);
            return { success: true };
        } catch (error) {
            console.error("Registration failed:", error);
            let errorMessage = "Registration failed. Please try again.";
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'This email is already registered. Try logging in.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak (min 6 characters).';
                    break;
                default:
                    errorMessage = `Registration error: ${error.message}`;
            }
            setAuthError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoadingAuth(false);
        }
    };

    const logout = async () => {
        setIsLoadingAuth(true);
        setAuthError(null);
        try {
            await signOut(authInstance);
            return { success: true };
        } catch (error) {
            console.error("Logout failed:", error);
            setAuthError(`Logout failed: ${error.message}`);
            return { success: false, error: `Logout error: ${error.message}` };
        } finally {
            setIsLoadingAuth(false);
        }
    };

    return {
        authError,
        isLoadingAuth,
        performInitialAuth,
        login,
        register,
        logout
    };
};