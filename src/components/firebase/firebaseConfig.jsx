
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getMessaging } from 'firebase/messaging';

// Firebase config - public keys are safe to expose (Firebase docs confirm this)
// Only private keys (FCM_SERVER_KEY) should be kept secret in backend
const firebaseConfig = {
  apiKey: "AIzaSyDFfrqew9sH07QgTT3yc0glYfuDWdW1Hyg", // Safe - client-side API key
  authDomain: "afrinnect.firebaseapp.com",
  projectId: "afrinnect",
  storageBucket: "afrinnect.firebasestorage.app",
  messagingSenderId: "1061676943168",
  appId: "1:1061676943168:web:ad3c6151548c30900c5ca5",
  measurementId: "G-8ZBF5S0M3M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (error) {
  console.warn('Firebase Messaging not supported:', error);
}
export { messaging };
export { app };
