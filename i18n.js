// שפת האתר: עברית (ברירת מחדל) או אנגלית. באנגלית מתרגמים את כל טקסט הממשק, כולל מה שנוצר אחר כך.
// תוכן שמטיילים כתבו נשאר בשפה שבה נכתב.
const KEY = 'waytip.lang';
export let LANG = (() => { try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'he'; } catch (e) { return 'he'; } })();
export let isEN = LANG === 'en';
let live = false; // באתר הראשי מחליפים שפה במקום, בלי לטעון מחדש
export function setLang(l) {
  try { localStorage.setItem(KEY, l); } catch (e) {}
  if (!live) { location.reload(); return; }
  LANG = l; isEN = l === 'en';
  apply();
  document.querySelectorAll('.langbtn').forEach(paintBtn);
  window.dispatchEvent(new Event('langchange'));
}

const MON_HE = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const MON_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const D = {
  'WayTip · הטיפ הנכון, בזמן הנכון': 'WayTip · The right tip, at the right time',
  'WayTip – לדף הבית': 'WayTip – home', 'דילוג לתוכן הראשי': 'Skip to main content',
  'התחברות': 'Sign in', 'הרשמה': 'Sign up', 'יציאה': 'Sign out', 'אורח': 'Guest', 'החשבון שלי': 'My account',
  'המלצות מאומתות ממטיילים, לפי עונה ואופי הטיול': 'Verified tips from travelers, by season and trip style',
  'המלצות מאומתות ממטיילים לכל יעד בעולם, לפי עונה ואופי הטיול': 'Verified traveler tips for every destination, by season and trip style',
  'לאן טסים?': 'Where are you going?', 'יעד': 'Destination', 'תאריכים': 'Dates', 'אופי הטיול': 'Trip style', 'העדפות': 'Preferences',
  'בחרו יעד': 'Choose a destination', 'עיר או מדינה': 'City or country', 'למשל רומא, בנגקוק, ניו יורק': 'e.g. Rome, Bangkok, New York',
  'הקלידו יעד ובחרו מהרשימה': 'Type a destination and pick from the list', 'לא נמצא יעד': 'No destination found', 'שינוי': 'Change',
  'מתי?': 'When?', 'מתאריך': 'From', 'עד תאריך': 'To', 'עוד לא יודעים': "Not sure yet", 'בחרו תאריך התחלה': 'Pick a start date',
  'לפי התאריכים נציג קודם המלצות מאותה עונה, ואת מזג האוויר הצפוי.': "Based on your dates we'll show tips from the same season first, and the expected weather.",
  'איזה סוג טיול?': 'What kind of trip?', 'מה חשוב לכם?': 'What matters to you?', 'מה מעניין אתכם': 'What interests you',
  'אפשר לדלג. את כל הבחירות אפשר לשנות גם אחר כך. סימונים כמו "כשר" או "ללא גלוטן" מבוססים על דיווחים ואינם אישור רשמי.': 'You can skip this and change everything later. Labels like "kosher" or "gluten-free" are based on reports and are not official certification.',
  'המשך': 'Next', 'חזרה': 'Back', 'הצג המלצות': 'Show tips', 'שלב 1 מתוך 4': 'Step 1 of 4',
  'עוד רעיונות למטה': 'More ideas below', 'גללו למטה לרעיונות': 'Scroll down for ideas', 'גללו להמלצות': 'Scroll to tips', 'גללו למטה להמלצות': 'Scroll down to tips',
  'איזה טיול אתם מתכננים?': 'What trip are you planning?', 'בחרו סגנון ונציג המלצות שמתאימות לו': "Pick a style and we'll show tips that fit it",
  'יעדים נבחרים': 'Featured destinations', 'נקודת התחלה טובה': 'A good place to start',
  '♥ היעדים השמורים שלך': '♥ Your saved destinations', 'לחצו כדי לחזור לתכנון': 'Tap to get back to planning',
  'טמפרטורה ביום': 'Daytime temperature', 'ממוצע לתאריכים (שנה שעברה)': 'Average for your dates (last year)', 'בלילה': 'At night',
  'ימי גשם': 'Rainy days', 'המלצות מאומתות': 'Verified tips', 'מעיל חם בערב': 'Warm coat in the evening', 'ז׳קט קל בערב': 'Light jacket in the evening',
  'בגדים קלים': 'Light clothes', 'כדאי מטריה': 'Bring an umbrella', 'רוב הימים יבשים': 'Most days are dry',
  'שמירה': 'Save', 'נשמר': 'Saved', 'הסרה מהשמורים': 'Remove from saved', 'הוסר מהשמורים': 'Removed from saved',
  'מה מחפשים': 'Looking for', 'ניקוי סינון': 'Clear filters', 'הכל': 'All', 'העדפות (אפשר כמה)': 'Preferences (pick several)',
  'אפשר לבחור כמה העדפות ביחד. הסימונים "כשר", "ללא גלוטן", "טבעוני" ו"נגיש" מבוססים על דיווחי מטיילים ועל תיאורים מהרשת, ואינם אישור רשמי. לפני שמסתמכים עליהם, בדקו ישירות מול המקום (למשל תעודת כשרות או רכיבים).': 'You can combine preferences. "Kosher", "gluten-free", "vegan" and "accessible" labels are based on traveler reports and online descriptions, not official certification. Check directly with the place before relying on them.',
  'המלצות מטיילים': 'Traveler tips', 'מקומות מומלצים מהרשת': 'Recommended places from the web',
  'אין עדיין המלצות שמתאימות': 'No matching tips yet', 'נסו להסיר חלק מהסינונים, או ': 'Try removing some filters, or ',
  'לא נמצאו מקומות': 'No places found', 'אין מידע מפורט ליעד הזה': 'No detailed info for this destination', 'נסו סינון אחר': 'Try a different filter',
  'ביעדים גדולים המידע מחולק לשכונות, ראו בקישור למטה': 'For big destinations the info is split by district, see the link below',
  'דירוג וביקורות': 'Rating & reviews', 'ביקורות בגוגל': 'Google reviews', 'טריפאדווייזר': 'Tripadvisor', 'כתבו המלצה': 'Write a tip', 'אתר': 'Website',
  'הדירוג והביקורות מוצגים מתוך גוגל מפות. לחצו על "ביקורות" בכרטיס כדי לקרוא אותן.': 'Rating and reviews are shown from Google Maps. Tap "Reviews" in the card to read them.',
  'מקור:': 'Source:', 'הסינון לפי העדפות מבוסס על מילות מפתח בתיאור המקום. ייתכן שהמידע לא עדכני, ויש לבדוק שעות, מחירים וכשרות מול המקום עצמו.': 'Preference filtering is based on keywords in the description. Info may be out of date; check hours, prices and kashrut with the place itself.', 'מקומות כשרים, טבעוניים, ללא גלוטן, חלאל ובתי כנסת: ©': 'Kosher, vegan, gluten-free, halal places and synagogues: ©', 'תורמי OpenStreetMap': 'OpenStreetMap contributors', '(ODbL). תיאורים בעברית תורגמו אוטומטית.': '(ODbL). Hebrew descriptions are machine-translated.', ', בכפוף לרישיון': ', under the license',
  '. הסינון לפי העדפות מבוסס על מילות מפתח בתיאור המקום. ייתכן שהמידע לא עדכני, ויש לבדוק שעות, מחירים וכשרות מול המקום עצמו.': '. Preference filtering is based on keywords in the description. Info may be out of date; check hours, prices and kashrut with the place itself.',
  'מטייל מאומת': 'Verified traveler', 'בעונה שלכם': 'In your season', 'דיווח': 'Report', 'בעונה שלכם · ': 'In your season · ', 'טיפ': 'Tip',
  'ביקרתם ב': 'Visited ', 'ההמלצה שלכם תעזור למטיילים שטסים באותה עונה ובאותו אופי טיול. כל המלצה נבדקת לפני פרסום.': 'Your tip will help travelers going in the same season and style. Every tip is reviewed before publishing.',
  'סוג ההמלצה': 'Tip type', 'אופי הטיול שלכם': 'Your trip style', 'שם המקום (לא חובה)': 'Place name (optional)', 'מסעדה, אטרקציה, מלון…': 'Restaurant, attraction, hotel…',
  'חודש הביקור': 'Month of visit', 'שנה': 'Year', 'מתאים ל… (אפשר לבחור כמה)': 'Good for… (pick several)', 'דירוג': 'Rating', 'ההמלצה': 'Your tip',
  'מה כדאי לדעת? מה היה שווה ומה לא? (לפחות 30 תווים)': 'What should people know? What was worth it and what wasn\'t? (at least 30 characters)',
  'סרטון מטיקטוק או אינסטגרם (לא חובה)': 'TikTok or Instagram video (optional)',
  'צילמתם את המקום? הדביקו קישור לסרטון ציבורי שלכם (שיתוף ← העתקת קישור). הסרטון יוצג בתוך ההמלצה.': 'Filmed the place? Paste a link to your public video (Share → Copy link). It will show inside your tip.',
  'אני מצהיר/ה שביקרתי במקום, שההמלצה נכתבה על ידי ומשקפת את החוויה האישית שלי, שאין בה פרטים אישיים של אחרים או תוכן פוגעני, ושקראתי ואני מסכים/ה ל': 'I confirm that I visited the place, wrote this tip myself and it reflects my own experience, that it contains no personal details of others or offensive content, and that I have read and agree to the ',
  'תנאי השימוש': 'Terms of Use', 'ול': ' and the ', 'מדיניות הפרטיות': 'Privacy Policy', 'שליחה ואימות': 'Send & verify',
  'אימות בטביעת אצבע או Face ID': 'Fingerprint or Face ID verification', 'כך אין אצלנו המלצות מזויפות. המידע הביומטרי לא יוצא מהטלפון שלכם.': 'That\'s how we keep fake tips out. Your biometric data never leaves your phone.',
  'מידע משפטי': 'Legal', 'תנאי שימוש': 'Terms of Use', 'מדיניות פרטיות': 'Privacy Policy', 'הצהרת נגישות': 'Accessibility statement', 'מחיקת החשבון שלי': 'Delete my account',
  '· מופעל על ידי ORSO DIGITAL ·': '· Operated by ORSO DIGITAL ·',
  'ההמלצות באתר הן דעתם האישית של המטיילים שכתבו אותן, ואינן המלצה של האתר. מזג האוויר מבוסס על נתוני השנה שעברה ואינו תחזית. צילומים:': 'Tips on this site are the personal opinions of the travelers who wrote them, not recommendations by the site. Weather is based on last year\'s data and is not a forecast. Photos:',
  'ו-Wikimedia Commons.': 'and Wikimedia Commons.',
  'אוספים המלצות מהרשת…': 'Gathering recommendations from the web…', 'קוראים ביקורות של מטיילים…': 'Reading traveler reviews…',
  'בודקים מזג אוויר לתאריכים שלכם…': 'Checking the weather for your dates…', 'מסננים לפי אופי הטיול…': 'Filtering by trip style…',
  'צפו בסרטון מטיקטוק': 'Watch the TikTok video', 'צפו בסרטון מאינסטגרם': 'Watch the Instagram video', 'ייטען מטיקטוק בלחיצה': 'Loads from TikTok when tapped', 'ייטען מאינסטגרם בלחיצה': 'Loads from Instagram when tapped',
  // vocab
  'זוגות': 'Couples', 'ירח דבש': 'Honeymoon', 'טיול אחרי צבא': 'Post-army trip', 'תרמילאים': 'Backpackers', 'סולו': 'Solo', 'טיול בנות': 'Girls\' trip',
  'חברים': 'Friends', 'מסיבת רווקים / רווקות': 'Bachelor / bachelorette', 'משפחה עם ילדים קטנים': 'Family with young kids', 'משפחה עם נוער': 'Family with teens',
  'משפחה מורחבת': 'Extended family', 'גיל הזהב': 'Seniors', 'עסקים': 'Business', 'סופ"ש קצר': 'Short weekend',
  'אוכל ומסעדות': 'Food & restaurants', 'בתי קפה וקינוחים': 'Cafés & desserts', 'שווקים ואוכל רחוב': 'Markets & street food', 'אטרקציות ואתרים': 'Sights & attractions',
  'מוזיאונים ותרבות': 'Museums & culture', 'סיורים מודרכים': 'Guided tours', 'טבע ונופים': 'Nature & views', 'מסלולי הליכה': 'Hiking trails', 'חופים': 'Beaches',
  'פעילויות לילדים': 'Kids\' activities', 'ספורט ואקסטרים': 'Sport & extreme', 'ספא ורגיעה': 'Spa & relaxation', 'בילוי וחיי לילה': 'Nightlife', 'קניות': 'Shopping',
  'לינה': 'Where to stay', 'בתי חב"ד ובתי כנסת': 'Chabad houses & synagogues', 'תחבורה והתניידות': 'Getting around', 'טיפים כלליים': 'General tips',
  'אוכל': 'Food', 'תקציב': 'Budget', 'מתאים ל…': 'Good for…', 'אווירה': 'Vibe',
  'כשר': 'Kosher', 'טבעוני': 'Vegan', 'צמחוני': 'Vegetarian', 'ללא גלוטן': 'Gluten-free', 'חלאל': 'Halal',
  'בחינם': 'Free', 'חסכוני': 'Budget', 'בינוני': 'Mid-range', 'יוקרתי': 'Luxury',
  'ילדים': 'Kids', 'תינוקות ועגלות': 'Babies & strollers', 'כיסא גלגלים': 'Wheelchair', 'כלבים': 'Dogs', 'שומרי שבת': 'Shabbat observant', 'דוברי עברית': 'Hebrew speakers',
  'רומנטי': 'Romantic', 'שקט ורגוע': 'Quiet & calm', 'נוף מרהיב': 'Stunning view', 'מקומי ולא תיירותי': 'Local, not touristy', 'מתאים ליום גשום': 'Good for a rainy day',
  // popular
  'רומא': 'Rome', 'איטליה': 'Italy', 'פריז': 'Paris', 'צרפת': 'France', 'בנגקוק': 'Bangkok', 'תאילנד': 'Thailand', 'ניו יורק': 'New York', 'ארצות הברית': 'United States',
  'לונדון': 'London', 'בריטניה': 'United Kingdom', 'ברצלונה': 'Barcelona', 'ספרד': 'Spain',
  // auth / account
  'כניסה ל-WayTip': 'Sign in to WayTip', 'כדי לשמור יעדים ולכתוב המלצות': 'To save destinations and write tips', 'המשך עם Google': 'Continue with Google',
  'או עם מייל': 'or with email', 'שם (יופיע ליד ההמלצות שלכם)': 'Name (shown next to your tips)', 'מייל': 'Email', 'סיסמה': 'Password',
  'שכחתי סיסמה': 'Forgot password', 'המשך כאורח': 'Continue as guest', 'יצירת חשבון': 'Create account', 'סגירה': 'Close',
  'בהתחברות אתם מסכימים ל': 'By signing in you agree to the ', '. כאורח אפשר לשמור יעדים; כדי לכתוב המלצה צריך חשבון עם מייל מאומת.': '. As a guest you can save destinations; to write a tip you need an account with a verified email.',
  'כדי לשמור את היעד גם לפעם הבאה': 'To keep this destination for next time', 'כדי לדווח צריך חשבון': 'You need an account to report',
  'כדי לכתוב המלצה צריך חשבון, כדי שנדע שאתם אנשים אמיתיים': 'Writing a tip needs an account, so we know you\'re a real person', 'צרו חשבון. היעדים ששמרתם יישארו.': 'Create an account. Your saved destinations will stay.',
  'מחוברים כאורח': 'Signed in as guest', 'יצירת חשבון (כדי לכתוב המלצות)': 'Create an account (to write tips)', 'שליחת מייל אימות שוב': 'Resend verification email',
  'יצאתם מהחשבון': 'You signed out', 'שלחנו שוב מייל אימות': 'Verification email sent again', 'נסו שוב בעוד כמה דקות': 'Try again in a few minutes',
  'כתובת המייל לא תקינה': 'Invalid email address', 'חסרה סיסמה': 'Password missing', 'הסיסמה חלשה מדי: לפחות 6 תווים': 'Password too weak: at least 6 characters',
  'כבר יש חשבון עם המייל הזה. נסו "התחברות"': 'An account with this email already exists. Try "Sign in"', 'המייל או הסיסמה לא נכונים': 'Wrong email or password',
  'לא מצאנו חשבון עם המייל הזה': 'No account found with this email', 'יותר מדי ניסיונות. נסו שוב בעוד כמה דקות': 'Too many attempts. Try again in a few minutes',
  'הדפדפן חסם את החלון של גוגל. אפשרו חלונות קופצים ונסו שוב': 'The browser blocked the Google window. Allow pop-ups and try again',
  'אין חיבור לאינטרנט': 'No internet connection', 'שיטת ההתחברות הזאת עדיין לא הופעלה': 'This sign-in method is not enabled yet', 'משהו השתבש, נסו שוב': 'Something went wrong, try again',
  'נרשמתם! שלחנו לכם מייל לאימות הכתובת. אחרי שתלחצו על הקישור במייל תוכלו לכתוב המלצות.': 'You\'re signed up! We sent you an email to verify your address. After you tap the link you can write tips.',
  'אם יש חשבון עם המייל הזה, שלחנו אליו קישור לאיפוס סיסמה.': 'If an account exists for this email, we sent it a password reset link.',
  'כתבו את המייל שלכם ואז לחצו שוב על "שכחתי סיסמה"': 'Type your email, then tap "Forgot password" again',
  'עוד לא שמרתם יעדים. לחצו על ♡ בדף של יעד': 'No saved destinations yet. Tap ♡ on a destination page',
  'החשבון והמידע שלך נמחקו': 'Your account and data were deleted', 'מטעמי אבטחה, התחברו מחדש ונסו שוב': 'For security, sign in again and retry',
  'למחוק את החשבון שלך? כל ההמלצות שכתבת, הדיווחים והיעדים השמורים יימחקו לצמיתות. אי אפשר לבטל את זה.': 'Delete your account? All your tips, reports and saved destinations will be permanently deleted. This cannot be undone.',
  // review form messages
  'ההמלצה קצרה מדי – כתבו לפחות 30 תווים': 'Your tip is too short – write at least 30 characters',
  'כדי לשלוח, סמנו את תיבת ההצהרה ואת ההסכמה לתנאי השימוש': 'To send, tick the declaration and terms checkbox',
  'הקישור לסרטון לא נראה תקין. העתיקו אותו מכפתור "שיתוף" בטיקטוק או באינסטגרם.': 'The video link doesn\'t look right. Copy it from the "Share" button in TikTok or Instagram.',
  'הדפדפן הזה לא תומך בטביעת אצבע / Face ID. נסו מהטלפון בדפדפן מעודכן.': 'This browser doesn\'t support fingerprint / Face ID. Try from your phone with an up-to-date browser.',
  'כמעט סיימנו: אשרו את כתובת המייל דרך הקישור ששלחנו אליכם, ואז שלחו שוב. לא קיבלתם? לחצו על שם החשבון למעלה ← "שליחת מייל אימות שוב".': 'Almost done: verify your email via the link we sent, then send again. Didn\'t get it? Tap your account name at the top → "Resend verification email".',
  'מתחבר… (בפעם הראשונה זה יכול לקחת עד דקה)': 'Connecting… (the first time can take up to a minute)',
  'פעם ראשונה: מאשרים את הטלפון שלכם עם טביעת אצבע או Face ID': 'First time: approve your phone with fingerprint or Face ID',
  'מאשרים את ההמלצה עם טביעת אצבע או Face ID': 'Confirm your tip with fingerprint or Face ID',
  'תודה. ההמלצה נשלחה ותופיע באתר אחרי אישור.': 'Thanks! Your tip was sent and will appear after review.', 'האימות בוטל. נסו שוב.': 'Verification cancelled. Try again.',
  'שגיאה בשרת': 'Server error', 'לא הצלחתי לטעון את היעד': 'Couldn\'t load the destination',
  'מה הבעיה בהמלצה? (למשל: פרסומת, מידע לא נכון, תוכן פוגעני, פגיעה בפרטיות, לשון הרע או הפרת זכויות יוצרים)': 'What\'s wrong with this tip? (e.g. advertising, wrong info, offensive content, privacy, defamation or copyright)',
  'תודה, הדיווח נשלח לבדיקה': 'Thanks, the report was sent for review', 'לא הצלחתי לשלוח את הדיווח': 'Couldn\'t send the report',
  'דגל': 'Flag', 'תפריט נגישות': 'Accessibility menu', 'נגישות': 'Accessibility', 'הגדלת טקסט': 'Larger text', 'הקטנת טקסט': 'Smaller text',
  'ניגודיות גבוהה': 'High contrast', 'גווני אפור': 'Grayscale', 'הדגשת קישורים': 'Highlight links', 'גופן קריא': 'Readable font', 'ריווח שורות': 'Line spacing',
  'עצירת אנימציות': 'Stop animations', 'סמן גדול': 'Large cursor', 'מסגרת מיקוד בולטת': 'Strong focus outline', 'איפוס הגדרות': 'Reset', 'גודל טקסט': 'Text size',
  'א-': 'A-', 'א+': 'A+', 'מעבר לעברית': 'Switch to Hebrew', 'כניסה עם טביעת אצבע / Face ID': 'Sign in with fingerprint / Face ID',
  'הפעלת כניסה עם טביעת אצבע / Face ID': 'Enable fingerprint / Face ID sign-in', 'כניסה עם טביעת אצבע הופעלה ✓': 'Fingerprint sign-in enabled ✓',
  'התחברתם עם טביעת אצבע': 'Signed in with fingerprint', 'איים ואזורים': 'Islands & regions', 'בית כנסת': 'Synagogue', 'בית חב"ד': 'Chabad house', 'סרטון מצורף': 'Attached video', 'דירוג וביקורות בגוגל מפות': 'Rating and reviews on Google Maps',
};
const P = [
  [/^(\d+) מהעונה שלכם$/, '$1 from your season'],
  [/^(\d+) מקומות שמתאימים לסינון$/, '$1 places match your filters'],
  [/^(\d+) מקומות$/, '$1 places'],
  [/^(\d+) המלצות מהחודשים של הטיול שלכם · (\d+) סינונים פעילים$/, '$1 tips from your travel months · $2 active filters'],
  [/^(\d+) המלצות מהחודשים של הטיול שלכם$/, '$1 tips from your travel months'],
  [/^עוד (\d+) המלצות מעונות אחרות ↓$/, '$1 more tips from other seasons ↓'],
  [/^שלב (\d) מתוך 4$/, 'Step $1 of 4'],
  [/^(\d+) מתוך (\d+)$/, '$1 of $2'],
  [/^דירוג (\d) מתוך 5$/, 'Rated $1 out of 5'],
  [/^(\d) כוכבים$/, '$1 stars'],
  [/^היו הראשונים לכתוב על (.+)$/, 'be the first to write about $1'],
  [/^נסו להסיר חלק מהסינונים, או היו הראשונים לכתוב על (.+)$/, 'Try removing some filters, or be the first to write about $1'],
  [/^(.+) נשמר ביעדים שלך ♥$/, '$1 was added to your saved destinations ♥'],
  [/^♥ היעדים השמורים שלי \((\d+)\)$/, '♥ My saved destinations ($1)'],
  [/^לא מצאנו מקומות שמתאימים בדיוק לסינון, אז הנה כל (\d+) המקומות המומלצים\. בדקו מול המקום אם הוא מתאים לכם\.$/, 'No places matched your filters exactly, so here are all $1 recommended places. Check with each place whether it suits you.'],
  [/^צילום של (.+)$/, 'Photo of $1'],
  [/^נבחר: (.+)$/, 'Selected: $1'],
  [/^(\d+) נבחרו$/, '$1 selected'],
];
const MRE = new RegExp('(\\d{1,2}) ב(' + MON_HE.join('|') + ')', 'g');
const MRE2 = new RegExp('(^|\\s)(' + MON_HE.join('|') + ')(?=\\s|$|,)', 'g');
export function tr(s) {
  if (!isEN || !s || !/[֐-׿]/.test(s)) return s;
  const lead = s.match(/^\s*/)[0], tail = s.match(/\s*$/)[0], core = s.trim();
  if (D[core] !== undefined) return lead + D[core] + tail;
  for (const [re, to] of P) if (re.test(core)) return lead + core.replace(re, to) + tail;
  let out = core.replace(MRE, (m, d, mon) => MON_EN[MON_HE.indexOf(mon)] + ' ' + d).replace(MRE2, (m, a, mon) => a + MON_EN[MON_HE.indexOf(mon)]);
  // צירופים עם " · " (למשל "18 בדצמבר – 25 בדצמבר · חברים")
  if (out.includes(' · ')) out = out.split(' · ').map((x) => D[x.trim()] || x).join(' · ');
  return lead + out + tail;
}
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
// מתרגמים ושומרים את המקור, כדי שאפשר יהיה לחזור לעברית בלי טעינה
const ORIG = new WeakMap(), ORIGA = new WeakMap();
let busy = false;
function walk(root) {
  if (root.nodeType === 3) {
    const cur = root.nodeValue;
    if (isEN) { const t = tr(cur); if (t !== cur) { ORIG.set(root, cur); root.nodeValue = t; } }
    else if (ORIG.has(root)) { root.nodeValue = ORIG.get(root); ORIG.delete(root); }
    return;
  }
  if (root.nodeType !== 1 || root.closest?.('[data-noi18n],script,style,textarea,.rv p')) return;
  ATTRS.forEach((a) => {
    const v = root.getAttribute?.(a); if (v == null) return;
    const o = ORIGA.get(root) || {};
    if (isEN) { const t = tr(v); if (t !== v) { o[a] = v; ORIGA.set(root, o); root.setAttribute(a, t); } }
    else if (o[a] != null) { root.setAttribute(a, o[a]); delete o[a]; }
  });
  root.childNodes.forEach(walk);
}
let title0 = '';
function apply() {
  const h = document.documentElement;
  h.lang = isEN ? 'en' : 'he'; h.dir = isEN ? 'ltr' : 'rtl'; h.classList.toggle('lang-en', isEN);
  if (!title0) title0 = document.title;
  document.title = isEN ? tr(title0) : title0;
  busy = true; walk(document.body); busy = false;
}
export function startI18n() {
  live = true;
  apply();
  new MutationObserver((ms) => {
    if (busy || !isEN) return;
    busy = true;
    ms.forEach((m) => { if (m.type === 'characterData') walk(m.target); m.addedNodes.forEach(walk); if (m.type === 'attributes') walk(m.target); });
    busy = false;
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  const c = window.confirm.bind(window), p = window.prompt.bind(window), a = window.alert.bind(window);
  window.confirm = (m) => c(tr(m)); window.prompt = (m, d) => p(tr(m), d); window.alert = (m) => a(tr(m));
}
function paintBtn(b) {
  b.lang = isEN ? 'he' : 'en';
  b.textContent = isEN ? 'עברית' : 'English';
  b.setAttribute('aria-label', isEN ? 'מעבר לעברית' : 'Switch to English');
}
export function langButton() {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'navlink langbtn';
  paintBtn(b);
  b.setAttribute('data-noi18n', '');
  b.onclick = () => setLang(isEN ? 'he' : 'en');
  return b;
}
