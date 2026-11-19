import { isEN, startI18n, langButton } from './i18n.js';
import { searchExtra, extraById } from './places.js';
import './a11y.js';
import {
  auth, db, logout, onAuthStateChanged, collection, query, where, getDocs,
  addDoc, serverTimestamp, esc, MONTHS, doc, getDoc, deleteDoc, removeUser, resendVerification,
} from './firebase.js';
import { openAuth } from './account.js';
import { onSaved, isSaved, toggleSaved, syncSaved, savedList, clearLocalSaved } from './saved.js';
import { SERVER_URL, SITE_NAME } from './config.js';
import { loaderBlock, showLoader, hideLoader } from './loader.js';
import { parseVideo, videoButton } from './video.js';
import './reviews-web.js';
import { TRIPS, CATS, PREFS, PREF_GROUPS, T, KW, catFor } from './vocab.js';
import { mini, TRIP_ICON } from './covers.js';
import { startRegistration, startAuthentication } from 'https://cdn.jsdelivr.net/npm/@simplewebauthn/browser@10.0.0/+esm';

const $ = (id) => document.getElementById(id);
let user = null, dest = null, reviews = [], web = [], rating = 5;
let F = { trip: '', cat: '', prefs: new Set() };
const toast = (t) => { $('toast').textContent = t; $('toast').classList.remove('hidden'); clearTimeout(toast.t); toast.t = setTimeout(() => $('toast').classList.add('hidden'), 2800); };
document.title = SITE_NAME;

// ================= התחברות =================
const login = (o) => openAuth(o);
const who = (u) => u.isAnonymous ? 'אורח' : ((u.displayName || u.email || '').split(/[ @]/)[0] || 'החשבון שלי');
onAuthStateChanged(auth, (u) => {
  user = u;
  document.querySelectorAll('[data-login]').forEach((b) => {
    b.textContent = u ? who(u) : 'התחברות';
    b.onclick = () => (u ? openMenu(b) : login().catch(() => {}));
  });
  $('delAcc').classList.toggle('hidden', !u);
  syncSaved(u);
});
// תפריט חשבון קטן
function openMenu(btn) {
  let m = $('acctMenu');
  if (!m) { m = document.createElement('div'); m.id = 'acctMenu'; m.className = 'acctmenu hidden'; m.setAttribute('role', 'menu'); document.body.appendChild(m);
    document.addEventListener('click', (e) => { if (!e.target.closest('#acctMenu') && !e.target.closest('[data-login]')) m.classList.add('hidden'); }); }
  const u = user;
  m.innerHTML = `<div class="am-h">${esc(u.isAnonymous ? 'מחוברים כאורח' : (u.email || u.displayName || ''))}</div>
    <button role="menuitem" data-a="saved">♥ היעדים השמורים שלי (${savedList().length})</button>
    ${u.isAnonymous ? '<button role="menuitem" data-a="upgrade">יצירת חשבון (כדי לכתוב המלצות)</button>' : ''}
    ${!u.isAnonymous && !u.emailVerified ? '<button role="menuitem" data-a="verify">שליחת מייל אימות שוב</button>' : ''}
    ${!u.isAnonymous && u.emailVerified && window.PublicKeyCredential ? '<button role="menuitem" data-a="passkey">הפעלת כניסה עם טביעת אצבע / Face ID</button>' : ''}
    <button role="menuitem" data-a="out">יציאה</button>`;
  const r = btn.getBoundingClientRect();
  m.style.top = (r.bottom + scrollY + 8) + 'px'; m.style.left = Math.max(12, r.left + scrollX) + 'px';
  m.classList.toggle('hidden');
  m.querySelectorAll('[data-a]').forEach((b) => b.onclick = async () => {
    m.classList.add('hidden');
    if (b.dataset.a === 'saved') goSaved();
    if (b.dataset.a === 'upgrade') login({ allowGuest: false, signup: true, reason: 'צרו חשבון. היעדים ששמרתם יישארו.' }).catch(() => {});
    if (b.dataset.a === 'verify') { try { await resendVerification(); toast('שלחנו שוב מייל אימות'); } catch (e) { toast('נסו שוב בעוד כמה דקות'); } }
    if (b.dataset.a === 'passkey') {
      try {
        const st = await api('/passkey/status');
        if (!st.registered) await api('/passkey/register/verify', await startRegistration(await api('/passkey/register/options', {})));
        toast('כניסה עם טביעת אצבע הופעלה ✓');
      } catch (e) { if (e.name !== 'NotAllowedError') toast(e.message); }
    }
    if (b.dataset.a === 'out') { await logout(); clearLocalSaved(); toast('יצאתם מהחשבון'); }
  });
}
$('delAcc').onclick = async () => {
  if (!confirm('למחוק את החשבון שלך? כל ההמלצות שכתבת, הדיווחים והיעדים השמורים יימחקו לצמיתות. אי אפשר לבטל את זה.')) return;
  try {
    if (user.isAnonymous || !user.emailVerified) { await deleteDoc(doc(db, 'saved', user.uid)).catch(() => {}); await removeUser(); }
    else { await api('/account/delete', {}); await logout(); }
    clearLocalSaved(); toast('החשבון והמידע שלך נמחקו');
  } catch (e) { toast(e.code === 'auth/requires-recent-login' ? 'מטעמי אבטחה, התחברו מחדש ונסו שוב' : e.message); }
};

// ================= יעדים שמורים =================
function drawSaved(list) {
  const box = $('savedSec'); if (!box) return;
  box.classList.toggle('hidden', !list.length);
  $('savedList').innerHTML = list.map((s) => `<a class="sv" href="#d=${esc(s.id)}" data-sid="${esc(s.id)}">${s.cc ? flag(s.cc) : ''}<span><b>${esc(s.name)}</b><small>${esc(s.country)}${s.from ? ' · ' + esc(fmt(s.from)) : ''}</small></span>
    <button class="svx" data-unsave="${esc(s.id)}" aria-label="הסרה מהשמורים">✕</button></a>`).join('');
  $('savedList').querySelectorAll('[data-sid]').forEach((a) => a.onclick = (e) => {
    if (e.target.closest('[data-unsave]')) { e.preventDefault(); const s = list.find((x) => x.id === e.target.closest('[data-unsave]').dataset.unsave); toggleSaved(s); return; }
    e.preventDefault(); const s = list.find((x) => x.id === a.dataset.sid);
    if (s.from) { $('from').value = s.from; $('to').value = s.to || s.from; }
    openById(s.id);
  });
}
onSaved((l) => { drawSaved(l); drawSaveBtn(); });
function goSaved() {
  if ($('destPage').classList.contains('hidden')) $('savedSec').scrollIntoView({ behavior: 'smooth' });
  else { $('home').click(); setTimeout(() => $('savedSec').scrollIntoView({ behavior: 'smooth' }), 50); }
  if (!savedList().length) toast('עוד לא שמרתם יעדים. לחצו על ♡ בדף של יעד');
}
function drawSaveBtn() {
  const b = $('saveDest'); if (!b || !dest) return;
  const on = isSaved(dest.id);
  b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
  b.innerHTML = `<span aria-hidden="true">${on ? '♥' : '♡'}</span> ${on ? 'נשמר' : 'שמירה'}`;
}
$('saveDest').onclick = async () => {
  if (!user) { try { await login({ reason: 'כדי לשמור את היעד גם לפעם הבאה' }); } catch (e) { return; } }
  const on = await toggleSaved({ id: dest.id, name: dest.name, country: dest.country, cc: dest.cc, from: $('from').value, to: $('to').value, trip: F.trip });
  toast(on ? `${dest.name} נשמר ביעדים שלך ♥` : 'הוסר מהשמורים');
};

