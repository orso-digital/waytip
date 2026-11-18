// דירוג וביקורות מהרשת, בחינם: כרטיס המקום של גוגל מפות מוטמע בלחיצה (מציג ציון, מספר ביקורות וקישור לביקורות).
// נטען רק בלחיצה, כדי לא להעביר מידע לגוגל בלי שהגולש בחר בזה.
document.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('button.revbtn');
  if (!b) return;
  const q = encodeURIComponent(b.dataset.q || '');
  b.outerHTML = `<div class="revframe"><iframe src="https://www.google.com/maps?q=${q}&output=embed&hl=iw" title="דירוג וביקורות בגוגל מפות" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    <small>הדירוג והביקורות מוצגים מתוך גוגל מפות. לחצו על "ביקורות" בכרטיס כדי לקרוא אותן.</small></div>`;
});
