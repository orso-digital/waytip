// תפריט נגישות (לפי ת"י 5568 / WCAG 2.0 AA): התאמות תצוגה שהגולש בוחר, נשמרות בדפדפן
const KEY = 'waytip.a11y';
const EN = false; // התוויות בעברית; i18n.js מתרגם אותן כשבוחרים אנגלית
const L = {
  open: 'תפריט נגישות', title: 'נגישות', close: 'סגירה',
  bigger: 'הגדלת טקסט', smaller: 'הקטנת טקסט', contrast: 'ניגודיות גבוהה', gray: 'גווני אפור', links: 'הדגשת קישורים',
  font: 'גופן קריא', spacing: 'ריווח שורות', motion: 'עצירת אנימציות', cursor: 'סמן גדול', focus: 'מסגרת מיקוד בולטת',
  reset: 'איפוס הגדרות', statement: 'הצהרת נגישות', size: 'גודל טקסט',
};
const TOGGLES = ['contrast', 'gray', 'links', 'font', 'spacing', 'motion', 'cursor', 'focus'];
let st = { size: 0 };
try { st = { size: 0, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
function apply() {
  const h = document.documentElement;
  TOGGLES.forEach((t) => h.classList.toggle('a11y-' + t, !!st[t]));
  h.style.fontSize = st.size ? (100 + st.size * 12.5) + '%' : '';
  document.querySelectorAll('#a11yPanel [data-t]').forEach((b) => b.setAttribute('aria-pressed', !!st[b.dataset.t]));
  const s = document.getElementById('a11ySize'); if (s) s.textContent = (100 + st.size * 12.5) + '%';
}
apply();

const icon = '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><circle cx="12" cy="3.6" r="2.1"/><path d="M4.5 7.2c2.4.7 4.9 1 7.5 1s5.1-.3 7.5-1l.5 1.8c-2 .6-4.1 1-6.2 1.1v3.4l2.1 7.3-1.8.5-2.1-6.6-2.1 6.6-1.8-.5 2.1-7.3V10.1C8.1 10 6 9.6 4 9z"/></svg>';
const btn = document.createElement('button');
btn.id = 'a11yBtn'; btn.className = 'a11ybtn'; btn.type = 'button';
btn.setAttribute('aria-label', L.open); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'a11yPanel');
btn.innerHTML = icon;
const panel = document.createElement('div');
panel.id = 'a11yPanel'; panel.className = 'a11ypanel hidden'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', L.title);
const stmt = (location.pathname.includes('/admin') ? '' : 'accessibility.html');
panel.innerHTML = `<div class="a11y-h"><b>${L.title}</b><button type="button" class="a11y-x" data-close aria-label="${L.close}">✕</button></div>
  <div class="a11y-size" role="group" aria-label="${L.size}"><button type="button" data-size="-1" aria-label="${L.smaller}">${EN ? "A-" : "א-"}</button><span id="a11ySize" aria-live="polite">100%</span><button type="button" data-size="1" aria-label="${L.bigger}">${EN ? "A+" : "א+"}</button></div>
  <div class="a11y-grid">${TOGGLES.map((t) => `<button type="button" data-t="${t}" aria-pressed="false">${L[t]}</button>`).join('')}</div>
  <button type="button" class="a11y-reset" data-reset>${L.reset}</button>
  ${stmt ? `<a class="a11y-st" href="${stmt}">${L.statement}</a>` : ''}`;
function open(on) {
  panel.classList.toggle('hidden', !on); btn.setAttribute('aria-expanded', on);
  if (on) panel.querySelector('button').focus(); else btn.focus();
}
btn.onclick = () => open(panel.classList.contains('hidden'));
panel.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.close !== undefined) return open(false);
  if (b.dataset.size) st.size = Math.max(-2, Math.min(5, st.size + Number(b.dataset.size)));
  if (b.dataset.t) st[b.dataset.t] = !st[b.dataset.t];
  if (b.dataset.reset !== undefined) st = { size: 0 };
  save(); apply();
});
panel.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') open(false);
  if (e.key === 'Tab') { // שומרים את הפוקוס בתוך התפריט
    const f = [...panel.querySelectorAll('button,a')]; const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
document.addEventListener('click', (e) => { if (!panel.classList.contains('hidden') && !e.target.closest('#a11yPanel,#a11yBtn')) open(false); });
const mount = () => { document.body.appendChild(btn); document.body.appendChild(panel); apply(); };
if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
