// חלון התחברות: גוגל, מייל וסיסמה, או כניסה כאורח
import { auth, loginGoogle, signupEmail, loginEmail, resetPassword, loginGuest, loginToken } from './firebase.js?v=2611200133';
import { SERVER_URL } from './config.js?v=2611200133';
import { startAuthentication } from 'https://cdn.jsdelivr.net/npm/@simplewebauthn/browser@10.0.0/+esm';
const canPasskey = () => !!(window.PublicKeyCredential && navigator.credentials);
// כניסה עם טביעת אצבע / Face ID: השרת מאמת ומחזיר כניסה חד-פעמית
async function passkeyLogin() {
  const post = async (path, body) => {
    const r = await fetch(SERVER_URL + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
    const d = await r.json().catch(() => ({})); if (!r.ok) throw Object.assign(new Error(d.error || 'משהו השתבש, נסו שוב'), { server: true }); return d;
  };
  const { sid, options } = await post('/passkey/login/options');
  const response = await startAuthentication(options);
  const { token } = await post('/passkey/login/verify', { sid, response });
  return loginToken(token);
}

const ERR = {
  'auth/invalid-email': 'כתובת המייל לא תקינה',
  'auth/missing-password': 'חסרה סיסמה',
  'auth/weak-password': 'הסיסמה חלשה מדי: לפחות 6 תווים',
  'auth/email-already-in-use': 'כבר יש חשבון עם המייל הזה. נסו "התחברות"',
  'auth/invalid-credential': 'המייל או הסיסמה לא נכונים',
  'auth/wrong-password': 'המייל או הסיסמה לא נכונים',
  'auth/user-not-found': 'לא מצאנו חשבון עם המייל הזה',
  'auth/too-many-requests': 'יותר מדי ניסיונות. נסו שוב בעוד כמה דקות',
  'auth/popup-blocked': 'הדפדפן חסם את החלון של גוגל. אפשרו חלונות קופצים ונסו שוב',
  'auth/network-request-failed': 'אין חיבור לאינטרנט',
  'auth/admin-restricted-operation': 'שיטת ההתחברות הזאת עדיין לא הופעלה',
  'auth/operation-not-allowed': 'שיטת ההתחברות הזאת עדיין לא הופעלה',
};
const msg = (e) => ERR[e && e.code] || 'משהו השתבש, נסו שוב';

let resolver = null, mode = 'login';
function el() {
  let d = document.getElementById('authBox');
  if (d) return d;
  d = document.createElement('div');
  d.id = 'authBox'; d.className = 'authbox hidden'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'authT');
  d.innerHTML = `<div class="authcard">
    <button class="ax" data-ax aria-label="סגירה">✕</button>
    <img src="assets/mark-color.png" alt="" class="alogo">
    <h3 id="authT">כניסה ל-WayTip</h3>
    <p class="asub" id="authSub">כדי לשמור יעדים ולכתוב המלצות</p>
    <button class="gbtn" id="aGoogle"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>המשך עם Google</button>
    <button class="pkbtn hidden" id="aPasskey"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M7.5 4.2A9 9 0 0 1 21 12c0 2-.3 3.9-.9 5.6M4.2 7.7A9 9 0 0 0 3 12c0 1.4.2 2.7.6 4M12 21c-1.5-2.4-2.3-5.3-2.3-9a2.3 2.3 0 1 1 4.6 0c0 2.6-.4 5.1-1.2 7.4M16.5 12c0 3-.6 5.8-1.6 8.3M7.6 12a4.4 4.4 0 0 1 8.8 0"/></svg>כניסה עם טביעת אצבע / Face ID</button>
    <div class="aor"><span>או עם מייל</span></div>
    <div class="atabs" role="tablist"><button data-mode="login" class="on" role="tab">התחברות</button><button data-mode="signup" role="tab">הרשמה</button></div>
    <label for="aName" class="aname hidden">שם (יופיע ליד ההמלצות שלכם)</label><input id="aName" class="aname hidden" autocomplete="name" maxlength="40">
    <label for="aEmail">מייל</label><input id="aEmail" type="email" dir="ltr" autocomplete="email" inputmode="email">
    <label for="aPass">סיסמה</label><input id="aPass" type="password" dir="ltr" autocomplete="current-password" minlength="6">
    <div class="amsg" id="aMsg" role="status"></div>
    <button class="btn w" id="aGo">התחברות</button>
    <button class="lnk aforgot" id="aForgot">שכחתי סיסמה</button>
    <button class="lnk aguest" id="aGuest">המשך כאורח</button>
    <p class="aterms">בהתחברות אתם מסכימים ל<a href="terms.html" target="_blank">תנאי השימוש</a> ול<a href="privacy.html" target="_blank">מדיניות הפרטיות</a>. כאורח אפשר לשמור יעדים; כדי לכתוב המלצה צריך חשבון עם מייל מאומת.</p>
  </div>`;
  document.body.appendChild(d);
  const $ = (id) => d.querySelector('#' + id);
  const say = (t, ok) => { $('aMsg').textContent = t; $('aMsg').className = 'amsg' + (ok ? ' ok' : t ? ' err' : ''); };
  const done = (r) => { close(); if (resolver) { resolver.res(r); resolver = null; } };
  const busy = (b, on) => { b.disabled = on; b.classList.toggle('busy', on); };
  d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-ax]')) { close(); if (resolver) { resolver.rej(new Error('cancel')); resolver = null; } } });
  d.querySelectorAll('[data-mode]').forEach((b) => b.onclick = () => setMode(b.dataset.mode));
  $('aGoogle').onclick = async () => { say(''); try { done(await loginGoogle()); } catch (e) { if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') say(msg(e)); } };
  $('aGo').onclick = async () => {
    const email = $('aEmail').value.trim(), pass = $('aPass').value;
    say(''); busy($('aGo'), true);
    try {
      if (mode === 'signup') {
        const r = await signupEmail($('aName').value.trim(), email, pass);
        say('נרשמתם! שלחנו לכם מייל לאימות הכתובת. אחרי שתלחצו על הקישור במייל תוכלו לכתוב המלצות.', true);
        setTimeout(() => done(r), 2600);
      } else done(await loginEmail(email, pass));
    } catch (e) { say(msg(e)); } finally { busy($('aGo'), false); }
  };
  $('aForgot').onclick = async () => {
    const email = $('aEmail').value.trim();
    if (!email) { say('כתבו את המייל שלכם ואז לחצו שוב על "שכחתי סיסמה"'); $('aEmail').focus(); return; }
    try { await resetPassword(email); say('אם יש חשבון עם המייל הזה, שלחנו אליו קישור לאיפוס סיסמה.', true); } catch (e) { say(msg(e)); }
  };
  $('aPasskey').onclick = async () => {
    say(''); busy($('aPasskey'), true);
    try { done(await passkeyLogin()); }
    catch (e) { if (e.server) say(e.message); else if (e.name !== 'NotAllowedError' && e.name !== 'AbortError') say(msg(e)); }
    finally { busy($('aPasskey'), false); }
  };
  $('aGuest').onclick = async () => { say(''); try { done(await loginGuest()); } catch (e) { say(msg(e)); } };
  d.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); if (resolver) { resolver.rej(new Error('cancel')); resolver = null; } } if (e.key === 'Enter' && e.target.tagName === 'INPUT') $('aGo').click(); });
  return d;
}
function setMode(m) {
  mode = m; const d = el();
  d.querySelectorAll('[data-mode]').forEach((b) => { b.classList.toggle('on', b.dataset.mode === m); b.setAttribute('aria-selected', b.dataset.mode === m); });
  d.querySelectorAll('.aname').forEach((x) => x.classList.toggle('hidden', m !== 'signup'));
  d.querySelector('#aGo').textContent = m === 'signup' ? 'יצירת חשבון' : 'התחברות';
  d.querySelector('#aPass').autocomplete = m === 'signup' ? 'new-password' : 'current-password';
  d.querySelector('#aForgot').classList.toggle('hidden', m === 'signup');
}
function close() { el().classList.add('hidden'); document.body.classList.remove('noscroll'); }
// פותח את החלון ומחזיר הבטחה שמתממשת כשהמשתמש התחבר
export function openAuth({ reason = '', allowGuest = true, signup = false } = {}) {
  const d = el(); setMode(signup ? 'signup' : 'login');
  d.querySelector('#authSub').textContent = reason || 'כדי לשמור יעדים ולכתוב המלצות';
  d.querySelector('#aGuest').classList.toggle('hidden', !allowGuest || (auth.currentUser && auth.currentUser.isAnonymous));
  d.querySelector('#aPasskey').classList.toggle('hidden', !canPasskey());
  d.querySelector('#aMsg').textContent = '';
  d.classList.remove('hidden'); document.body.classList.add('noscroll');
  setTimeout(() => d.querySelector('#aGoogle').focus(), 50);
  return new Promise((res, rej) => { resolver = { res, rej }; });
}
