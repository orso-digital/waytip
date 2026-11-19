// יעדים שמורים: נשמרים בדפדפן, ולמשתמש מחובר (כולל אורח) גם בחשבון, כדי שיופיעו בכל מכשיר.
import { auth, db, doc, getDoc, setDoc, serverTimestamp } from './firebase.js?v=2611200138';
const KEY = 'waytip.saved';
let items = [];
const listeners = new Set();
const readLocal = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
const writeLocal = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} };
items = readLocal();
const emit = () => listeners.forEach((f) => f(items));
export const onSaved = (f) => { listeners.add(f); f(items); };
export const isSaved = (id) => items.some((x) => String(x.id) === String(id));
export const savedList = () => items.slice();
async function push() {
  writeLocal();
  const u = auth.currentUser; if (!u) return;
  try { await setDoc(doc(db, 'saved', u.uid), { items: items.slice(0, 100), updatedAt: serverTimestamp() }); } catch (e) {}
}
export async function toggleSaved(d) {
  if (isSaved(d.id)) items = items.filter((x) => String(x.id) !== String(d.id));
  else items = [{ id: String(d.id), name: d.name, country: d.country || '', cc: d.cc || '', from: d.from || '', to: d.to || '', trip: d.trip || '', at: Date.now() }, ...items].slice(0, 100);
  emit(); await push(); return isSaved(d.id);
}
// בהתחברות: ממזגים את מה שנשמר בדפדפן עם מה שבחשבון
export async function syncSaved(u) {
  if (!u) { items = readLocal(); emit(); return; }
  try {
    const s = await getDoc(doc(db, 'saved', u.uid));
    const remote = s.exists() ? (s.data().items || []) : [];
    const map = new Map();
    [...items, ...remote].forEach((x) => { if (x && x.id && !map.has(String(x.id))) map.set(String(x.id), x); });
    items = [...map.values()].sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 100);
    emit(); await push();
  } catch (e) {}
}
export function clearLocalSaved() { items = []; try { localStorage.removeItem(KEY); } catch (e) {} emit(); }