// ================= תמונות =================
// 1. Pexels דרך השרת (צילום גדול ומקצועי)  2. Wikimedia כגיבוי
// מעירים את השרת ברקע כבר כשהאתר נפתח (בתוכנית החינמית הוא נרדם כשאין שימוש)
fetch(SERVER_URL + '/').catch(() => {});
const photoKey = (q, c) => ('v2-' + q + '-' + (c || '')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120) || 'x';
// צילומים נבחרים (Wikimedia Commons, נטענים מיד מהשרתים המהירים של ויקימדיה)
const CURATED = {
  'Rome': { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Colosseum_in_Rome-April_2007-1-_copie_2B.jpg/1280px-Colosseum_in_Rome-April_2007-1-_copie_2B.jpg', big: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Colosseum_in_Rome-April_2007-1-_copie_2B.jpg/1920px-Colosseum_in_Rome-April_2007-1-_copie_2B.jpg', file: 'Colosseum_in_Rome-April_2007-1-_copie_2B.jpg' },
  'Paris': { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Paris_-_The_Eiffel_Tower_in_spring_-_2307.jpg/1280px-Paris_-_The_Eiffel_Tower_in_spring_-_2307.jpg', big: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Paris_-_The_Eiffel_Tower_in_spring_-_2307.jpg/1920px-Paris_-_The_Eiffel_Tower_in_spring_-_2307.jpg', file: 'Paris_-_The_Eiffel_Tower_in_spring_-_2307.jpg' },
  'Bangkok': { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Templo_Wat_Arun%2C_Bangkok%2C_Tailandia%2C_2013-08-22%2C_DD_37.jpg/1280px-Templo_Wat_Arun%2C_Bangkok%2C_Tailandia%2C_2013-08-22%2C_DD_37.jpg', big: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Templo_Wat_Arun%2C_Bangkok%2C_Tailandia%2C_2013-08-22%2C_DD_37.jpg/1920px-Templo_Wat_Arun%2C_Bangkok%2C_Tailandia%2C_2013-08-22%2C_DD_37.jpg', file: 'Templo_Wat_Arun,_Bangkok,_Tailandia,_2013-08-22,_DD_37.jpg' },
  'New York City': { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Midtown_Manhattan_from_Weehawken_September_2021_HDR.jpg/1280px-Midtown_Manhattan_from_Weehawken_September_2021_HDR.jpg', big: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Midtown_Manhattan_from_Weehawken_September_2021_HDR.jpg/1920px-Midtown_Manhattan_from_Weehawken_September_2021_HDR.jpg', file: 'Midtown_Manhattan_from_Weehawken_September_2021_HDR.jpg' },
  'London': { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Tower_Bridge_London_Feb_2006.jpg/1280px-Tower_Bridge_London_Feb_2006.jpg', big: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Tower_Bridge_London_Feb_2006.jpg/1920px-Tower_Bridge_London_Feb_2006.jpg', file: 'Tower_Bridge_London_Feb_2006.jpg' },
  'Barcelona': { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Sagrada_Familia_01.jpg/1280px-Sagrada_Familia_01.jpg', big: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Sagrada_Familia_01.jpg/1920px-Sagrada_Familia_01.jpg', file: 'Sagrada_Familia_01.jpg' },
  'waytip hero': { src: 'assets/hero.jpg', big: 'assets/hero.jpg' },
};
async function wvPhoto(en) {
  try {
    const v = await (await fetch(`https://en.wikivoyage.org/w/api.php?action=query&prop=pageimages&piprop=thumbnail|original|name&pithumbsize=1920&titles=${encodeURIComponent(en)}&redirects=1&format=json&origin=*`)).json();
    const p = Object.values(v.query.pages)[0];
    const name = String(p.pageimage || ''), o = p.original || {};
    // רק צילום אמיתי: לא מפה, לא דגל, לא באנר צר
    const photo = /\.jpe?g$/i.test(name) && !/map|karte|carte|locator|location|flag|region|banner|diagram|svg/i.test(name);
    if (photo && p.thumbnail && p.thumbnail.width >= 1000 && o.width / o.height < 2.2) return p.thumbnail.source;
  } catch (e) {}
  return null;
}
async function cachedPhoto(en, country) {
  try {
    const k = photoKey(en, country);
    const meta = await getDoc(doc(db, 'photoCache', k));
    if (meta.exists() && !meta.data().none) {
      const b = await getDoc(doc(db, 'photoBlobs', k));
      if (b.exists() && b.data().data) return 'data:image/jpeg;base64,' + b.data().data;
    }
  } catch (e) {}
  return null;
}
async function serverPhoto(en, country) {
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 7000);
    const r = await fetch(`${SERVER_URL}/photo?q=${encodeURIComponent(en)}&c=${encodeURIComponent(country || '')}`, { signal: ctl.signal });
    clearTimeout(t);
    if (r.ok) { const d = await r.json(); if (d.src) return d.src; }
  } catch (e) {}
  return null;
}
// יעד: קודם הבאנר של היעד מוויקימסע (צילום של העיר עצמה, נטען מהר), ואם אין – צילום מ-Pixabay
async function photoFor(en, country, hero) {
  if (CURATED[en]) return hero || innerWidth > 900 ? CURATED[en].big : CURATED[en].src;
  if (hero) return (await cachedPhoto(en, country)) || (await serverPhoto(en, country));
  return (await wvPhoto(en)) || (await cachedPhoto(en, country)) || (await serverPhoto(en, country));
}
// מכינים את תמונת הכיסוי מראש (עד כמה שניות), כדי שהדף ייפתח כשהתמונה כבר מוכנה
const preload = (src) => new Promise((res) => { if (!src) return res(null); const i = new Image(); i.decoding = 'async'; i.onload = () => res(src); i.onerror = () => res(null); i.src = src; });
const within = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(() => r(undefined), ms))]);
const ready = {};
function prepareCover(en, country, hero) {
  const k = (hero ? 'h:' : '') + en + '|' + (country || '');
  if (!ready[k]) { const p = photoFor(en, country, hero).then(preload); p.then((s) => { p.done = s; }); ready[k] = p; }
  return ready[k];
}
function photoDiv(src, alt, instant) {
  const d = document.createElement('div');
  d.className = 'photo' + (instant ? ' in' : '');
  d.style.backgroundImage = `url("${String(src).replace(/"/g, '%22')}")`;
  if (alt) { d.setAttribute('role', 'img'); d.setAttribute('aria-label', alt); } else d.setAttribute('aria-hidden', 'true');
  return d;
}
function paint(el, en, country, alt, fallback = 'see', hero = false) {
  const k = (hero ? 'h:' : '') + en + '|' + (country || '');
  const mine = (el._p = (el._p || 0) + 1);
  if (ready[k] && ready[k].done !== undefined) {
    el.innerHTML = ready[k].done ? '' : '<div class="artwait done" aria-hidden="true"></div>';
    if (ready[k].done) el.appendChild(photoDiv(ready[k].done, alt, true));
    return;
  }
  el.innerHTML = '<div class="artwait" aria-hidden="true"></div>';
  prepareCover(en, country, hero).then((src) => {
    if (mine !== el._p) return;
    if (!src) { el.innerHTML = '<div class="artwait done" aria-hidden="true"></div>'; return; }
    const ph = photoDiv(src, alt, false); el.appendChild(ph);
    requestAnimationFrame(() => requestAnimationFrame(() => ph.classList.add('in')));
    setTimeout(() => { if (mine === el._p) el.querySelectorAll('.artwait').forEach((x) => x.remove()); }, 700);
  });
}
const flag = (cc) => cc ? `<img src="https://flagcdn.com/w80/${cc.toLowerCase()}.png" alt="דגל">` : '';

