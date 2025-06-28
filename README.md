# KrishiVaani 

Smart Farming Insights for Indian Farmers
> KrishiVaani AI is an open-source, bilingual-first platform that turns any low-end phone into a pocket agronomist. Snap a leaf photo, ask questions in your mother-tongue, and get actionable, hyper-local advice spoken back to you – even offline.

![image](https://github.com/user-attachments/assets/c75bd89c-a1c2-4798-bb75-7c028c62cad2)

![Screenshot 2025-06-25 200033](https://github.com/user-attachments/assets/f9fb467b-0d06-4316-b95b-c3a94741420c)

![image](https://github.com/user-attachments/assets/dd4c6329-7f0a-49c2-bb4a-7fe626597897)

![image](https://github.com/user-attachments/assets/6453da56-5dfa-412b-8116-23c92acbf54a)

![image](https://github.com/user-attachments/assets/b73a9d0f-c99b-4ac6-96a1-eeba7286d7aa)

![image](https://github.com/user-attachments/assets/05397c18-483b-4ebe-8a4f-c284a3904e5f)

![Screenshot 2025-06-27 203627](https://github.com/user-attachments/assets/e19994b2-f512-4519-bf0d-f2dbbfe40ded)



## Features
- Leaf-disease & pest classification (MobileNetV2 inference inside Flask – no TorchServe needed)
- Upload photo or speak/type query (Web Speech API, Whisper fallback)
- Vernacular remedy advice (10+ Indian languages)
- Live weather forecasts (OpenWeatherMap)
- Local mandi prices (MandiAPI/custom scraper)
- Voice & text I/O
- Retro pixel-art UI (Tailwind CSS, Press Start 2P)

## Getting Started

### 1. Install dependencies
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Run Flask backend
```bash
python app.py
```

### 3. Open `index.html` in your browser

---

## Model Setup (for /api/analyze)
- Ensure `mobilenetv2_leaf_disease_final.pth` is present in the project root.
- If you need to train / fine-tune the model, see `notebooks/` for training code (coming soon).

## Environment Variables
- Set your Gemini API key as an environment variable or in a `.env` file for `/api/chat`.

## Deployment
- Frontend: Netlify (static)
- Backend: Deploy Flask app as a service or serverless function.

---

## Credits
- Background images: see `/images`
- Font: Press Start 2P (Google Fonts)

---

For dataset/model or API setup help, contact the maintainer.

---

## 📜 Problem Statement
Smallholder Indian farmers often struggle with crop diseases, weather unpredictability and market-price opacity. Existing advisory apps are usually English-centric, need high bandwidth, or miss local context, leaving millions without timely, actionable guidance.

## 💡 Solution – KrishiVaani AI
An end-to-end web platform that delivers disease diagnosis, personalised remedies, live weather and mandi prices – all in the farmer’s own language and with voice I/O so even semi-literate users can benefit.

## ✨ Unique Features
- **Leaf Disease & Pest Detection** – MobileNetV2 model predicts 30+ crop ailments directly in Flask (CPU-only) within ~300 ms.
- **Multilingual Advice (10+ Indic languages)** – Gemini-powered responses dynamically translated; UI text and speech adapt instantly when the farmer switches language.
- **Listen & Speak** – Web-Speech API with gTTS fallback lets users ask questions and hear answers hands-free.
- **Hyper-local Weather** – Geo-location based forecast stitched into advice.
- **Live Mandi Prices** – AGMARKNET feed with commodity & market filters.
- **Retro Pixel-Art UI** – Lightweight Tailwind + Press Start 2P evokes 8-bit familiarity while remaining responsive on 3G devices.
- **Fully Offline-Capable Inference** – No cloud GPU; everything runs inside the farmer’s browser + modest Flask server.

## 🛠️ Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | HTML5, Tailwind CSS (CDN), Vanilla JS, Web Speech API, gTTS audio fallback |
| Backend | Python 3.11, Flask 3, Torch 2 / torchvision (MobileNetV2), google-generativeai (Gemini), requests, python-dotenv |
| Data | PlantVillage leaf-disease dataset, OpenWeatherMap, data.gov.in AGMARKNET |
| Deployment | Netlify (static), Git + GitHub, Windows 10 dev box |

## 📂 Directory Structure
```
├── app.py                     # Flask app (routes /api/* and serves frontend)
├── index.html                 # Retro UI
├── main.js                    # Front-end logic (i18n, voice, fetch APIs)
├── requirements.txt
├── images/
│   └── pixel-art-background.webp
├── data/                      # PlantVillage dataset (not in repo)
├── notebooks/
│   ├── train_mobilenetv2_leaf_disease.ipynb
│   └── ...
├── mobilenetv2_leaf_disease_final.pth
├── split_train_val.py         # Dataset helper
├── torchserve_handler.py      # Legacy (no longer required)
└── README.md (you are here)
```

## 🚀 Quick Start
```bash
# 1. install deps
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt

# 2. add API keys
copy config.sample.env config.env  # then edit GEMINI_API_KEY etc.

# 3. run backend + open http://127.0.0.1:5000
python app.py
```

## 🛣️ Roadmap / Future Enhancements
- Progressive-Web-App (PWA) offline caching & home-screen install.
- Camera capture + real-time disease detection overlay.
- Integrate Satellite NDVI & rainfall forecasts for crop suitability.
- SMS & WhatsApp bot connectors for feature-phone reach.
- Farmer community Q&A and crowdsourced remedy ratings.
- Voice cloning (e.g., regional announcer persona) using edge-TTS models.

## 🤝 Contributing
Pull requests welcome! Please lint with `ruff` + `prettier`, and ensure new features have corresponding unit tests.

## 📄 License
MIT © 2025 KrishiVaani AI Team

