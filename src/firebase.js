import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail, 
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

// Check if Firebase is properly configured with non-placeholder keys
export const isFirebaseConfigured = Boolean(
    firebaseConfig.apiKey && 
    !firebaseConfig.apiKey.includes('your_api_key') &&
    firebaseConfig.projectId &&
    !firebaseConfig.projectId.includes('your_project_id')
);

// Initialize Firebase App
let app;
let auth;
let db;
let storage;

try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
} catch (error) {
    console.warn('Firebase initialization notice:', error.message);
    app = null;
    auth = null;
    db = null;
    storage = null;
}

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Trigger Firebase Google Login Popup
 */
export async function signInWithGoogle() {
    if (!auth || !isFirebaseConfigured) {
        throw new Error(
            'Firebase is not configured with live credentials. Please add your Firebase API keys in the .env file to use live Google Authentication.'
        );
    }
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
}

/**
 * Sign in with Email & Password via Firebase
 */
export async function firebaseSignInEmailPassword(email, password) {
    if (!auth || !isFirebaseConfigured) {
        throw new Error('Firebase credentials not configured in .env file.');
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

/**
 * Register with Email & Password via Firebase
 */
export async function firebaseSignUpEmailPassword(email, password) {
    if (!auth || !isFirebaseConfigured) {
        throw new Error('Firebase credentials not configured in .env file.');
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

/**
 * Send Password Reset Email via Firebase
 */
export async function firebaseResetPassword(email) {
    if (!auth || !isFirebaseConfigured) {
        throw new Error('Firebase credentials not configured in .env file.');
    }
    await sendPasswordResetEmail(auth, email);
}

/**
 * Sign out from Firebase
 */
export async function firebaseSignOut() {
    if (auth) {
        await signOut(auth);
    }
}

export { auth, db, storage, onAuthStateChanged };
export default app;
