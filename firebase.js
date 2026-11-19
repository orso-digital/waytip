import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail,
  signInAnonymously, linkWithPopup, linkWithCredential, EmailAuthProvider, updateProfile, deleteUser, signInWithCredential, signInWithCustomToken,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore, collection, query, where, getDocs, getDoc, doc, addDoc, updateDoc, setDoc,
  serverTimestamp, limit, writeBatch, deleteDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig } from './config.js?v=2611200133';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

auth.languageCode = 'he';

// התחברות עם גוגל. אורח שמתחבר: מחברים את החשבון שלו כדי שהיעדים השמורים יישארו.
export async function loginGoogle() {
  const cur = auth.currentUser;
  if (cur && cur.isAnonymous) {
    try { return await linkWithPopup(cur, provider); }
    catch (e) {
      if (e.code === 'auth/credential-already-in-use') {
        const cred = GoogleAuthProvider.credentialFromError(e);
        if (cred) return signInWithCredential(auth, cred);
      }
      throw e;
    }
  }
  return signInWithPopup(auth, provider);
}
export async function signupEmail(name, email, pass) {
  const cur = auth.currentUser;
  const res = cur && cur.isAnonymous
    ? await linkWithCredential(cur, EmailAuthProvider.credential(email, pass))
    : await createUserWithEmailAndPassword(auth, email, pass);
  if (name) await updateProfile(res.user, { displayName: name });
  await sendEmailVerification(res.user);
  return res;
}
export const loginEmail = (email, pass) => signInWithEmailAndPassword(auth, email, pass);
export const resetPassword = (email) => sendPasswordResetEmail(auth, email);
export const resendVerification = () => auth.currentUser && sendEmailVerification(auth.currentUser);
export const loginGuest = () => signInAnonymously(auth);
export const login = loginGoogle;
export const logout = () => signOut(auth);
export const removeUser = () => deleteUser(auth.currentUser);
export const loginToken = (t) => signInWithCustomToken(auth, t);
export {
  onAuthStateChanged, collection, query, where, getDocs, getDoc, doc, addDoc, updateDoc, setDoc,
  serverTimestamp, limit, writeBatch, deleteDoc,
};

// הגנה מפני הזרקת קוד בתוכן שמשתמשים כותבים
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

export const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
