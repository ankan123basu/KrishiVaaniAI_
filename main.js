// main.js for KrishiVaani AI
// Handles UI interactions, voice/text input, and API calls

// API Endpoints - Will be proxied through Vercel
const API_URL = ''; // Empty string because we're using relative paths with Vercel proxy

// Elements
const imageInput = document.getElementById('imageInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const textQuery = document.getElementById('textQuery');
const sendBtn = document.getElementById('sendBtn');
const voiceBtn = document.getElementById('voiceBtn');
const resultsDiv = document.getElementById('results');
const speakAdviceBtn = document.getElementById('speakAdviceBtn');
const weatherDiv = document.getElementById('weather');
const mandiDiv = document.getElementById('mandi');
const fetchWeatherBtn = document.getElementById('fetchWeatherBtn');
const fetchMandiBtn = document.getElementById('fetchMandiBtn');
const marketSelect = document.getElementById('marketSelect');
const commoditySelect = document.getElementById('commoditySelect');
const langSelect = document.getElementById('langSelect');
const stopBtn = document.getElementById('stopBtn');

// Placeholder:// --- Location and Language State ---
let userLat = null;
let userLon = null;
let userLang = 'en';
let latestMandi = '';
let recognitionGlobal = null; // for voice stop control

// --- Simple i18n translations (extend as needed) ---
const translations = {
  as: {uploadLabel:'পাত বিলাক আপল’ড কৰক', analyzeBtn:'বিশ্লেষণ', askSpeak:'আপোনাৰ প্ৰশ্ন সোধক বা কোৱা', queryPlaceholder:'আপোনাৰ প্ৰশ্ন টাইপ কৰক...', sendBtn:'পঠিয়াওক', speakBtn:'কোৱা', stopBtn:'বন্ধ', listenBtn:'শুনক', weatherHeading:'বতাহ', useLocationBtn:'📍 মোৰ অৱস্থান', mandiHeading:'বাজাৰৰ দাম'},
  gu: {uploadLabel:'પાંદાની ફોટો અપલોડ કરો', analyzeBtn:'વિશ્લેષણ', askSpeak:'તમારો પ્રશ્ન લખો કે બોલો', queryPlaceholder:'તમારો પ્રશ્ન લખો...', sendBtn:'મોકલવું', speakBtn:'બધારવું', stopBtn:'થંભાવો', listenBtn:'સાંભળો', weatherHeading:'હવામાન', useLocationBtn:'📍 મારી જગ્યા', mandiHeading:'મણ્ડી ભાવ'},
  kn: {uploadLabel:'ಎಲೆ ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ', analyzeBtn:'ವಿಶ್ಲೇಷಿಸು', askSpeak:'ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಮಾತನಾಡಿ', queryPlaceholder:'ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ...', sendBtn:'ಕಳುಹಿಸಿ', speakBtn:'ಮಾತನಾಡಿ', stopBtn:'ನಿಲ್ಲಿಸಿ', listenBtn:'ಕೆಳಿ', weatherHeading:'ಹವಾಮಾನ', useLocationBtn:'📍 ನನ್ನ ಸ್ಥಾನ', mandiHeading:'ಮಂಡಿ ಬೆಲೆ'},
  ml: {uploadLabel:'ഇല ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക', analyzeBtn:'വിശകലനം', askSpeak:'ചോദ്യമൈ പൊലി അഡോ', queryPlaceholder:'ചോദ്യം ടൈപ്പ് ചെയ്യുക...', sendBtn:'യയക്കുക', speakBtn:'പറയുക', stopBtn:'നിര്‍ത്തുക', listenBtn:'കേള്‍ക്കുക', weatherHeading:'വാതാവസം', useLocationBtn:'📍 എന്റെ സ്ഥലം', mandiHeading:'മണ്ടി വില'},
  mr: {uploadLabel:'पानाचा फोटो अपलोड करा', analyzeBtn:'विश्लेषण', askSpeak:'तुमचा प्रश्न टाइप करा किंवा बोला', queryPlaceholder:'तुमचा प्रश्न टाइप करा...', sendBtn:'पाठवा', speakBtn:'बोला', stopBtn:'थांबा', listenBtn:'ऐका', weatherHeading:'हवामान', useLocationBtn:'📍 माझे स्थान', mandiHeading:'मंडी दर'},
  pa: {uploadLabel:'ਪੱਤੇ ਦੀ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ', analyzeBtn:'ਵਿਸ਼ਲੇਸ਼ਣ', askSpeak:'ਆਪਣਾ ਪ੍ਰਸ਼ਨ ਲਿਖੋ ਜਾਂ ਬੋਲੋ', queryPlaceholder:'ਆਪਣਾ ਪ੍ਰਸ਼ਨ ਲਿਖੋ...', sendBtn:'ਭੇਜੋ', speakBtn:'ਬੋਲੋ', stopBtn:'ਰੋਕੋ', listenBtn:'ਸੁਣੋ', weatherHeading:'ਮੌਸਮ', useLocationBtn:'📍 ਮੇਰਾ ਸਥਾਨ', mandiHeading:'ਮੰਡੀ ਕੀਮਤ'},
  te: {uploadLabel:'ఆకు ఫోటోను అప్‌లోడ్ చేయండి', analyzeBtn:'విశ్లేషణ', askSpeak:'మీ ప్రశ్నను టైప్ చేయండి లేదా మాట్లాడండి', queryPlaceholder:'మీ ప్రశ్నను టైప్ చేయండి...', sendBtn:'పంపండి', speakBtn:'మాట్లాడు', stopBtn:'ఆపు', listenBtn:'విను', weatherHeading:'వాతావరణం', useLocationBtn:'📍 నా స్థానం', mandiHeading:'మండీ ధరలు'},
  ur: {uploadLabel:'پتے کی تصویر اپ لوڈ کریں', analyzeBtn:'تجزیہ', askSpeak:'اپنا سوال لکھیں یا بولیں', queryPlaceholder:'اپنا سوال لکھیں...', sendBtn:'بھیجیں', speakBtn:'بولیں', stopBtn:'روکیں', listenBtn:'سنیں', weatherHeading:'موسم', useLocationBtn:'📍 میری جگہ', mandiHeading:'منڈی قیمتیں'},
  or: {uploadLabel:'ପତ୍ର ଫୋଟୋ ଅପଲୋଡ୍ କରନ୍ତୁ', analyzeBtn:'bisleshana', askSpeak:'ଆପଣଙ୍କ ପ୍ରଶ୍ନ ଲେଖନ୍ତୁ କିମ୍ବା କୁହନ୍ତୁ', queryPlaceholder:'ପ୍ରଶ୍ନ ଟାଇପ୍ କରନ୍ତୁ...', sendBtn:'ପଠାନ୍ତୁ', speakBtn:'କହନ୍ତୁ', stopBtn:'ଥାଆନ୍ତୁ', listenBtn:'ଶୁଣନ୍ତୁ', weatherHeading:'ପାଣିପାଗ', useLocationBtn:'📍 ମୋ ଅବସ୍ଥାନ', mandiHeading:'ମଣ୍ଡି ଦାମ'},

  hi: {uploadLabel:'पत्ते की फोटो अपलोड करें', analyzeBtn:'विश्लेषण', askSpeak:'अपना प्रश्न लिखें या बोलें', queryPlaceholder:'अपना प्रश्न लिखें...', sendBtn:'भेजें', speakBtn:'बोलें', stopBtn:'रोकें', listenBtn:'सुनें', weatherHeading:'मौसम', useLocationBtn:'📍 मेरा स्थान', mandiHeading:'मंडी भाव'},
  bn: {uploadLabel:'পাতার ছবি আপলোড করুন', analyzeBtn:'বিশ্লেষণ', askSpeak:'আপনার প্রশ্ন লিখুন বা বলুন', queryPlaceholder:'আপনার প্রশ্ন লিখুন...', sendBtn:'পাঠান', speakBtn:'বলুন', stopBtn:'থামুন', listenBtn:'শুনুন', weatherHeading:'আবহাওয়া', useLocationBtn:'📍 আমার অবস্থান', mandiHeading:'মণ্ডি দাম'},
  ta: {uploadLabel:'இலை புகைப்படம் பதிவேற்று', analyzeBtn:'ஆய்வு', askSpeak:'உங்கள் கேள்வியை எழுதுக அல்லது பேசுக', queryPlaceholder:'உங்கள் கேள்வியை எழுதுக...', sendBtn:'அனுப்பு', speakBtn:'பேசு', stopBtn:'நிறுத்து', listenBtn:'கேள்', weatherHeading:'வானிலை', useLocationBtn:'📍 இடம்', mandiHeading:'மண்டி விலை'},
  en: {uploadLabel:'Upload Crop Leaf Photo', analyzeBtn:'Analyze', askSpeak:'Ask or Speak Your Query', queryPlaceholder:'Type your question...', sendBtn:'Send', speakBtn:'Speak', stopBtn:'Stop', listenBtn:'Listen', weatherHeading:'Weather', useLocationBtn:'📍 Use My Location', mandiHeading:'Mandi Prices'}
};

// --- Speech Synthesis Voices Loader ---
let speechVoices = [];
function populateVoices() {
  const avail = window.speechSynthesis.getVoices();
  if (avail && avail.length) {
    speechVoices = avail;
  }
}
if ('speechSynthesis' in window) {
  populateVoices();
  window.speechSynthesis.onvoiceschanged = populateVoices;

// --- Speak helper with local voice or server fallback ---
async function speakOut(text) {
  if (!text) return;
  // try local voices
  if ('speechSynthesis' in window) {
    populateVoices();
    const match = speechVoices.find(v => v.lang && v.lang.toLowerCase().startsWith(userLang));
    if (match) {
      const u = new SpeechSynthesisUtterance(text);
      u.voice = match;
      u.lang = match.lang;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      return;
    }
  }
  // fallback to server TTS
  try {
    const resp = await fetch('/api/tts', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({text, lang: userLang})
    });
    const data = await resp.json();
    if (data.audio) {
      new Audio('data:audio/mp3;base64,'+data.audio).play();
    } else {
      console.warn('TTS unavailable');
    }
  } catch(e) {
    console.error('TTS error', e);
  }
}
}

