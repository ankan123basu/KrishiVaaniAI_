import os
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
import io
import json
from flask import Flask, request, jsonify, send_file, send_from_directory, url_for, redirect
import os
from werkzeug.utils import secure_filename
from flask_cors import CORS
import requests
from gtts import gTTS
import base64

# Load config.env
from dotenv import load_dotenv
load_dotenv('config.env')

# Load class to index mapping
with open('index_to_name.json', 'r') as f:
    class_to_name = json.load(f)
    idx_to_class = {int(k): v for k, v in class_to_name.items()}

# Initialize the model
def load_model(model_path):
    # Create model
    model = models.mobilenet_v2(num_classes=len(idx_to_class))
    
    # Load the trained weights
    checkpoint = torch.load(model_path, map_location=torch.device('cpu'))
    
    # Handle DataParallel or other wrappers
    if isinstance(checkpoint, torch.nn.DataParallel):
        checkpoint = checkpoint.module
    
    # Load state dict
    model.load_state_dict(checkpoint)
    model.eval()
    return model

# Load the model
model = load_model('mobilenetv2_leaf_disease_final.pth')

# Image transformations
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def predict_image(image_bytes):
    # Open and preprocess the image
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    input_tensor = preprocess(image)
    input_batch = input_tensor.unsqueeze(0)  # Create a mini-batch
    
    # Make prediction
    with torch.no_grad():
        output = model(input_batch)
    
    # Get the predicted class
    _, predicted_idx = torch.max(output, 1)
    predicted_class = idx_to_class[predicted_idx.item()]
    
    return predicted_class, output

# Simple remedy mapping (you can expand this with more detailed remedies)
REMEDY_MAP = {
    'Apple___Apple_scab': 'Apply fungicides and practice good sanitation by removing infected leaves.',
    'Apple___Black_rot': 'Prune infected branches and apply appropriate fungicides.',
    'Apple___Cedar_apple_rust': 'Remove nearby cedar trees if possible and apply fungicides.',
    'Apple___healthy': 'Your plant looks healthy! Maintain good growing conditions.',
    'Cherry___Powdery_mildew': 'Apply sulfur or potassium bicarbonate-based fungicides.',
    'Corn___Cercospora_leaf_spot Gray_leaf_spot': 'Use resistant varieties and apply appropriate fungicides.',
    'Corn___Common_rust': 'Plant resistant varieties and apply fungicides if necessary.',
    'Corn___Northern_Leaf_Blight': 'Rotate crops and use resistant varieties.',
    'Grape___Black_rot': 'Apply fungicides and remove infected plant material.',
    'Grape___Esca_(Black_Measles)': 'Prune infected vines and apply appropriate treatments.',
    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': 'Apply fungicides and improve air circulation.',
    'Grape___healthy': 'Your grape plant looks healthy! Maintain good growing conditions.',
    'Potato___Early_blight': 'Rotate crops and apply fungicides preventatively.',
    'Potato___Late_blight': 'Remove and destroy infected plants, apply fungicides.',
    'Potato___healthy': 'Your potato plant looks healthy! Maintain good growing conditions.'
}

def get_remedy(disease_name):
    return REMEDY_MAP.get(disease_name)


def translate_text(text, target_lang):
    """Translate given text to target_lang using Gemini if not English."""
    if target_lang == 'en' or not text:
        return text
    prompt = f"Translate the following agricultural advice into {target_lang}. Keep scientific names or pesticide ingredient names untranslated.\n\n{text}"
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        resp = requests.post(url, json=payload, timeout=15)
        resp.raise_for_status()
        return resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception:
        return text


