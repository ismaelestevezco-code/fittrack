import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb, ADMIN_EMAIL } from './firebaseConfig';

// ─── Whitelist ────────────────────────────────────────────────────────────────

export async function isEmailWhitelisted(email: string): Promise<boolean> {
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return true;

  const db = getFirebaseDb();
  const normalizedEmail = email.toLowerCase().trim();
  const docRef = doc(db, 'whitelist', normalizedEmail);
  const snap = await getDoc(docRef);
  return snap.exists() && snap.data()?.isActive === true;
}

export async function getWhitelistEntries(): Promise<Array<{ email: string; addedAt: number }>> {
  const db = getFirebaseDb();
  const col = collection(db, 'whitelist');
  const snap = await getDocs(col);
  return snap.docs.map(d => ({
    email: d.id,
    addedAt: d.data().addedAt ?? 0,
  }));
}

export async function addToWhitelist(email: string): Promise<void> {
  const db = getFirebaseDb();
  const normalizedEmail = email.toLowerCase().trim();
  if (normalizedEmail === ADMIN_EMAIL.toLowerCase()) return;
  await setDoc(doc(db, 'whitelist', normalizedEmail), {
    email: normalizedEmail,
    addedAt: Math.floor(Date.now() / 1000),
    isActive: true,
  });
}

export async function removeFromWhitelist(email: string): Promise<void> {
  const db = getFirebaseDb();
  const normalizedEmail = email.toLowerCase().trim();
  await deleteDoc(doc(db, 'whitelist', normalizedEmail));
}

// ─── Autenticación ────────────────────────────────────────────────────────────

export interface AuthError {
  code: string;
  message: string;
}

export async function registerUser(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function loginUser(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logoutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

export function onAuthChanged(callback: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}

export function friendlyAuthError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este correo ya está registrado en otra cuenta.';
    case 'auth/invalid-email':
      return 'El correo introducido no es válido.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Correo o contraseña incorrectos.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Inténtalo de nuevo más tarde.';
    case 'auth/network-request-failed':
      return 'Sin conexión a internet. Comprueba tu red.';
    default:
      return 'Ha ocurrido un error. Inténtalo de nuevo.';
  }
}