// --- Global speakOut helper (ensures availability even if speechSynthesis unsupported) ---
const speakOut = async (text) => {
  if (!text) return;
  if ('speechSynthesis' in window) {
    populateVoices();
    const lc = userLang.toLowerCase();
    let voice = speechVoices.find(v => v.lang && v.lang.toLowerCase().startsWith(lc));
    if (!voice && lc.includes('-')) {
      const prefix = lc.split('-')[0];
      voice = speechVoices.find(v => v.lang && v.lang.toLowerCase().startsWith(prefix));
    }
    if (voice) {
      const utt = new SpeechSynthesisUtterance(text);
      utt.voice = voice;
      utt.lang = voice.lang;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
      return;
    }
  }
  // fallback to server TTS
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({text, lang: userLang})
    });
    const data = await res.json();
    if (data.audio) {
      new Audio('data:audio/mp3;base64,'+data.audio).play();
    } else {
      console.warn('TTS unavailable');
    }
  } catch(e) {
    console.error('TTS error', e);
  }
};

function translateUI() {
  const dict = translations[userLang] || translations['en'];
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    if(dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
    const key = el.getAttribute('data-i18n-placeholder');
    if(dict[key]) el.placeholder = dict[key];
  });
}

// --- Weather Fetch with Geolocation ---
function fetchWeatherBox() {
  // Try #weather-box first, fallback to #weather
  const weatherDiv = document.getElementById('weather-box') || document.getElementById('weather');
  if (!weatherDiv) return;
  weatherDiv.textContent = 'Loading weather...';
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetch(`/api/weather?lat=${lat}&lon=${lon}`)
          .then(resp => resp.json())
          .then(data => {
            weatherDiv.textContent = data.weather || 'No weather data.';
          })
          .catch(() => {
            weatherDiv.textContent = 'Error fetching weather.';
          });
      },
      (error) => {
        console.error('Geolocation error:', error);
        weatherDiv.textContent = 'Location access denied.';
      }
    );
  } else {
    weatherDiv.textContent = 'Geolocation not supported.';
  }
}

