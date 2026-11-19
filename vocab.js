// רשימות קבועות – משותפות לאתר ולדף הניהול (והשרת בודק מול אותם מפתחות)
export const TRIPS = [
  ['couple', 'זוגות'], ['honeymoon', 'ירח דבש'], ['army', 'טיול אחרי צבא'], ['backpack', 'תרמילאים'],
  ['solo', 'סולו'], ['girls', 'טיול בנות'], ['friends', 'חברים'], ['bachelor', 'מסיבת רווקים / רווקות'],
  ['family', 'משפחה עם ילדים קטנים'], ['teens', 'משפחה עם נוער'], ['multigen', 'משפחה מורחבת'],
  ['seniors', 'גיל הזהב'], ['business', 'עסקים'], ['short', 'סופ"ש קצר'],
];
export const CATS = [
  ['food', 'אוכל ומסעדות'], ['cafe', 'בתי קפה וקינוחים'], ['streetfood', 'שווקים ואוכל רחוב'],
  ['see', 'אטרקציות ואתרים'], ['museum', 'מוזיאונים ותרבות'], ['tour', 'סיורים מודרכים'],
  ['nature', 'טבע ונופים'], ['hike', 'מסלולי הליכה'], ['beach', 'חופים'],
  ['kidsfun', 'פעילויות לילדים'], ['sport', 'ספורט ואקסטרים'], ['spa', 'ספא ורגיעה'],
  ['night', 'בילוי וחיי לילה'], ['shop', 'קניות'], ['stay', 'לינה'],
  ['jewish', 'בתי חב"ד ובתי כנסת'], ['transport', 'תחבורה והתניידות'], ['tip', 'טיפים כלליים'],
];
// העדפות, מחולקות לקבוצות
export const PREF_GROUPS = [
  ['אוכל', [['kosher', 'כשר'], ['vegan', 'טבעוני'], ['vegetarian', 'צמחוני'], ['glutenfree', 'ללא גלוטן'], ['halal', 'חלאל']]],
  ['תקציב', [['free', 'בחינם'], ['budget', 'חסכוני'], ['mid', 'בינוני'], ['luxury', 'יוקרתי']]],
  ['מתאים ל…', [['kids', 'ילדים'], ['babies', 'תינוקות ועגלות'], ['access', 'כיסא גלגלים'], ['pets', 'כלבים'], ['shabbat', 'שומרי שבת'], ['hebrew', 'דוברי עברית']]],
  ['אווירה', [['romantic', 'רומנטי'], ['quiet', 'שקט ורגוע'], ['view', 'נוף מרהיב'], ['local', 'מקומי ולא תיירותי'], ['rainy', 'מתאים ליום גשום']]],
];
export const PREFS = PREF_GROUPS.flatMap(([, list]) => list);
export const T = Object.fromEntries([...TRIPS, ...CATS, ...PREFS]);

// מילות מפתח לסינון המקומות מהרשת (התיאורים באנגלית)
export const KW = {
  kosher: /kosher|(?:^|[^א-ת])כשר(?:ה|ות|ים)?(?![א-ת])/i, vegan: /vegan|plant-based|טבעונ/i, vegetarian: /vegetarian|vegan|veggie|צמחונ|טבעונ/i, glutenfree: /gluten|גלוטן/i, halal: /halal|חלאל/i,
  free: /\bfree\b|no charge|free entry|free admission|כניסה חופשית|ללא תשלום|בחינם/i, budget: /cheap|budget|inexpensive|affordable|bargain|זול|במחיר נמוך/i,
  mid: /moderate|mid-range|reasonabl/i, luxury: /luxur|upscale|fine dining|michelin|elegant|five-star|5-star|יוקרה|מישלן/i,
  kids: /kids|children|family|families|zoo|playground|aquarium|ילדים|משפחות|גן חיות|אקווריום|מגרש משחקים/i, babies: /stroller|pram|baby|babies|infant|תינוק|עגלה/i,
  access: /wheelchair|accessible|נגיש|כיסא גלגלים/i, pets: /\bdogs?\b|pet-friendly|pets/i, shabbat: /chabad|synagogue|kosher|shabbat|חב"ד|בית כנסת|(?:^|[^א-ת])כשר(?:ה|ות|ים)?(?![א-ת])|שבת/i,
  hebrew: /hebrew|israeli|עברית|ישראלי/i, romantic: /romantic|sunset|candle|רומנטי|שקיעה/i, quiet: /quiet|peaceful|tranquil|calm|שקט|רגוע/i,
  view: /view|panoram|lookout|viewpoint|תצפית|נוף(?!ש)|פנורמ/i, local: /local|authentic|traditional|off the beaten|מקומי|אותנטי|מסורתי/i,
  rainy: /indoor|museum|gallery|covered|aquarium|mall|מקורה|מוזיאון|גלריה|אקווריום|קניון/i,
};

// שיוך מקום מ-Wikivoyage לקטגוריה
export function catFor(type, name, text) {
  const t = (name + ' ' + text);
  if (/synagogue|chabad|jewish/i.test(t)) return 'jewish';
  if (type === 'eat') {
    if (/caf[eé]|coffee|bakery|patisserie|gelat|ice cream|dessert|pastr/i.test(t)) return 'cafe';
    if (/market|street food|food court|stall|hawker/i.test(t)) return 'streetfood';
    return 'food';
  }
  if (type === 'drink') return /caf[eé]|coffee|tea house/i.test(t) ? 'cafe' : 'night';
  if (type === 'buy') return /market/i.test(t) && /food/i.test(t) ? 'streetfood' : 'shop';
  if (type === 'sleep') return 'stay';
  if (/museum|gallery|theatre|theater|opera|exhibition/i.test(t)) return 'museum';
  if (/zoo|aquarium|playground|theme park|amusement|water park|legoland|disney/i.test(t)) return 'kidsfun';
  if (/spa\b|thermal|hammam|sauna|bath(s|house)?\b|onsen|massage/i.test(t)) return 'spa';
  if (/beach|bay\b|cove/i.test(t)) return 'beach';
  if (/hike|hiking|trail|trek|walk(ing)? route/i.test(t)) return 'hike';
  if (/park|garden|lake|mountain|forest|river|waterfall|island|nature|canyon|valley/i.test(t)) return 'nature';
  if (/div(e|ing)|surf|ski|kayak|climb|raft|paraglid|bungee|zipline|cycling|bike/i.test(t)) return 'sport';
  if (/tour|guided|cruise|boat trip/i.test(t)) return 'tour';
  return 'see';
}
