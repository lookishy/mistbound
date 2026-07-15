import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// In a real application, these would be loaded from environment variables
const firebaseConfig = {
  apiKey: "AIzaSyDvpROrcpDxv5AY2puAMW2aZChu44zioD4",
  authDomain: "mistbound-8511c.firebaseapp.com",
  projectId: "mistbound-8511c",
  storageBucket: "mistbound-8511c.firebasestorage.app",
  messagingSenderId: "620187709098",
  appId: "1:620187709098:web:e3953b6429ee2054c2ead3",
  measurementId: "G-4W7K0R4G2D"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Strict domain check
    if (!user.email || !user.email.endsWith('@tsunjin.edu.my')) {
      await signOut(auth);
      throw new Error('Access Denied: Only @tsunjin.edu.my domain is allowed.');
    }

    return user;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

export const logout = () => {
  return signOut(auth);
};