// ================= דף הבית =================
const POPULAR = [
  { id: 3169070, he: 'רומא', en: 'Rome', country: 'Italy', heC: 'איטליה', cc: 'it' },
  { id: 2988507, he: 'פריז', en: 'Paris', country: 'France', heC: 'צרפת', cc: 'fr' },
  { id: 1609350, he: 'בנגקוק', en: 'Bangkok', country: 'Thailand', heC: 'תאילנד', cc: 'th' },
  { id: 5128581, he: 'ניו יורק', en: 'New York City', country: 'United States', heC: 'ארצות הברית', cc: 'us' },
  { id: 2643743, he: 'לונדון', en: 'London', country: 'United Kingdom', heC: 'בריטניה', cc: 'gb' },
  { id: 3128760, he: 'ברצלונה', en: 'Barcelona', country: 'Spain', heC: 'ספרד', cc: 'es' },
];
$('pop').innerHTML = POPULAR.map((p, i) => `<button class="pc" data-i="${i}"><div class="art" id="pa${i}"></div><div class="t"><b>${p.he}</b><span><span class="flag">${flag(p.cc)}</span>${p.heC}</span></div></button>`).join('');
POPULAR.forEach((p, i) => paint($('pa' + i), p.en, p.country));
document.querySelectorAll('.pc').forEach((b) => b.onclick = () => openById(POPULAR[+b.dataset.i].id));