// Fetch weather on page load
window.addEventListener('DOMContentLoaded', fetchWeatherBox);
// Fetch weather when button is clicked
const weatherBtn = document.getElementById('fetchWeatherBtn');
if (weatherBtn) weatherBtn.addEventListener('click', fetchWeatherBox);

// --- Mandi Prices Fetch ---
async function fetchMandiPrices() {
  const mandiDiv = document.getElementById('mandi');
  mandiDiv.textContent = 'Loading...';
  const market = marketSelect.value;
  const commodity = commoditySelect.value;
  let url = `/api/mandi?market=${market}&commodity=${commodity}`;
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    latestMandi = data.prices || 'No data';
    mandiDiv.textContent = latestMandi;
  } catch (e) {
    mandiDiv.textContent = 'Error fetching mandi prices.';
  }
}

// --- Event Listeners ---
fetchWeatherBtn.addEventListener('click', function() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLat = pos.coords.latitude;
        userLon = pos.coords.longitude;
        fetchWeather(userLat, userLon);
      },
      () => {
        fetchWeather(); // fallback
      }
    );
  } else {
    fetchWeather();
  }
});

fetchMandiBtn.addEventListener('click', fetchMandiPrices);

marketSelect.addEventListener('change', fetchMandiPrices);
commoditySelect.addEventListener('change', fetchMandiPrices);

