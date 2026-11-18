// טעינה של WayTip: הלוגו במרכז ועיגול שמסתובב סביבו
export const MARK = 'assets/mark-color.png';
export function loaderSVG(size = 72) {
  return `<span class="wtspin" style="--s:${size}px" aria-hidden="true"><img src="${MARK}" alt=""></span>`;
}
export function loaderBlock(text) {
  return `<div class="wtload" role="status">${loaderSVG(56)}<span>${text}</span></div>`;
}
const MSGS = ['אוספים המלצות מהרשת…', 'קוראים ביקורות של מטיילים…', 'בודקים מזג אוויר לתאריכים שלכם…', 'מסננים לפי אופי הטיול…'];
let timer = null;
export function showLoader() {
  let el = document.getElementById('wtOverlay');
  if (!el) {
    el = document.createElement('div'); el.id = 'wtOverlay'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
    el.innerHTML = `${loaderSVG(96)}<b>WayTip</b><span id="wtMsg"></span>`;
    document.body.appendChild(el);
  }
  let i = 0; const m = el.querySelector('#wtMsg'); m.textContent = MSGS[0];
  clearInterval(timer); timer = setInterval(() => { i = (i + 1) % MSGS.length; m.textContent = MSGS[i]; }, 1400);
  requestAnimationFrame(() => el.classList.add('on'));
}
export function hideLoader() {
  clearInterval(timer);
  const el = document.getElementById('wtOverlay'); if (el) el.classList.remove('on');
}