// ================= תכנון: יעד ← תאריכים ← אופי טיול ← העדפות =================
const W = { id: null, trip: '', cat: '', prefs: new Set() };
let step = 1, timer, lastList = [];
function wzShow() {
  document.querySelectorAll('[data-step]').forEach((x) => x.classList.toggle('hidden', +x.dataset.step !== step));
  document.querySelectorAll('.wz-steps span').forEach((x) => { const n = +x.dataset.s; x.classList.toggle('on', n === step); x.classList.toggle('done', n < step); });
  $('wzBack').style.visibility = step > 1 ? 'visible' : 'hidden';
  $('wzNext').textContent = step < 4 ? 'המשך' : 'הצג המלצות';
  $('wzCount').textContent = `שלב ${step} מתוך 4`;
  chips($('wTrip'), TRIPS, (k) => W.trip === k, (v) => { W.trip = v; wzShow(); }, 'עוד לא יודעים');
  chips($('wCat'), CATS, (k) => W.cat === k, (v) => { W.cat = v; wzShow(); }, 'הכל');
  chipsGrouped($('wPref'), (k) => W.prefs.has(k), (v) => { W.prefs.has(v) ? W.prefs.delete(v) : W.prefs.add(v); wzShow(); });
}
function pick(p) {
  W.id = p.id;
  $('sug').classList.add('hidden');
  $('q').value = p.name;
  $('picked').innerHTML = `<span class="flag" style="box-shadow:0 0 0 1px #cfe0dc">${flag(p.country_code)}</span>${esc(p.name)}${p.country ? ', ' + esc(p.country) : ''}<button type="button" id="unpick">שינוי</button>`;
  $('picked').classList.remove('hidden');
  $('unpick').onclick = () => { W.id = null; $('picked').classList.add('hidden'); $('q').value = ''; $('q').focus(); };
}
$('q').addEventListener('input', () => {
  W.id = null; $('picked').classList.add('hidden');
  clearTimeout(timer);
  const q = $('q').value.trim();
  if (q.length < 2) { $('sug').classList.add('hidden'); return; }
  // איים ואזורים (קוסמוי, סנטוריני, באלי…) מופיעים מיד, בלי לחכות לרשת
  const ex = searchExtra(q).map((p) => ({ id: p.id, name: isEN ? p.en : p.he, country: isEN ? p.countryEn : p.country, country_code: p.cc, admin1: '' }));
  const draw = (list) => {
    lastList = list;
    $('sug').innerHTML = lastList.map((p, i) => `<li><button type="button" data-i="${i}"><span class="flag" style="box-shadow:0 0 0 1px #ddd">${flag(p.country_code)}</span>${esc(p.name)} <small>${esc([p.admin1, p.country].filter(Boolean).join(', '))}</small></button></li>`).join('') || '<li><small>לא נמצא יעד</small></li>';
    $('sug').classList.remove('hidden');
    $('sug').querySelectorAll('[data-i]').forEach((b) => b.onclick = () => pick(lastList[+b.dataset.i]));
  };
  if (ex.length) draw(ex);
  timer = setTimeout(async () => {
    try {
      const d = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=${isEN ? 'en' : 'he'}&format=json`)).json();
      if ($('q').value.trim() !== q) return;
      const seen = new Set(ex.map((x) => x.name));
      const found = (d.results || []).filter((p) => p.feature_code !== 'AIRP' && !seen.has(p.name));
      lastList = [...ex, ...found].slice(0, 8);
      $('sug').innerHTML = lastList.map((p, i) => `<li><button type="button" data-i="${i}"><span class="flag" style="box-shadow:0 0 0 1px #ddd">${flag(p.country_code)}</span>${esc(p.name)} <small>${esc([p.admin1, p.country].filter(Boolean).join(', '))}</small></button></li>`).join('') || '<li><small>לא נמצא יעד</small></li>';
      $('sug').classList.remove('hidden');
      $('sug').querySelectorAll('[data-i]').forEach((b) => b.onclick = () => pick(lastList[+b.dataset.i]));
    } catch (e) {}
  }, 150);
});
$('wzNext').onclick = () => {
  if (step === 1 && !W.id) { if (lastList[0]) pick(lastList[0]); else { $('q').focus(); toast('הקלידו יעד ובחרו מהרשימה'); return; } }
  if (step === 2 && !$('from').value) { toast('בחרו תאריך התחלה'); return; }
  if (step < 4) { step++; wzShow(); return; }
  openById(W.id, true);
};
$('wzBack').onclick = () => { if (step > 1) { step--; wzShow(); } };

async function openById(id, fromWz) {
  showLoader();
  const x = extraById(String(id));
  if (x) { // אי או אזור מהרשימה שלנו
    dest = { key: x.id, id: x.id, name: isEN ? x.en : x.he, enName: x.en, country: isEN ? x.countryEn : x.country, countryEn: x.countryEn, cc: x.cc, lat: x.lat, lon: x.lon };
    location.hash = 'd=' + x.id;
    await within(prepareCover(dest.enName, dest.countryEn), 2500);
    showDest(fromWz); setTimeout(hideLoader, 150); return;
  }
  try {
    const [he, en] = await Promise.all([
      fetch(`https://geocoding-api.open-meteo.com/v1/get?id=${id}&language=${isEN ? 'en' : 'he'}`).then((r) => r.json()),
      fetch(`https://geocoding-api.open-meteo.com/v1/get?id=${id}&language=en`).then((r) => r.json()),
    ]);
    dest = { key: 'g' + id, id, name: he.name, enName: en.name, country: he.country || '', countryEn: en.country || '', cc: he.country_code || '', lat: he.latitude, lon: he.longitude };
    location.hash = 'd=' + id;
    await within(prepareCover(dest.enName, dest.countryEn), 2500); // הדף נפתח עם התמונה מוכנה
    showDest(fromWz);
  } catch (e) { toast('לא הצלחתי לטעון את היעד'); }
  finally { setTimeout(hideLoader, 150); }
}
(function fromHash() { const m = location.hash.match(/d=(\d+|a-[a-z0-9-]+)/); if (m) openById(m[1]); })();
$('home').onclick = (e) => { e.preventDefault(); history.replaceState(null, '', location.pathname); $('saveDest').classList.add('hidden'); $('destPage').classList.add('hidden'); $('landing').classList.remove('hidden'); scrollTo(0, 0); };

// ================= תאריכים =================
const iso = (d) => d.toISOString().slice(0, 10);
function sync(fromBar) {
  const f = fromBar ? $('from2').value : $('from').value;
  let t = fromBar ? $('to2').value : $('to').value;
  if (f && (!t || t < f)) t = f;
  $('from').value = $('from2').value = f; $('to').value = $('to2').value = t;
  if (f) { $('to').min = $('to2').min = f; }
}
['from', 'to'].forEach((id) => $(id).addEventListener('change', () => sync(false)));
['from2', 'to2'].forEach((id) => $(id).addEventListener('change', () => { sync(true); loadWeather(); render(); }));
function months() {
  const f = $('from').value, t = $('to').value || f;
  if (!f) return null;
  const s = new Date(f), e = new Date(t), set = new Set(), d = new Date(s.getFullYear(), s.getMonth(), 1);
  while (d <= e && set.size < 12) { set.add(d.getMonth() + 1); d.setMonth(d.getMonth() + 1); }
  return set;
}
const fmt = (s) => { const d = new Date(s); return d.getDate() + ' ב' + MONTHS[d.getMonth()]; };


// ================= כפתורי סינון =================
let openP='';
document.querySelectorAll('.fbtn').forEach(b=>b.onclick=e=>{e.stopPropagation();openP=openP===b.dataset.p?'':b.dataset.p;showPanels()});
function showPanels(){document.querySelectorAll('.fbtn').forEach(b=>{b.classList.toggle('open',b.dataset.p===openP);b.setAttribute('aria-expanded',b.dataset.p===openP)});document.querySelectorAll('[data-panel]').forEach(p=>p.classList.toggle('hidden',p.dataset.panel!==openP))}
document.addEventListener('click',e=>{if(openP&&!e.composedPath().some(n=>n.classList&&n.classList.contains('fbar'))){openP='';showPanels()}});
function labels(){
  const set=(id,p,txt)=>{document.getElementById(id).textContent=txt;document.querySelector(`.fbtn[data-p="${p}"]`).classList.toggle('has',!!txt)};
  set('lbTrip','trip',F.trip?T[F.trip]:'');set('lbCat','cat',F.cat?T[F.cat]:'');
  set('lbPref','pref',F.prefs.size===1?T[[...F.prefs][0]]:F.prefs.size?F.prefs.size+' נבחרו':'');
  const f=document.getElementById('from').value,t=document.getElementById('to').value;
  document.getElementById('lbDates').textContent=f?`${new Date(f).getDate()}.${new Date(f).getMonth()+1} – ${new Date(t||f).getDate()}.${new Date(t||f).getMonth()+1}`:'';
  document.getElementById('clearF').classList.toggle('hidden',!(F.trip||F.cat||F.prefs.size));
}

// ================= דף יעד =================
function showDest(fromWz) {
  sync(false);
  F = fromWz ? { trip: W.trip, cat: W.cat, prefs: new Set(W.prefs) } : { trip: '', cat: '', prefs: new Set() };
  $('landing').classList.add('hidden'); $('destPage').classList.remove('hidden'); $('sug').classList.add('hidden');
  $('dName').textContent = dest.name; $('wName').textContent = dest.name;
  $('dCountry').textContent = dest.country; $('dFlag').innerHTML = flag(dest.cc);
  paint($('destArt'), dest.enName, dest.countryEn, 'צילום של ' + dest.name);
  $('saveDest').classList.remove('hidden');
  drawSaveBtn();
  scrollTo(0, 0);
  loadWeather(); loadReviews(); loadWeb(); render();
}

async function loadWeather() {
  const f = $('from').value, t = $('to').value || f;
  $('dSub').textContent = (f ? `${fmt(f)} – ${fmt(t)}` : 'בחרו תאריכים') + (F.trip ? ' · ' + T[F.trip] : '');
  if (!f) return;
  ['fDay', 'fNight', 'fRain'].forEach((k) => $(k).classList.add('ld'));
  const back = (s, n) => { const d = new Date(s); d.setFullYear(d.getFullYear() - n); return iso(d); };
  let n = 1, s = back(f, 1), e = back(t, 1);
  if (new Date(e) > new Date(Date.now() - 7 * 864e5)) { n = 2; s = back(f, 2); e = back(t, 2); }
  if (new Date(e) - new Date(s) > 92 * 864e5) { const d = new Date(s); d.setDate(d.getDate() + 92); e = iso(d); }
  try {
    const d = (await (await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${dest.lat}&longitude=${dest.lon}&start_date=${s}&end_date=${e}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`)).json()).daily;
    const avg = (a) => Math.round(a.filter((x) => x != null).reduce((x, y) => x + y, 0) / a.length);
    const night = avg(d.temperature_2m_min), rainy = d.precipitation_sum.filter((x) => x > 1).length, days = d.time.length;
    $('fDay').textContent = avg(d.temperature_2m_max) + '°'; $('fNight').textContent = night + '°';
    $('fWear').textContent = night < 8 ? 'מעיל חם בערב' : night < 15 ? 'ז׳קט קל בערב' : 'בגדים קלים';
    $('fRain').textContent = `${rainy} מתוך ${days}`; $('fRainT').textContent = rainy > days / 3 ? 'כדאי מטריה' : 'רוב הימים יבשים';
  } catch (err) { $('fDay').textContent = $('fNight').textContent = $('fRain').textContent = '–'; }
  ['fDay', 'fNight', 'fRain'].forEach((k) => $(k).classList.remove('ld'));
}

let loadingR = false, loadingW = false;
async function loadReviews() {
  reviews = []; loadingR = true; render();
  try {
    const q = query(collection(db, 'reviews'), where('destKey', '==', dest.key), where('status', '==', 'approved'));
    reviews = (await getDocs(q)).docs.map((d) => ({ id: d.id, tags: [], ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  } catch (e) {}
  loadingR = false; render();
}

// ================= סינון =================
function chips(el, list, isOn, onClick, all) {
  el.innerHTML = (all ? `<button type="button" class="chip ${isOn('') ? 'on' : ''}" aria-pressed="${isOn('')}" data-v="">${all}</button>` : '') +
    list.map(([k, v]) => `<button type="button" class="chip ${isOn(k) ? 'on' : ''}" aria-pressed="${isOn(k)}" data-v="${k}">${v}</button>`).join('');
  el.querySelectorAll('.chip').forEach((c) => c.onclick = () => onClick(c.dataset.v));
}
function chipsGrouped(el, isOn, onClick) {
  el.innerHTML = PREF_GROUPS.map(([g, list]) => `<div class="cgroup"><div class="cg-title">${g}</div><div class="chips">${
    list.map(([k, v]) => `<button type="button" class="chip ${isOn(k) ? 'on' : ''}" aria-pressed="${isOn(k)}" data-v="${k}">${v}</button>`).join('')}</div></div>`).join('');
  el.querySelectorAll('.chip').forEach((c) => c.onclick = () => onClick(c.dataset.v));
}
function drawFilters() {
  chips($('tripChips'), TRIPS, (k) => F.trip === k, (v) => { F.trip = v; openP = ''; showPanels(); loadWeather(); render(); }, 'הכל');
  chips($('catChips'), CATS, (k) => F.cat === k, (v) => { F.cat = v; openP = ''; showPanels(); render(); }, 'הכל');
  chipsGrouped($('prefChips'), (k) => F.prefs.has(k), (v) => { F.prefs.has(v) ? F.prefs.delete(v) : F.prefs.add(v); render(); });
  labels();
}
$('clearF').onclick = () => { F = { trip: '', cat: '', prefs: new Set() }; loadWeather(); render(); };
const passR = (r) => (!F.trip || r.trip === F.trip) && (!F.cat || r.cat === F.cat) && [...F.prefs].every((p) => (r.tags || []).includes(p));
const placeTags = (t) => Object.keys(KW).filter((k) => KW[k].test(t));
const wTags = (w) => [...new Set([...(w.tags || []), ...placeTags((w.name || '') + ' ' + (w.text || '') + ' ' + (w.he || ''))])];
// למה המקום מתאים לסינון: מה סומן ב-OpenStreetMap ומה מוזכר בתיאור
function why(w) {
  const out = [];
  if (F.cat && w.cat === F.cat) out.push([T[F.cat], '']);
  for (const p of F.prefs) {
    if ((w.tags || []).includes(p)) out.push([T[p], w.osm ? 'מסומן במפה' : '']);
    else if (wTags(w).includes(p)) out.push([T[p], 'מוזכר בתיאור']);
  }
  return out;
}
const passW = (w) => (!F.cat || w.cat === F.cat) && [...F.prefs].every((p) => wTags(w).includes(p));
const wText = (w) => w.osm ? w.text : ((!isEN && w.he) ? w.he : (w.text || ''));

function rv(r, inS) {
  const tags = [r.trip && `<span class="tag j">${T[r.trip]}</span>`, r.cat && `<span class="tag">${T[r.cat]}</span>`, ...(r.tags || []).map((t) => `<span class="tag">${T[t] || ''}</span>`)].filter(Boolean).join('');
  return `<article class="rv"><div class="top"><div class="who"><span class="av">${esc((r.userName || '?')[0])}</span><div><b>${esc(r.userName)}</b>
    <small><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12l5 5L20 7"/></svg>מטייל מאומת</small></div></div>
    <span class="stars" role="img" aria-label="דירוג ${r.rating} מתוך 5">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span></div>
    <h4>${r.place ? esc(r.place) : (T[r.cat] || 'טיפ')}</h4><p>${esc(r.text)}</p>${videoButton(r.video)}<div class="tags">${tags}</div>
    <div class="foot"><span>${inS ? 'בעונה שלכם · ' : ''}${MONTHS[r.month - 1]} ${r.year}</span><button class="lnk" data-rep="${r.id}">דיווח</button></div></article>`;
}

function render() {
  if (!dest) return;
  drawFilters();
  const m = months();
  const allApproved = reviews;
  const all = reviews.filter(passR);
  const sea = m ? all.filter((r) => m.has(r.month)) : all, oth = m ? all.filter((r) => !m.has(r.month)) : [];
  const active = (F.trip ? 1 : 0) + (F.cat ? 1 : 0) + F.prefs.size;
  $('fCount').textContent = allApproved.length;
  $('fCountT').textContent = `${(m ? allApproved.filter((x) => m.has(x.month)) : allApproved).length} מהעונה שלכם`;
  $('revSub').textContent = `${sea.length} המלצות מהחודשים של הטיול שלכם${active ? ` · ${active} סינונים פעילים` : ''}`;
  $('revMain').innerHTML = loadingR ? loaderBlock('קוראים ביקורות של מטיילים…') : sea.map((r) => rv(r, !!m)).join('') ||
    `<div class="empty" style="grid-column:1/-1"><b>אין עדיין המלצות שמתאימות</b>${active ? 'נסו להסיר חלק מהסינונים, או ' : ''}היו הראשונים לכתוב על ${esc(dest.name)}</div>`;
  $('moreBox').classList.toggle('hidden', !oth.length);
  $('moreSum').textContent = `עוד ${oth.length} המלצות מעונות אחרות ↓`;
  $('revOther').innerHTML = oth.map((r) => rv(r, false)).join('');
  document.querySelectorAll('[data-rep]').forEach((b) => b.onclick = () => report(b.dataset.rep));

  const DIET = ['kosher', 'vegan', 'vegetarian', 'glutenfree', 'halal'];
  const emptyWeb = () => {
    const g = (q) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q + ' ' + dest.enName);
    const k = F.prefs.has('kosher') || F.prefs.has('shabbat');
    return `<div class="empty" style="grid-column:1/-1"><b>${osmFail ? 'לא הצלחנו לטעון כרגע את המקומות מהמפה' : 'לא מצאנו מקומות שמתאימים לסינון'}</b>`
      + `${osmFail ? '<button class="navlink" id="osmRetry">נסו שוב</button> ' : 'נסו להסיר חלק מהסינונים. '}`
      + (k ? `<a href="${g('kosher restaurant')}" target="_blank" rel="noopener">מסעדות כשרות בגוגל מפות</a> · <a href="${g('Chabad')}" target="_blank" rel="noopener">בית חב"ד בגוגל מפות</a>` : '') + '</div>';
  };
  const inLang = (w) => !w.wp || w.wp === (isEN ? 'en' : 'he');
  let W = web.filter((w) => inLang(w) && passW(w));
  if ([...F.prefs].some((p) => DIET.includes(p))) W.sort((a, b) => (b.osm ? 1 : 0) - (a.osm ? 1 : 0));
  $('webSub').textContent = !web.length ? '' : `${W.length} מקומות${active ? ' שמתאימים לסינון' : ''}`;
  $('web').innerHTML = loadingW ? loaderBlock('אוספים המלצות מהרשת…') : W.slice(0, 60).map((w) => {
    const g = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((w.enTitle || w.name) + ' ' + dest.enName);
    const diet = wTags(w).filter((t) => DIET.includes(t)).map((t) => ' · ' + T[t]).join('');
    const tx = wText(w), y = why(w);
    return `<article class="pl"><div class="ph${w.img ? ' img' : ''}"${w.img ? ` style="background-image:url('${esc(w.img)}')"` : ''}>${w.img ? '' : mini(w.cat)}</div><span class="k">${T[w.cat]}${diet}${w.osm ? ' · <i class="osm">OpenStreetMap</i>' : w.wp ? ' · <i class="osm">ויקיפדיה</i>' : ''}</span><h4>${esc(w.name)}</h4>${y.length ? `<div class="why"><b>מתאים לכם:</b> ${y.map(([t, src]) => `<span>✓ <em>${esc(t)}</em>${src ? ` <small>${src}</small>` : ''}</span>`).join('')}</div>` : ''}${tx ? `<p>${esc(tx.slice(0, 240))}${tx.length > 240 ? '…' : ''}</p>` : ''}
      <button class="revbtn" data-q="${esc(w.name + ', ' + dest.enName)}"><span aria-hidden="true">★</span> דירוג וביקורות</button>
      <div class="acts"><a href="${g}" target="_blank" rel="noopener">ביקורות בגוגל</a><a href="https://www.tripadvisor.com/Search?q=${encodeURIComponent(w.name + ' ' + dest.enName)}" target="_blank" rel="noopener">טריפאדווייזר</a>${/^https?:\/\//.test(w.url) ? `<a href="${esc(w.url)}" target="_blank" rel="noopener">${w.wp ? 'ויקיפדיה' : 'אתר'}</a>` : ''}
      <button data-w="${esc(w.name)}" data-c="${w.cat}">כתבו המלצה</button></div></article>`;
  }).join('') || (web.length || osmFail ? emptyWeb() : `<div class="empty" style="grid-column:1/-1"><b>אין מידע מפורט ליעד הזה</b>ראו בקישור למטה</div>`);
  if ($('osmRetry')) $('osmRetry').onclick = () => loadWeb();
  document.querySelectorAll('[data-w]').forEach((b) => b.onclick = () => { $('fPlace').value = b.dataset.w; $('fCat').value = b.dataset.c; $('s-write').scrollIntoView({ behavior: 'smooth' }); });
}

async function report(reviewId) {
  if (!user || user.isAnonymous) { try { await login({ allowGuest: false, reason: 'כדי לדווח צריך חשבון' }); } catch (e) { return; } }
  const reason = prompt('מה הבעיה בהמלצה? (למשל: פרסומת, מידע לא נכון, תוכן פוגעני, פגיעה בפרטיות, לשון הרע או הפרת זכויות יוצרים)');
  if (!reason) return;
  try { await addDoc(collection(db, 'reports'), { reviewId, uid: auth.currentUser.uid, reason: reason.slice(0, 300), createdAt: serverTimestamp() }); toast('תודה, הדיווח נשלח לבדיקה'); }
  catch (e) { toast('לא הצלחתי לשלוח את הדיווח'); }
}

// ================= מקומות מהרשת (Wikivoyage) =================
function splitParams(s) {
  const parts = []; let cur = '', depth = 0;
  for (let i = 0; i < s.length; i++) {
    const two = s.substr(i, 2);
    if (two === '{{' || two === '[[') { depth++; cur += two; i++; continue; }
    if ((two === '}}' || two === ']]') && depth > 0) { depth--; cur += two; i++; continue; }
    if (s[i] === '|' && depth === 0) { parts.push(cur); cur = ''; continue; }
    cur += s[i];
  }
  parts.push(cur);
  const p = {};
  parts.slice(1).forEach((x) => { const k = x.indexOf('='); if (k > 0) p[x.slice(0, k).trim().toLowerCase()] = x.slice(k + 1).trim(); });
  return p;
}
function cleanWiki(t) {
  let s = String(t || '');
  for (let n = 0; n < 5; n++) s = s.replace(/\{\{[^{}]*\}\}/g, '');
  return s.replace(/<ref[^>]*>[\s\S]*?<\/ref>|<ref[^>]*\/>/g, '').replace(/<[^>]+>/g, '')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, '$1').replace(/\[https?:\/\/\S+\s+([^\]]+)\]/g, '$1')
    .replace(/\[https?:\/\/\S+\]/g, '').replace(/'{2,}/g, '').replace(/\s+/g, ' ').trim();
}
export function parseListings(wt) {
  const out = [];
  const re = /\{\{\s*(see|do|eat|drink|buy|sleep|listing)\s*\|/gi;
  let m;
  while ((m = re.exec(wt))) {
    let i = m.index + 2, depth = 1;
    while (i < wt.length && depth > 0) { if (wt.startsWith('{{', i)) { depth++; i += 2; } else if (wt.startsWith('}}', i)) { depth--; i += 2; } else i++; }
    const p = splitParams(wt.slice(m.index + 2, i - 2));
    let type = m[1].toLowerCase();
    if (type === 'listing') type = (p.type || '').toLowerCase();
    const name = cleanWiki(p.name), text = cleanWiki(p.content || p.description || '');
    re.lastIndex = i;
    if (!name) continue;
    const cat = ['see', 'do', 'eat', 'drink', 'buy', 'sleep'].includes(type) ? catFor(type, name, text) : null;
    if (cat) out.push({ cat, name, text, url: (p.url || '').trim() });
  }
  return out;
}
async function loadWeb() {
  web = [];
  const me = dest;
  $('wvLink').href = 'https://en.wikivoyage.org/wiki/' + encodeURIComponent(dest.enName.replace(/ /g, '_'));
  loadingW = true; render();
  const [wv, osm, wp] = await Promise.all([loadWV(dest.enName), loadOSM(dest), loadWiki(dest)]);
  if (me !== dest) return;
  // בלי כפילויות: מקום שמופיע גם בוויקימסע וגם בוויקיפדיה מוצג פעם אחת
  const names = new Set(wv.map((w) => w.name.toLowerCase()));
  web = [...osm, ...wv, ...wp.filter((w) => !names.has((w.enTitle || '').toLowerCase()))];
  await within(translateWeb(wv), 6000); // תיאורים בעברית (נשמרים, אז רק בפעם הראשונה זה לוקח רגע)
  if (me !== dest) return;
  loadingW = false; render();
}

// ---- ויקימסע: הדף של היעד, ואם יש בו מעט מקומות – גם דפי השכונות / הערים שלו ----
const wvText = (t) => fetch(`https://en.wikivoyage.org/w/api.php?action=parse&page=${encodeURIComponent(t)}&prop=wikitext&redirects=1&format=json&formatversion=2&origin=*`)
  .then((r) => r.json()).then((d) => (d.parse ? d.parse.wikitext : '')).catch(() => '');
async function loadWV(title) {
  const wt = await wvText(title);
  let list = parseListings(wt);
  if (list.length >= 25) return list;
  // דפי משנה (שכונות): Paris/Le Marais וכו׳, ואם אין – הערים המרכזיות שמופיעות בדף
  let subs = [];
  try {
    const d = await (await fetch(`https://en.wikivoyage.org/w/api.php?action=query&list=prefixsearch&pssearch=${encodeURIComponent(title + '/')}&pslimit=8&format=json&origin=*`)).json();
    subs = (d.query?.prefixsearch || []).map((x) => x.title);
  } catch (e) {}
  if (!subs.length) {
    const sec = (wt.match(/==\s*(Cities|Districts|Regions)\s*==([\s\S]*?)\n==[^=]/i) || [])[2] || '';
    subs = [...sec.matchAll(/\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]/g)].map((m) => m[1].trim()).filter((t) => !/:/.test(t));
  }
  subs = [...new Set(subs)].slice(0, 5);
  const more = await Promise.all(subs.map((t) => within(wvText(t), 5000).then((w) => parseListings(w || ''))));
  const seen = new Set(list.map((w) => w.name));
  for (const arr of more) for (const w of arr) if (!seen.has(w.name)) { seen.add(w.name); list.push(w); }
  // שילוב: קצת מכל שכונה ולא הכול מהראשונה
  return list;
}

// ---- ויקיפדיה: אתרים ואטרקציות ליד היעד, בעברית ובאנגלית (חינמי, CC BY-SA) ----
async function wikiNear(lang, d) {
  const u = `https://${lang}.wikipedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${d.lat}|${d.lon}&ggsradius=10000&ggslimit=40&ggsnamespace=0`
    + `&prop=extracts|pageimages|description|langlinks&exintro=1&explaintext=1&exsentences=2&exlimit=max&piprop=thumbnail&pithumbsize=400&lllang=en&lllimit=max&format=json&formatversion=2&origin=*`;
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
    const r = await (await fetch(u, { signal: ctl.signal })).json(); clearTimeout(t);
    return (r.query?.pages || []).filter((p) => p.extract && p.extract.length > 60);
  } catch (e) { return []; }
}
// לא מציגים ערים, רחובות, תחנות ומחוזות – רק מקומות שכדאי לבקר בהם
const WP_SKIP = /(city|town|village|municipality|district|neighbou?rhood|commune|county|province|region|street|road|avenue|railway|metro|station|airport|bridge over|river in|electoral|company|school|university|hospital|embassy|hotel chain|עיר|כפר|רובע|שכונה|מחוז|רחוב|תחנת|נמל תעופה|בית ספר|אוניברסיט|בית חולים|שגרירות|חברה)/i;
async function loadWiki(d) {
  if (d.lat == null) return [];
  const [he, en] = await Promise.all([wikiNear('he', d), wikiNear('en', d)]);
  const mk = (p, lang) => {
    const desc = p.description || '';
    if (WP_SKIP.test(desc) || WP_SKIP.test(p.extract.slice(0, 90)) && !/(museum|palace|castle|temple|church|cathedral|park|garden|square|market|monument|מוזיאון|ארמון|מבצר|מקדש|כנסייה|קתדרלה|פארק|גן|כיכר|שוק|אנדרטה)/i.test(desc + p.extract.slice(0, 90))) return null;
    const enTitle = lang === 'en' ? p.title : (p.langlinks || []).find((l) => l.lang === 'en')?.title || '';
    const t = desc + ' ' + p.title + ' ' + p.extract.slice(0, 120);
    const cat = /(synagogue|בית כנסת|חב"ד)/i.test(t) ? 'jewish' : /(museum|gallery|מוזיאון|גלריה)/i.test(t) ? 'museum' : /(beach|חוף)/i.test(t) ? 'beach'
      : /(park|garden|nature reserve|mountain|lake|waterfall|פארק|גן |שמורת|הר |אגם|מפל)/i.test(t) ? 'nature' : /(market|שוק)/i.test(t) ? 'streetfood' : /(restaurant|מסעדה)/i.test(t) ? 'food' : 'see';
    return { wp: lang, cat, name: p.title, enTitle, text: p.extract, he: lang === 'he' ? p.extract : '', img: p.thumbnail?.source || '',
      url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}` };
  };
  return [...he.map((p) => mk(p, 'he')), ...en.map((p) => mk(p, 'en'))].filter(Boolean);
}

// ---- מקומות כשרים / טבעוניים / ללא גלוטן / חלאל ובתי כנסת מ-OpenStreetMap (חינמי, ODbL) ----
const OSM_SETS = [
  ['kosher', '["diet:kosher"~"^(yes|only)$"]'], ['vegan', '["diet:vegan"~"^(yes|only)$"]'], ['glutenfree', '["diet:gluten_free"~"^(yes|only)$"]'],
  ['halal', '["diet:halal"~"^(yes|only)$"]'], ['vegetarian', '["diet:vegetarian"="only"]'], ['jewish', '["amenity"="place_of_worship"]["religion"="jewish"]'],
];
let osmFail = false;
async function loadOSM(d) {
  if (d.lat == null) return [];
  const R = 20000, at = `(around:${R},${d.lat},${d.lon})`;
  const q = '[out:json][timeout:20];' + OSM_SETS.map(([k, f], i) => `nwr${f}${at}->.s${i};.s${i} out center tags 40;`).join('');
  osmFail = false;
  // כמה שרתים של OpenStreetMap: אם אחד עמוס או איטי, מנסים את הבא
  for (const base of ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter']) {
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 12000);
      const r = await fetch(base, { method: 'POST', body: 'data=' + encodeURIComponent(q), signal: ctl.signal });
      clearTimeout(t);
      if (!r.ok) continue;
      const els = (await r.json()).elements || [];
      const seen = new Set();
      return els.filter((e) => e.tags && e.tags.name && !seen.has(e.id) && seen.add(e.id)).map(osmItem);
    } catch (e) {}
  }
  osmFail = true;
  return [];
}
function osmItem(e) {
  const g = e.tags;
  const tags = [];
  if (/^(yes|only)$/.test(g['diet:kosher'] || '')) tags.push('kosher');
  if (/^(yes|only)$/.test(g['diet:vegan'] || '')) tags.push('vegan');
  if (/^(yes|only)$/.test(g['diet:vegetarian'] || '')) tags.push('vegetarian');
  if (/^(yes|only)$/.test(g['diet:gluten_free'] || '')) tags.push('glutenfree');
  if (/^(yes|only)$/.test(g['diet:halal'] || '')) tags.push('halal');
  if (g.wheelchair === 'yes') tags.push('access');
  const am = g.amenity || '', sh = g.shop || '';
  const cat = am === 'place_of_worship' ? 'jewish' : /cafe|ice_cream/.test(am) ? 'cafe' : sh ? 'shop' : 'food';
  const it = { osm: true, g, cat, tags, url: g.website || g['contact:website'] || '' };
  Object.defineProperty(it, 'name', { get: () => (isEN ? g['name:en'] : g['name:he']) || g.name });
  Object.defineProperty(it, 'text', { get: () => osmText(g, tags) });
  return it;
}
function osmText(g, tags) {
  const am = g.amenity || '', sh = g.shop || '', E = isEN;
  const chabad = /chabad|habad|lubavitch|חב"ד/i.test((g.name || '') + (g.operator || ''));
  const K = E ? { restaurant: 'Restaurant', fast_food: 'Fast food', cafe: 'Café', ice_cream: 'Ice cream', bar: 'Bar', place_of_worship: chabad ? 'Chabad house' : 'Synagogue', supermarket: 'Supermarket', bakery: 'Bakery', butcher: 'Butcher', shop: 'Shop', other: 'Place' }
    : { restaurant: 'מסעדה', fast_food: 'מזון מהיר', cafe: 'בית קפה', ice_cream: 'גלידריה', bar: 'בר', place_of_worship: chabad ? 'בית חב"ד' : 'בית כנסת', supermarket: 'סופרמרקט', bakery: 'מאפייה', butcher: 'קצביה', shop: 'חנות', other: 'מקום' };
  const kind = K[am] || K[sh] || (sh ? K.shop : K.other);
  const addr = [g['addr:street'] && (g['addr:street'] + (g['addr:housenumber'] ? ' ' + g['addr:housenumber'] : '')), g['addr:city']].filter(Boolean).join(', ');
  const kos = tags.includes('kosher') ? (E ? ' · kosher' + (/only/.test(g['diet:kosher']) ? ' (fully)' : '') : ' כשר' + (/only/.test(g['diet:kosher']) ? ' (מלא)' : '')) : '';
  return [kind + kos, g.cuisine && ((E ? 'Cuisine: ' : 'מטבח: ') + g.cuisine.replace(/;/g, ', ')), addr && ((E ? 'Address: ' : 'כתובת: ') + addr),
    g.opening_hours && ((E ? 'Hours: ' : 'שעות: ') + g.opening_hours), g['kosher:certification'] && ((E ? 'Supervision: ' : 'השגחה: ') + g['kosher:certification'])].filter(Boolean).join(' · ');
}

// ---- תרגום תיאורי ויקימסע לעברית: קודם מהזיכרון במסד הנתונים, ומה שחסר דרך השרת ----
async function sha1(t) { const b = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); }
async function translateWeb(list) {
  if (isEN || !list.length) return;
  const items = list.slice(0, 30).filter((w) => w.text && !w.he);
  await Promise.all(items.map(async (w) => {
    try { const d = await getDoc(doc(db, 'trCache', 'he-' + await sha1(w.text.slice(0, 480)))); if (d.exists()) w.he = d.data().t; } catch (e) {}
  }));
  const miss = items.filter((w) => !w.he);
  if (!miss.length) return;
  try {
    const r = await fetch(SERVER_URL + '/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: 'he', texts: miss.map((w) => w.text.slice(0, 480)) }) });
    const { out = [] } = await r.json();
    miss.forEach((w, i) => { if (out[i]) w.he = out[i]; });
  } catch (e) {}
}
window.addEventListener('langchange', async () => { // החלפת שפה בלי לטעון מחדש
  if (dest) {
    const x = extraById(String(dest.id));
    if (x) { dest.name = isEN ? x.en : x.he; dest.country = isEN ? x.countryEn : x.country; }
    else { try { const g = await (await fetch(`https://geocoding-api.open-meteo.com/v1/get?id=${dest.id}&language=${isEN ? 'en' : 'he'}`)).json(); dest.name = g.name; dest.country = g.country || ''; } catch (e) {} }
    $('dName').textContent = dest.name; $('dCountry').textContent = dest.country; $('wName').textContent = dest.name;
    if (!isEN) await within(translateWeb(web.filter((w) => !w.osm && !w.wp)), 6000);
    render();
  }
});

// ================= טופס המלצה =================
$('fCat').innerHTML = CATS.map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
$('fTrip').innerHTML = TRIPS.map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
$('fMonth').innerHTML = MONTHS.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('');
$('fMonth').value = new Date().getMonth() + 1;
const Y = new Date().getFullYear();
$('fYear').innerHTML = Array.from({ length: 11 }, (_, i) => `<option>${Y - i}</option>`).join('');
const fTags = new Set();
function drawTags() { chipsGrouped($('fTags'), (k) => fTags.has(k), (v) => { fTags.has(v) ? fTags.delete(v) : fTags.add(v); drawTags(); }); }
drawTags();
function drawRate() {
  $('rate').innerHTML = [1, 2, 3, 4, 5].map((i) => `<button type="button" class="${i <= rating ? 'on' : ''}" data-r="${i}" aria-label="${i} כוכבים">★</button>`).join('');
  $('rate').querySelectorAll('button').forEach((b) => b.onclick = () => { rating = +b.dataset.r; drawRate(); });
}
drawRate();
const fmsg = (t, c = 'info') => $('fMsg').innerHTML = t ? `<div class="msg ${c}">${esc(t)}</div>` : '';

async function api(path, body) {
  const token = await auth.currentUser.getIdToken();
  const r = await fetch(SERVER_URL + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'שגיאה בשרת');
  return d;
}

$('send').onclick = async () => {
  const review = {
    dest: dest.name, destKey: dest.key, cat: $('fCat').value, trip: $('fTrip').value, tags: [...fTags],
    place: $('fPlace').value, text: $('fText').value, rating, month: +$('fMonth').value, year: +$('fYear').value,
  };
  if (review.text.trim().length < 30) { fmsg('ההמלצה קצרה מדי – כתבו לפחות 30 תווים', 'err'); return; }
  const vurl = $('fVideo').value.trim();
  if (vurl && parseVideo(vurl) === false) { fmsg('הקישור לסרטון לא נראה תקין. העתיקו אותו מכפתור "שיתוף" בטיקטוק או באינסטגרם.', 'err'); $('fVideo').focus(); return; }
  review.videoUrl = vurl;
  if (!$('fAgree').checked) { fmsg('כדי לשלוח, סמנו את תיבת ההצהרה ואת ההסכמה לתנאי השימוש', 'err'); $('fAgree').focus(); return; }
  review.agree = true;
  if (!window.PublicKeyCredential) { fmsg('הדפדפן הזה לא תומך בטביעת אצבע / Face ID. נסו מהטלפון בדפדפן מעודכן.', 'err'); return; }
  if (!user || user.isAnonymous) { try { await login({ allowGuest: false, reason: 'כדי לכתוב המלצה צריך חשבון, כדי שנדע שאתם אנשים אמיתיים' }); } catch (e) { return; } }
  if (!auth.currentUser.emailVerified) { await auth.currentUser.reload().catch(() => {}); }
  if (!auth.currentUser.emailVerified) { fmsg('כמעט סיימנו: אשרו את כתובת המייל דרך הקישור ששלחנו אליכם, ואז שלחו שוב. לא קיבלתם? לחצו על שם החשבון למעלה ← "שליחת מייל אימות שוב".', 'err'); return; }
  $('send').disabled = true; $('send').classList.add('busy');
  try {
    fmsg('מתחבר… (בפעם הראשונה זה יכול לקחת עד דקה)');
    const st = await api('/passkey/status');
    if (!st.registered) {
      fmsg('פעם ראשונה: מאשרים את הטלפון שלכם עם טביעת אצבע או Face ID');
      const opts = await api('/passkey/register/options', {});
      await api('/passkey/register/verify', await startRegistration(opts));
    }
    fmsg('מאשרים את ההמלצה עם טביעת אצבע או Face ID');
    const assertion = await startAuthentication(await api('/review/options', {}));
    await api('/review/submit', { assertion, review });
    fmsg('תודה. ההמלצה נשלחה ותופיע באתר אחרי אישור.', 'ok');
    $('fText').value = ''; $('fPlace').value = ''; $('fVideo').value = ''; $('fAgree').checked = false; fTags.clear(); drawTags();
  } catch (e) {
    fmsg(e.name === 'NotAllowedError' ? 'האימות בוטל. נסו שוב.' : e.message, 'err');
  } finally { $('send').disabled = false; $('send').classList.remove('busy'); }
};

// תאריכי ברירת מחדל: שבוע, בעוד חודש
// תאריכים: מתחילים מהיום, ואי אפשר לבחור תאריך שכבר עבר
const localISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
(() => {
  const a = new Date(), b = new Date(); b.setDate(b.getDate() + 7);
  ['from', 'from2', 'to', 'to2'].forEach((id) => { $(id).min = localISO(a); });
  $('from').value = localISO(a); $('to').value = localISO(b); sync(false);
})();
wzShow();

// שורת "איזה טיול אתם מתכננים?"
$('inspo').innerHTML = TRIPS.slice(0, 8).map(([k, v]) => `<button type="button" class="ins" data-t="${k}"><span class="ins-ph">${mini(TRIP_ICON[k])}</span><b>${v}</b></button>`).join('');
document.querySelectorAll('.ins').forEach((b) => b.onclick = () => { W.trip = b.dataset.t; wzShow(); $('wz').scrollIntoView({ behavior: 'smooth', block: 'center' }); toast('נבחר: ' + T[b.dataset.t]); });

// רמז גלילה בתחתית התמונה
document.querySelectorAll('.cue').forEach((c) => c.onclick = () => document.getElementById(c.dataset.go).scrollIntoView({ behavior: 'smooth', block: 'start' }));
addEventListener('scroll', () => document.querySelectorAll('.cue').forEach((c) => c.classList.toggle('gone', scrollY > 60)), { passive: true });

// שפה: כפתור החלפה בתפריט העליון, ותרגום הממשק לאנגלית כשנבחרה
$('langSlot').replaceWith(langButton());
startI18n();
