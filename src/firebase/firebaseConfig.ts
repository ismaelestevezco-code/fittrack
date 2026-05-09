import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeAuth, inMemoryPersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

const FIREBASE_CONFIG = {
  apiKey: (extra.firebaseApiKey as string) ?? '',
  authDomain: (extra.firebaseAuthDomain as string) ?? '',
  projectId: (extra.firebaseProjectId as string) ?? '',
  storageBucket: (extra.firebaseStorageBucket as string) ?? '',
  messagingSenderId: (extra.firebaseMessagingSenderId as string) ?? '',
  appId: (extra.firebaseAppId as string) ?? '',
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

function getFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
    app = initializeApp(FIREBASE_CONFIG);
  } else {
    app = getApps()[0];
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    // inMemoryPersistence es la opción compatible con Firebase 12.x en React Native.
    // La sesión se mantiene mientras el proceso esté activo; onAuthStateChanged
    // restaura el estado de usuario al abrir la app.
    auth = initializeAuth(getFirebaseApp(), {
      persistence: inMemoryPersistence,
    });
  }
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}

export const ADMIN_EMAIL = 'ismaelestevezco@gmail.com';
