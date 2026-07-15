import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// In a real application, these would be loaded from environment variables
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "mistbound-demo.firebaseapp.com",
  projectId: "mistbound-demo",
  storageBucket: "mistbound-demo.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
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