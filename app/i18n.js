/* Cobble — the interface in another language.
 *
 * Scope, stated plainly: this translates the app's *chrome* — the sidebar, the
 * three view headings, the section titles, the entry form's labels and the
 * primary buttons. The sentences Cobble generates about your archive (toasts,
 * the observations in Discoveries, the year-in-review lines) stay in English
 * for now, because they are assembled from templates with numbers inside them
 * and a half-translated sentence is worse than an English one.
 *
 * Elements opt in with data-i18n="key" for their text, data-i18n-aria="key"
 * for an accessible name, data-i18n-placeholder="key" for a field's hint. A
 * missing key leaves the English in place rather than blanking the element.
 */
(() => {
  const STORAGE_KEY = 'cobble-lang';

  const EN = {
    'nav.world': 'YOUR WORLD',
    'nav.city': 'My city',
    'nav.timeline': 'Timeline',
    'nav.insights': 'Discoveries',
    'nav.demo': 'Sample city',
    'nav.back': 'Back to my city',
    'city.eyebrow': 'THE CITY OF YOU',
    'city.tagline': 'A little world made of your days',
    'city.lede': 'Every moment leaves something behind. Look what you’ve been building.',
    'demo.title': 'You’re exploring a sample city.',
    'demo.body': 'Its stories and Unsplash photos are just examples—your own moments stay untouched.',
    'city.title.a': 'Your life,',
    'city.title.b': 'taking shape.',
    'city.onthiday': 'On this day',
    'city.timeline': 'Your timeline',
    'city.from': 'From your city',
    'timeline.title.a': 'Your',
    'timeline.title.b': 'timeline.',
    'timeline.everyday': 'Everyday, remembered',
    'insights.title.a': 'Little',
    'insights.title.b': 'discoveries.',
    'insights.heatmap': 'Your year, one square a day',
    'insights.storage': 'Room for years of moments',
    'insights.achievements': 'Your achievements',
    'insights.saying': 'What your days are saying',
    'insights.you': 'What makes you, you',
    'entry.title': 'Save a moment',
    'entry.text': 'What did you notice?',
    'entry.district': 'District',
    'entry.weight': 'Weight',
    'entry.photo': 'Add a photo',
    'entry.save': 'Save to the city',
    'entry.cancel': 'Cancel',
    'share.title': 'Send a little of your city',
    'help.title': 'Welcome to your city',
    'action.add': 'Add a moment',
    'action.hide': 'Hide controls',
    'deck.theme': 'Theme',
    'deck.mood': 'Mood',
    'deck.weather': 'Weather',
    'deck.night': 'Night',
    'crumb.world': 'Your world',
    'action.share': 'Share city',
    'lang.label': 'Language'
  };

  const HI = {
    'nav.world': 'आपकी दुनिया',
    'nav.city': 'मेरा शहर',
    'nav.timeline': 'समय-रेखा',
    'nav.insights': 'खोजें',
    'nav.demo': 'नमूना शहर',
    'nav.back': 'अपने शहर पर लौटें',
    'city.eyebrow': 'आपका शहर',
    'city.tagline': 'आपके दिनों से बनी एक छोटी दुनिया',
    'city.lede': 'हर पल कुछ पीछे छोड़ जाता है। देखिए आप क्या बना रहे हैं।',
    'demo.title': 'आप एक नमूना शहर देख रहे हैं।',
    'demo.body': 'इसकी कहानियाँ और Unsplash की तस्वीरें सिर्फ़ उदाहरण हैं — आपके अपने पल अछूते रहते हैं।',
    'city.title.a': 'आपका जीवन,',
    'city.title.b': 'आकार लेता हुआ।',
    'city.onthiday': 'आज के दिन',
    'city.timeline': 'आपकी समय-रेखा',
    'city.from': 'आपके शहर से',
    'timeline.title.a': 'आपके',
    'timeline.title.b': 'समय-रेखा।',
    'timeline.everyday': 'रोज़मर्रा, याद रखा हुआ',
    'insights.title.a': 'छोटी',
    'insights.title.b': 'खोजें।',
    'insights.heatmap': 'आपका साल, एक दिन एक खाना',
    'insights.storage': 'सालों के पलों के लिए जगह',
    'insights.achievements': 'आपकी उपलब्धियाँ',
    'insights.saying': 'आपके दिन क्या कह रहे हैं',
    'insights.you': 'आपको आप क्या बनाता है',
    'entry.title': 'एक पल सहेजिए',
    'entry.text': 'आपने क्या नोटिस किया?',
    'entry.district': 'ज़िला',
    'entry.weight': 'महत्त्व',
    'entry.photo': 'तस्वीर जोड़िए',
    'entry.save': 'शहर में सहेजिए',
    'entry.cancel': 'रद्द कीजिए',
    'share.title': 'अपने शहर का थोड़ा हिस्सा भेजिए',
    'help.title': 'आपके शहर में स्वागत है',
    'action.add': 'पल जोड़िए',
    'action.hide': 'कंट्रोल छिपाइए',
    'deck.theme': 'थीम',
    'deck.mood': 'मूड',
    'deck.weather': 'मौसम',
    'deck.night': 'रात',
    'crumb.world': 'आपकी दुनिया',
    'action.share': 'शहर साझा करें',
    'lang.label': 'भाषा'
  };

  const GU = {
    'nav.world': 'તમારી દુનિયા',
    'nav.city': 'મારું શહેર',
    'nav.timeline': 'સમયરેખા',
    'nav.insights': 'શોધો',
    'nav.demo': 'નમૂનાનું શહેર',
    'nav.back': 'મારા શહેર પર પાછા જાઓ',
    'city.eyebrow': 'તમારું શહેર',
    'city.tagline': 'તમારા દિવસોથી બનેલી એક નાની દુનિયા',
    'city.lede': 'દરેક ક્ષણ કંઈક પાછળ છોડી જાય છે. જુઓ તમે શું બનાવી રહ્યા છો.',
    'demo.title': 'તમે એક નમૂનાનું શહેર જોઈ રહ્યા છો.',
    'demo.body': 'એની વાર્તાઓ અને Unsplashના ફોટા ફક્ત ઉદાહરણ છે — તમારી પોતાની ક્ષણો અકબંધ રહે છે.',
    'city.title.a': 'તમારું જીવન,',
    'city.title.b': 'આકાર લેતું.',
    'city.onthiday': 'આજના દિવસે',
    'city.timeline': 'તમારી સમયરેખા',
    'city.from': 'તમારા શહેરમાંથી',
    'timeline.title.a': 'તમારા',
    'timeline.title.b': 'સમયરેખા.',
    'timeline.everyday': 'રોજિંદું, યાદ રાખેલું',
    'insights.title.a': 'નાની',
    'insights.title.b': 'શોધો.',
    'insights.heatmap': 'તમારું વર્ષ, એક દિવસ એક ખાનું',
    'insights.storage': 'વર્ષોની ક્ષણો માટે જગ્યા',
    'insights.achievements': 'તમારી સિદ્ધિઓ',
    'insights.saying': 'તમારા દિવસો શું કહે છે',
    'insights.you': 'તમને તમે શું બનાવે છે',
    'entry.title': 'એક ક્ષણ સાચવો',
    'entry.text': 'તમે શું નોંધ્યું?',
    'entry.district': 'ઝિલ્લો',
    'entry.weight': 'મહત્ત્વ',
    'entry.photo': 'ફોટો ઉમેરો',
    'entry.save': 'શહેરમાં સાચવો',
    'entry.cancel': 'રદ કરો',
    'share.title': 'તમારા શહેરનો થોડો ભાગ મોકલો',
    'help.title': 'તમારા શહેરમાં સ્વાગત છે',
    'action.add': 'ક્ષણ ઉમેરો',
    'action.hide': 'કંટ્રોલ છુપાવો',
    'deck.theme': 'થીમ',
    'deck.mood': 'મૂડ',
    'deck.weather': 'મોસમ',
    'deck.night': 'રાત',
    'crumb.world': 'તમારી દુનિયા',
    'action.share': 'શહેર શેર કરો',
    'lang.label': 'ભાષા'
  };

  const DICTS = { en: EN, hi: HI, gu: GU };
  let current = 'en';

  function apply(lang) {
    current = DICTS[lang] ? lang : 'en';
    const dict = DICTS[current];
    document.documentElement.lang = current;
    document.querySelectorAll('[data-i18n]').forEach(node => {
      const value = dict[node.dataset.i18n];
      if (value) node.textContent = value;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(node => {
      const value = dict[node.dataset.i18nAria];
      if (value) node.setAttribute('aria-label', value);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(node => {
      const value = dict[node.dataset.i18nPlaceholder];
      if (value) node.setAttribute('placeholder', value);
    });
    document.querySelectorAll('[data-lang]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.lang === current));
    });
    try { localStorage.setItem(STORAGE_KEY, current); } catch {}
  }

  window.addEventListener('DOMContentLoaded', () => {
    let stored = 'en';
    try { stored = localStorage.getItem(STORAGE_KEY) || 'en'; } catch {}
    document.querySelectorAll('[data-lang]').forEach(button => {
      button.addEventListener('click', () => apply(button.dataset.lang));
    });
    apply(stored);
  });

  window.CobbleI18n = { apply, current: () => current };
})();