def generate_remedy_gemini(disease_name, lang='en'):
    """Query Gemini API for a concise remedy if not in static map."""
    prompt = f"""
    You are an expert plant pathologist. In one or two sentences, provide a practical field-level remedy for the following crop disease so that it is understandable by Indian farmers.
    Return plain text with no bullet points or asterisks.
    Language: {lang}
    Disease: {disease_name}
    """
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.6, "maxOutputTokens": 60}
        }
        resp = requests.post(url, json=payload, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        return text
    except Exception:
        return "Consult a local agricultural expert for specific treatment options."

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure static directory exists
os.makedirs('static/images', exist_ok=True)

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')
MANDI_API_KEY = os.getenv('MANDI_API_KEY')

# Serve index.html for root and /index.html
@app.route('/')
@app.route('/index.html')
def serve_index():
    return send_file('index.html')

# Serve static files (JS, images, etc.)
@app.route('/static/<path:filename>')
def serve_static(filename):
    try:
        # Handle URL-encoded filenames
        import urllib.parse
        import os
        
        # Decode the filename if it's URL-encoded
        decoded_filename = urllib.parse.unquote(filename)
        
        # Log the request for debugging
        print(f"Serving static file: {decoded_filename}")
        
        # Check if file exists before sending
        static_dir = os.path.join(app.root_path, 'static')
        file_path = os.path.join(static_dir, *decoded_filename.split('/'))
        
        if not os.path.isfile(file_path):
            print(f"File not found: {file_path}")
            return f"File not found: {decoded_filename}", 404
            
        # Set cache control headers
        response = send_from_directory('static', decoded_filename)
        response.headers['Cache-Control'] = 'public, max-age=31536000'  # 1 year cache
        return response
        
    except Exception as e:
        print(f"Error serving static file {filename}: {str(e)}")
        return str(e), 500

# Handle /images/ path for backward compatibility
@app.route('/images/<path:filename>')
def serve_legacy_images(filename):
    try:
        # Log the legacy image request
        print(f"Legacy image request: {filename}")
        # Redirect to the new static path with proper URL encoding
        return redirect(f'/static/images/{filename}')
    except Exception as e:
        print(f"Error in legacy image handler: {str(e)}")
        return str(e), 500

# Serve main.js from root
@app.route('/main.js')
def serve_js():
    return send_file('main.js')

# Serve index.html for all other routes
@app.route('/<path:path>')
def serve_file(path):
    if path.startswith('api/'):
        return "Not found", 404
    if os.path.exists(path):
        return send_file(path)
    return send_file('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """Handle image upload, run inference locally and return prediction & remedy."""
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    lang = request.form.get('lang', 'en')
    image_file = request.files['image']
    try:
        # Read bytes and run model
        image_bytes = image_file.read()
        predicted_class, logits = predict_image(image_bytes)

        # Confidence
        probabilities = torch.nn.functional.softmax(logits[0], dim=0)
        confidence = float(probabilities.max().item())

        # Remedy text
        remedy = get_remedy(predicted_class)
        if remedy is None:
            remedy = generate_remedy_gemini(predicted_class, lang)
        else:
            remedy = translate_text(remedy, lang)

        return jsonify({
            'class': predicted_class,
            'confidence': confidence,
            'remedy': remedy,
            'lang': lang
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/weather', methods=['GET'])
def weather():
    """Return a simple description string for current weather.
    Supports either lat/lon or city name. If both are missing it defaults to Delhi."""
    city = request.args.get('city')
    lat = request.args.get('lat')
    lon = request.args.get('lon')

    try:
        if city:
            params = {'q': city, 'appid': OPENWEATHER_API_KEY, 'units': 'metric'}
        elif lat and lon:
            params = {'lat': lat, 'lon': lon, 'appid': OPENWEATHER_API_KEY, 'units': 'metric'}
        else:
            params = {'q': 'Delhi', 'appid': OPENWEATHER_API_KEY, 'units': 'metric'}

        resp = requests.get('https://api.openweathermap.org/data/2.5/weather', params=params, timeout=10)
        data = resp.json()
        city_name = data.get('name', city or 'your area')
        weather_desc = data['weather'][0]['description']
        temp_c = data['main']['temp']
        weather_str = f"{weather_desc.capitalize()}, {temp_c}°C in {city_name}."

        return jsonify({'weather': weather_str})
    except Exception as e:
        return jsonify({'weather': f'Error: {str(e)}'})

@app.route('/api/mandi', methods=['GET'])
def mandi():
    # Uses data.gov.in AGMARKNET endpoint
    market = request.args.get('market', 'DELHI').upper()
    commodity = request.args.get('commodity', 'Wheat').capitalize()
    try:
        url = (
            'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070'
            f'?api-key={MANDI_API_KEY}&format=json&filters[market]={market}&filters[commodity]={commodity}&limit=5'
        )
        resp = requests.get(url)
        if resp.status_code == 200:
            data = resp.json()
            records = data.get('records', [])
            if not records:
                return jsonify({'prices': 'No mandi price data found.'})
            # Format price info
            prices = [
                f"{rec['commodity']} in {rec['market']} ({rec['state']}): {rec['modal_price']} ₹/quintal on {rec['arrival_date']}"
                for rec in records
            ]
            return jsonify({'prices': '\n'.join(prices)})
        else:
            return jsonify({'prices': 'No data'})
    except Exception as e:
        return jsonify({'prices': f'Error: {str(e)}'})

@app.route('/api/tts', methods=['POST'])
def tts():
    """Return base64 MP3 audio synthesized via gTTS for the given text & lang."""
    data = request.get_json()
    text = data.get('text', '')
    lang = data.get('lang', 'en')
    if not text:
        return jsonify({'error': 'No text'}), 400
    try:
        tts_obj = gTTS(text=text, lang=lang)
        fp = io.BytesIO()
        tts_obj.write_to_fp(fp)
        audio_b64 = base64.b64encode(fp.getvalue()).decode('utf-8')
        return jsonify({'audio': audio_b64})
    except ValueError:
        # gTTS doesn't support the requested language
        return jsonify({'error': 'unsupported_lang'}), 400


@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    query = data.get('query', '')
    lang = data.get('lang', 'en')
    lat = data.get('lat')
    lon = data.get('lon')
    mandi_info = data.get('mandi', '')
    # Fetch current weather for context (use user location if available)
    weather_context = ''
    try:
        if lat and lon:
            weather_params = {'lat': lat, 'lon': lon, 'appid': OPENWEATHER_API_KEY, 'units': 'metric'}
            weather_resp = requests.get('https://api.openweathermap.org/data/2.5/weather', params=weather_params)
            weather_json = weather_resp.json()
            city = weather_json.get('name', 'your area')
            weather_desc = weather_json['weather'][0]['description']
            weather_temp = weather_json['main']['temp']
            weather_context = f"Current weather in {city}: {weather_desc}, {weather_temp}°C."
        else:
            weather_params = {'q': 'Delhi', 'appid': OPENWEATHER_API_KEY, 'units': 'metric'}
            weather_resp = requests.get('https://api.openweathermap.org/data/2.5/weather', params=weather_params)
            weather_json = weather_resp.json()
            weather_desc = weather_json['weather'][0]['description']
            weather_temp = weather_json['main']['temp']
            weather_context = f"Current weather in Delhi: {weather_desc}, {weather_temp}°C."
    except Exception:
        weather_context = "Weather data unavailable."
    # Compose prompt for Gemini
    prompt = f"""
You are KrishiVaani AI, an Indian agriculture assistant.
• ONLY introduce yourself when the farmer greets you (e.g., "hi", "hello") or explicitly asks who you are.
• For all other queries, answer directly without any self-introduction.
• You may answer questions about crops, crop diseases, pests, weather conditions, mandi/market prices and selling decisions, storage or general agriculture.
Weather: {weather_context}
MandiPrices: {mandi_info}
PreferredLanguage: {lang}

---
### FarmerQuestion
{query}

### Guidelines for YourResponse
• Reply in plain text with no Markdown or bullet asterisks (*).
• Keep it concise and actionable.

### YourResponse
"""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [
                {"parts": [{"text": prompt}]}
            ]
        }
        headers = {'Content-Type': 'application/json'}
        resp = requests.post(url, headers=headers, data=json.dumps(payload))
        if resp.status_code == 200:
            reply = resp.json()['candidates'][0]['content']['parts'][0]['text']
            return jsonify({'reply': reply})
        else:
            return jsonify({'reply': 'No reply.'})
    except Exception as e:
        return jsonify({'reply': f'Error: {str(e)}'})

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
