// סרטונים מטיקטוק ואינסטגרם שמטיילים מצרפים לביקורת.
// מוטמעים רק בלחיצה, כדי שהאתר לא יטען תוכן של צד שלישי בלי שהגולש בחר בזה.
export function parseVideo(url) {
  const u = String(url || '').trim();
  if (!u) return null;
  let m = u.match(/^https?:\/\/(?:www\.|m\.)?tiktok\.com\/@[\w.\-]{1,40}\/video\/(\d{8,25})/i);
  if (m) return { p: 'tt', id: m[1] };
  m = u.match(/^https?:\/\/(?:vm|vt)\.tiktok\.com\/([\w]{5,20})\/?/i);
  if (m) return { p: 'tts', id: m[1] };
  m = u.match(/^https?:\/\/(?:www\.)?instagram\.com\/(?:[\w.]{1,40}\/)?(p|reel|reels)\/([\w-]{5,40})/i);
  if (m) return { p: 'ig', k: m[1] === 'p' ? 'p' : 'reel', id: m[2] };
  return false;
}
export function videoButton(v) {
  if (!v || !v.p || !v.id) return '';
  const name = v.p === 'ig' ? 'אינסטגרם' : 'טיקטוק';
  return `<button class="vid ${v.p}" data-vp="${v.p}" data-vk="${v.k || ''}" data-vid="${String(v.id).replace(/[^\w-]/g, '')}">
    <span class="play" aria-hidden="true">▶</span><span><b>צפו בסרטון מ${name}</b><small>ייטען מ${name} בלחיצה</small></span></button>`;
}
export function videoFrame(p, k, id) {
  const src = p === 'ig' ? `https://www.instagram.com/${k === 'p' ? 'p' : 'reel'}/${id}/embed/` : `https://www.tiktok.com/player/v1/${id}?description=1&music_info=0`;
  return `<div class="vframe ${p}"><iframe src="${src}" title="סרטון מצורף" loading="lazy" allow="encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
}
document.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('button.vid');
  if (!b) return;
  b.outerHTML = videoFrame(b.dataset.vp, b.dataset.vk, b.dataset.vid);
});
