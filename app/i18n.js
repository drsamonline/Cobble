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
    'deck.sound': 'Sound',
    'deck.3d': '3D city',
    'deck.flat': 'Flat city',
    'crumb.world': 'Your world',
    'action.share': 'Share city',
    'lang.label': 'Language',
    'help.eyebrow': 'A place made by you',
    'stat.moments': 'moments kept',
    'stat.moments.note': 'Every detail adds a little light.',
    'stat.days': 'days remembered',
    'stat.days.note': 'Different days, gathered together.',
    'stat.landmarks': 'personal landmarks',
    'stat.landmarks.note': 'The things you said matter.',
    'stat.themes': 'returning themes',
    'stat.themes.note': 'Familiar things finding their way back.',
    'help.body': 'Save the small things you want to remember. Your city gives them shape: meaningful moments become landmarks, repeating details become familiar streets, and new ideas add places that were not there before.',
    'help.privacy': 'Everything is stored on this device. The more you add, the more your city can notice about you.',
    'help.source': 'Source on GitHub',
    'help.licence': 'PolyForm Noncommercial 1.0.0',
    'help.docs': 'Documentation',
    'help.go': 'Let’s wander',
    'district.everyday': 'Everyday detail',
    'district.people': 'People & connection',
    'district.nature': 'Outside & nature',
    'district.ideas': 'Thoughts & ideas',
    'district.joy': 'Small joys',
    'district.milestone': 'Something meaningful',
    'mood.serene': 'serene',
    'mood.curious': 'curious',
    'mood.dreamy': 'dreamy',
    'mood.festive': 'festive',
    'mood.tranquil': 'tranquil',
    'weather.clear': 'clear',
    'weather.cloudy': 'cloudy',
    'weather.rain': 'rain',
    'weather.snow': 'snow',
    'theme.meadow': 'meadow',
    'theme.coastal': 'coastal',
    'theme.amber': 'amber',
    'theme.lavender': 'lavender',
    'theme.midnight': 'midnight'
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
    'deck.sound': 'ध्वनि',
    'deck.3d': '3D शहर',
    'deck.flat': 'सपाट शहर',
    'crumb.world': 'आपकी दुनिया',
    'action.share': 'शहर साझा करें',
    'lang.label': 'भाषा',
    'help.eyebrow': 'आपसे बनी एक जगह',
    'stat.moments': 'सहेजे पल',
    'stat.moments.note': 'हर ब्योरा थोड़ी रोशनी जोड़ता है।',
    'stat.days': 'याद रखे दिन',
    'stat.days.note': 'अलग-अलग दिन, एक साथ।',
    'stat.landmarks': 'निजी पड़ाव',
    'stat.landmarks.note': 'जिन्हें आपने मायने रखने वाला कहा।',
    'stat.themes': 'लौटते विषय',
    'stat.themes.note': 'जानी-पहचानी चीज़ें लौटकर आती हैं।',
    'help.body': 'जो छोटी बातें याद रखनी हैं, उन्हें सहेजिए। आपका शहर उन्हें आकार देता है: सार्थक पल पड़ाव बन जाते हैं, दोहराई जाने वाली बातें जानी-पहचानी गलियाँ बन जाती हैं, और नए विचार ऐसी जगहें जोड़ देते हैं जो पहले नहीं थीं।',
    'help.privacy': 'सब कुछ इसी डिवाइस पर रहता है। जितना ज़्यादा आप जोड़ते हैं, उतना ज़्यादा शहर आपके बारे में नोटिस कर सकता है।',
    'help.source': 'GitHub पर सोर्स',
    'help.licence': 'PolyForm Noncommercial 1.0.0',
    'help.docs': 'दस्तावेज़',
    'help.go': 'चलिए घूमें',
    'district.everyday': 'रोज़मर्रा की बातें',
    'district.people': 'लोग और जुड़ाव',
    'district.nature': 'बाहर और क़ुदरत',
    'district.ideas': 'सोच और विचार',
    'district.joy': 'छोटी खुशियाँ',
    'district.milestone': 'कुछ सार्थक',
    'mood.serene': 'शांत',
    'mood.curious': 'जिज्ञासु',
    'mood.dreamy': 'स्वप्निल',
    'mood.festive': 'उत्सवी',
    'mood.tranquil': 'निर्मल',
    'weather.clear': 'साफ़',
    'weather.cloudy': 'बादल',
    'weather.rain': 'बारिश',
    'weather.snow': 'बर्फ़',
    'theme.meadow': 'हरा मैदान',
    'theme.coastal': 'समुद्री',
    'theme.amber': 'अंबर',
    'theme.lavender': 'लैवेंडर',
    'theme.midnight': 'आधी रात'
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
    'deck.sound': 'અવાજ',
    'deck.3d': '3D શહેર',
    'deck.flat': 'સપાટ શહેર',
    'crumb.world': 'તમારી દુનિયા',
    'action.share': 'શહેર શેર કરો',
    'lang.label': 'ભાષા',
    'help.eyebrow': 'તમારાથી બનેલી એક જગ્યા',
    'stat.moments': 'સાચવેલી ક્ષણો',
    'stat.moments.note': 'દરેક વિગત થોડો પ્રકાશ ઉમેરે છે.',
    'stat.days': 'યાદ રહેલા દિવસો',
    'stat.days.note': 'અલગ અલગ દિવસો, એક સાથે.',
    'stat.landmarks': 'પોતાના પડાવ',
    'stat.landmarks.note': 'જેને તમે મહત્ત્વનું કહ્યું.',
    'stat.themes': 'પાછા આવતા વિષયો',
    'stat.themes.note': 'જાણીતી વસ્તુઓ પાછી આવે છે.',
    'help.body': 'જે નાની વાતો યાદ રાખવી છે તે સાચવો. તમારું શહેર એમને આકાર આપે છે: અર્થપૂર્ણ ક્ષણો પડાવ બને છે, પુનરાવર્તિત વિગતો જાણીતી શેરીઓ બની જાય છે, અને નવા વિચારો એવી જગ્યાઓ ઉમેરે છે જે પહેલાં નહોતી.',
    'help.privacy': 'બધું આ જ ડિવાઈસ પર રહે છે. જેટલું વધુ તમે ઉમેરો છો, એટલું વધુ શહેર તમારા વિશે નોંધી શકે છે.',
    'help.source': 'GitHub પર સોર્સ',
    'help.licence': 'PolyForm Noncommercial 1.0.0',
    'help.docs': 'દસ્તાવેજ',
    'help.go': 'ચાલો ફરીએ',
    'district.everyday': 'રોજિંદી વિગત',
    'district.people': 'લોકો અને જોડાણ',
    'district.nature': 'બહાર અને કુદરત',
    'district.ideas': 'વિચારો અને ભાવનાઓ',
    'district.joy': 'નાની ખુશીઓ',
    'district.milestone': 'કંઈક અર્થપૂર્ણ',
    'mood.serene': 'શાંત',
    'mood.curious': 'જિજ્ઞાસુ',
    'mood.dreamy': 'સ્વપ્નિલ',
    'mood.festive': 'ઉત્સવી',
    'mood.tranquil': 'નિર્મળ',
    'weather.clear': 'સાફ',
    'weather.cloudy': 'વાદળ',
    'weather.rain': 'વરસાદ',
    'weather.snow': 'બરફ',
    'theme.meadow': 'લીલું મેદાન',
    'theme.coastal': 'દરિયાઈ',
    'theme.amber': 'એમ્બર',
    'theme.lavender': 'લેવેન્ડર',
    'theme.midnight': 'મધરાત'
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
    /* modules that draw their own labels (the 3D toggle, the sound toggle)
       listen for this instead of duplicating the dictionary */
    window.dispatchEvent(new CustomEvent('cobble-lang', { detail: { lang: current } }));
  }

  window.addEventListener('DOMContentLoaded', () => {
    let stored = 'en';
    try { stored = localStorage.getItem(STORAGE_KEY) || 'en'; } catch {}
    document.querySelectorAll('[data-lang]').forEach(button => {
      button.addEventListener('click', () => apply(button.dataset.lang));
    });
    apply(stored);
  });


  /* ── sentences with numbers in them ───────────────────────────────
     A dictionary swaps words; these are templates, so each language gets a
     function that builds the sentence in its own order. `say()` falls back to
     English when a key is missing, which is why an untranslated sentence reads
     as English rather than as an empty toast. */
  const TEMPLATES = {
    en: {
      'toast.district': v => `${v.label}: ${v.count} ${v.count === 1 ? 'moment' : 'moments'}.`,
      'toast.unlocked': v => `Unlocked — ${v.count} ${v.count === 1 ? 'moment' : 'moments'}.`,
      'toast.merged': v => `${v.count} ${v.count === 1 ? 'moment' : 'moments'} merged${v.variants ? `, ${v.variants} kept as a second version` : ''}.`,
      'toast.imported': v => `${v.count} ${v.count === 1 ? 'entry' : 'entries'} imported from ${v.file}${v.skipped ? `, ${v.skipped} skipped` : ''}.`,
      'toast.theme': v => `A new ${v.theme} palette settles over your city.`,
      'toast.mood': v => `The city feels ${v.mood} today.`,
      'toast.weather': v => `Weather changed to ${v.weather}.`,
      'toast.part': v => `The city is at ${v.part} with you.`,
      'obs.busiest.title': v => `${v.label} is your busiest district.`,
      'obs.busiest.body': v => `${v.count} of your ${v.total} saved ${v.total === 1 ? 'moment lives' : 'moments live'} there. That's the shape of your attention, lately.`,
      'obs.day.title': v => `${v.date} held a lot.`,
      'obs.day.body': v => `You gathered ${v.count} moments in a single day. Some days leave a bigger footprint.`,
      'obs.short.title': () => 'Small can hold a whole world.',
      'obs.short.body': v => `Your shortest saved moment is just ${v.count} ${v.count === 1 ? 'word' : 'words'} long. Not everything needs explaining.`,
      'plan.foot': v => `${v.count} of ${v.total} moments sit in ${v.label}. Click a tile to read them.`
    },
    hi: {
      'toast.district': v => `${v.label}: ${v.count} पल।`,
      'toast.unlocked': v => `खुल गया — ${v.count} पल।`,
      'toast.merged': v => `${v.count} पल जोड़े गए${v.variants ? `, ${v.variants} दूसरे रूप में रखे गए` : ''}।`,
      'toast.imported': v => `${v.file} से ${v.count} प्रविष्टियाँ आयात हुईं${v.skipped ? `, ${v.skipped} छोड़ी गईं` : ''}।`,
      'toast.theme': v => `एक नई ${v.theme} रंग-योजना आपके शहर पर बस गई।`,
      'toast.mood': v => `आज शहर ${v.mood} सा लगता है।`,
      'toast.weather': v => `मौसम बदलकर ${v.weather} हो गया।`,
      'toast.part': v => `शहर आपके साथ ${v.part} पर है।`,
      'obs.busiest.title': v => `${v.label} आपका सबसे व्यस्त ज़िला है।`,
      'obs.busiest.body': v => `आपके ${v.total} सहेजे पलों में से ${v.count} वहाँ हैं। यही आपके ध्यान का आकार है।`,
      'obs.day.title': v => `${v.date} में बहुत कुछ था।`,
      'obs.day.body': v => `एक ही दिन में आपने ${v.count} पल जोड़े। कुछ दिन बड़ी छाप छोड़ जाते हैं।`,
      'obs.short.title': () => 'छोटे में पूरी दुनिया समा सकती है।',
      'obs.short.body': v => `आपका सबसे छोटा पल सिर्फ़ ${v.count} शब्दों का है। हर बात को समझाने की ज़रूरत नहीं।`,
      'plan.foot': v => `${v.total} में से ${v.count} पल ${v.label} में हैं। पढ़ने के लिए कोई खाना दबाइए।`
    },
    gu: {
      'toast.district': v => `${v.label}: ${v.count} ક્ષણો.`,
      'toast.unlocked': v => `ખૂલી ગયું — ${v.count} ક્ષણો.`,
      'toast.merged': v => `${v.count} ક્ષણો જોડાઈ${v.variants ? `, ${v.variants} બીજા સ્વરૂપમાં રાખી` : ''}.`,
      'toast.imported': v => `${v.file} માંથી ${v.count} એન્ટ્રીઓ આયાત થઈ${v.skipped ? `, ${v.skipped} છોડી` : ''}.`,
      'toast.theme': v => `નવી ${v.theme} રંગયોજના તમારા શહેર પર બેસી ગઈ.`,
      'toast.mood': v => `આજે શહેર ${v.mood} લાગે છે.`,
      'toast.weather': v => `મોસમ બદલાઈને ${v.weather} થઈ.`,
      'toast.part': v => `શહેર તમારી સાથે ${v.part} પર છે.`,
      'obs.busiest.title': v => `${v.label} તમારો સૌથી વ્યસ્ત ઝિલ્લો છે.`,
      'obs.busiest.body': v => `તમારી ${v.total} સાચવેલી ક્ષણોમાંથી ${v.count} ત્યાં છે. આ તમારા ધ્યાનનો આકાર છે.`,
      'obs.day.title': v => `${v.date} માં ઘણું બધું હતું.`,
      'obs.day.body': v => `એક જ દિવસમાં તમે ${v.count} ક્ષણો એકઠી કરી. અમુક દિવસો મોટી છાપ છોડે છે.`,
      'obs.short.title': () => 'નાનામાં આખી દુનિયા સમાય છે.',
      'obs.short.body': v => `તમારી સૌથી નાની ક્ષણ ફક્ત ${v.count} શબ્દોની છે. દરેક વાત સમજાવવી જરૂરી નથી.`,
      'plan.foot': v => `${v.total} માંથી ${v.count} ક્ષણો ${v.label} માં છે. વાંચવા માટે કોઈ ખાનું દબાવો.`
    }
  };

  const say = (key, values = {}) => {
    const build = (TEMPLATES[current] && TEMPLATES[current][key]) || TEMPLATES.en[key];
    return build ? build(values) : '';
  };

  const t = key => (DICTS[current] && DICTS[current][key]) || EN[key] || '';
  window.CobbleI18n = { apply, current: () => current, t, say };
})();