langSelect.addEventListener('change', function() {
  userLang = langSelect.value;
  translateUI();
});

// --- On page load ---
window.addEventListener('DOMContentLoaded', () => {
  translateUI();
  // Try to get user location for weather
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLat = pos.coords.latitude;
        userLon = pos.coords.longitude;
        fetchWeather(userLat, userLon);
      },
      () => {
        fetchWeather();
      }
    );
  } else {
    fetchWeather();
  }
  fetchMandiPrices();
});

// Analyze button click
analyzeBtn.addEventListener('click', async () => {
  const file = imageInput.files[0];
  if (!file) {
    resultsDiv.textContent = 'Please upload a leaf image.';
    return;
  }
  const formData = new FormData();
  formData.append('image', file);
  formData.append('lang', userLang);
  resultsDiv.textContent = 'Analyzing...';
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.class) {
      const confPct = (data.confidence * 100).toFixed(1);
      resultsDiv.textContent = `Predicted Disease: ${data.class} (confidence: ${confPct}%). Remedy: ${data.remedy}`;
    } else if (data.error) {
      resultsDiv.textContent = `Error: ${data.error}`;
    } else {
      resultsDiv.textContent = 'No result.';
    }
  } catch (e) {
    resultsDiv.textContent = 'Error analyzing image.';
  }
});

// Voice input
voiceBtn.addEventListener('click', () => {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionGlobal = new SpeechRecognition();
    // map lang code to recognition locale (assumes xx language code)
    recognitionGlobal.lang = userLang === 'en' ? 'en-IN' : `${userLang}-IN`;
    recognitionGlobal.onresult = (event) => {
      textQuery.value = event.results[0][0].transcript;
    };
    recognitionGlobal.onerror = () => {
      resultsDiv.textContent = 'Voice recognition error.';
    };
    recognitionGlobal.start();
  } else {
    resultsDiv.textContent = 'Web Speech API not supported.';
  }
});

// Stop button handler
stopBtn.addEventListener('click', ()=>{
  window.speechSynthesis.cancel();
  if(recognitionGlobal){
    try{ recognitionGlobal.abort(); }catch(e){}
  }
});

// Text query submit (Enter key)
if (textQuery) {
  textQuery.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      await handleTextQuery();
    }
  });
}

// Send button click
if (sendBtn) {
  sendBtn.addEventListener('click', async () => {
    await handleTextQuery();
  });
}

async function handleTextQuery() {
  const query = textQuery.value.trim();
  if (!query) return;
  resultsDiv.textContent = 'Processing query...';
  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, lang: userLang, lat: userLat, lon: userLon, mandi: latestMandi })
    });
    const data = await resp.json();
    resultsDiv.textContent = data.reply || 'No reply.';
  } catch (e) {
    resultsDiv.textContent = 'Error processing query.';
  }
}

// Speak advice
if (speakAdviceBtn) {
  speakAdviceBtn.addEventListener('click', () => {
    speakOut(resultsDiv.textContent);
  });
}

// Fetch weather
async function fetchWeather(lat=null, lon=null) {
  let url = '/api/weather';
  if(lat!==null && lon!==null){ url += `?lat=${lat}&lon=${lon}`; }
  try {
    const res = await fetch(url);
    const data = await res.json();
    weatherDiv.textContent = data.weather || 'No data.';
  } catch (e) {
    weatherDiv.textContent = 'Error fetching weather.';
  }
}

// Fetch mandi prices
async function fetchMandi() {
  try {
    const res = await fetch('/api/mandi');
    const data = await res.json();
    mandiDiv.textContent = data.prices || 'No data.';
  } catch (e) {
    mandiDiv.textContent = 'Error fetching mandi prices.';
  }
}
