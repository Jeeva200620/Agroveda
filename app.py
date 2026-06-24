import os
import time
import random
from flask import Flask, render_template, request, jsonify
import json
from groq import Groq
from dotenv import load_dotenv

# Load Environment Variables
load_dotenv()

app = Flask(__name__)

# --- GROQ LLM CONFIGURATION ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
GROQ_MODEL = "llama-3.3-70b-versatile" 

# Import Weather Fetcher
try:
    from weather_fetcher import get_weather_data
except ImportError:
    def get_market_prices(force_refresh=False): return [] # Placeholder for now
    def get_weather_data(city="Chennai"): return None

def get_llm_response(user_query, language='en', market_context=None, weather_context=None):
    if not client:
        return "Groq API Key not configured. Please add GROQ_API_KEY to your .env file."

    try:
        if language == 'ta':
            system_rules = (
                "நீங்கள் 'AgroVeda' என்ற மிகவும் அனுபவம் வாய்ந்த விவசாய நிபுணர் மற்றும் தாவர மருத்துவர். "
                "பயிர்கள், மண், நோய்கள் மற்றும் பூச்சிகள் பற்றி விவசாயிகளுக்கு விரிவான மற்றும் தொழில்முறை ஆலோசனைகளை வழங்கவும். "
                "உங்கள் பதில்கள் மிகவும் விரிவாகவும், கல்வி சார்ந்ததாகவும் இருக்க வேண்டும். சுருக்கமான பதில்களைத் தவிர்க்கவும். "
                "விவசாயிகள் தீர்வுகளை நிஜ வாழ்க்கையில் செயல்படுத்த உதவும் வகையில் எப்போதும் குறிப்பிட்ட உதாரணங்களை வழங்கவும். "
                "நோய்களைக் பற்றி கேட்கும் போது, முழுமையான மருத்துவ பகுப்பாய்வு செய்யவும்: அறிகுறிகள், உயிரியல் காரணங்கள் மற்றும் படிப்படியான சிகிச்சை முறைகளை விளக்கவும். "
                "முக்கியமானது: உங்கள் பதில்கள் அனைத்தும் தமிழில் இருக்க வேண்டும். "
                "HTML டேக்குகளை மட்டும் பயன்படுத்தவும்: <b>, <br>, <ul>, <li>. "
            )
            if market_context:
                system_rules += f" உங்களிடம் பின்வரும் நேரடி சந்தை விலைகள் உள்ளன: {market_context}. "
            if weather_context:
                system_rules += f" இன்றைய வானிலை நிலவரம்: {weather_context}. வானிலை தொடர்பான ஆலோசனைகளை விவசாயிகளுக்கு வழங்க இதைப் பயன்படுத்தவும். "
        else:
            system_rules = (
                "You are AgroVeda, a highly experienced senior agricultural expert and plant pathologist. "
                "Provide detailed, comprehensive, and professional advice on crops, soil, diseases, and pest management. "
                "Do NOT provide short or one-word answers. Your responses should be thorough and educational. "
                "ALWAYS provide specific, practical examples to help farmers visualize the implementation. "
                "When addressing plant diseases, perform a full clinical analysis: identify symptoms, explain biological causes, and provide step-by-step treatment protocols. "
                "IMPORTANT: Do NOT use Markdown. Use ONLY HTML tags. "
                "Use <b> for bold text, <br> for line breaks, and <ul>/<li> for structured lists. "
            )
            if market_context:
                system_rules += f" You have access to current Real-Time Market Prices: {market_context}. Use these for market-related queries. "
            if weather_context:
                system_rules += f" Current Weather Data: {weather_context}. Use this to provide climate-specific advice (e.g., irrigation timing, pest control safety during rain). "

        messages = [
            {'role': 'system', 'content': system_rules},
            {'role': 'user', 'content': user_query}
        ]
        
        chat_completion = client.chat.completions.create(
            messages=messages,
            model=GROQ_MODEL,
        )
        return chat_completion.choices[0].message.content

    except Exception as e:
        return f"Sorry, there was an error processing your request: {str(e)}"

# --- IMAGE MODEL LOGIC (Local but optional) ---
try:
    import tensorflow as tf
    import numpy as np
    from PIL import Image
    crop_model = tf.keras.models.load_model('agroveda_crop_model.h5', compile=False)
    # Actual classes from the user's PlantVillage-trained model
    CROP_CLASSES = [
        "Pepper__bell___Bacterial_spot", "Pepper__bell___healthy",
        "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
        "Tomato_Bacterial_spot", "Tomato_Early_blight", "Tomato_Late_blight",
        "Tomato_Leaf_Mold", "Tomato_Septoria_leaf_spot",
        "Tomato_Spider_mites_Two_spotted_spider_mite", "Tomato__Target_Spot",
        "Tomato__Tomato_YellowLeaf__Curl_Virus", "Tomato__Tomato_mosaic_virus",
        "Tomato_healthy"
    ]
except Exception as e:
    print(f"Vision engine disabled: {e}")
    crop_model = None
    CROP_CLASSES = []

def get_simulated_analysis(user_query, image_file=None):
    detected_crop = None
    confidence = 0
    if image_file and crop_model is not None:
        try:
            img = Image.open(image_file).convert('RGB')
            img = img.resize((224, 224))
            img_array = np.array(img) / 255.0
            img_array = np.expand_dims(img_array, axis=0)
            preds = crop_model.predict(img_array)
            class_idx = np.argmax(preds[0])
            confidence = float(np.max(preds[0]))
            if class_idx < len(CROP_CLASSES):
                detected_crop = CROP_CLASSES[class_idx]
        except: pass
    return detected_crop, confidence

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    user_query = request.form.get('query', '')
    image_file = request.files.get('image')
    language = request.form.get('lang', 'en')
    
    detected_crop = None
    confidence = 0
    image_html = ""
    
    # Process Image
    if image_file:
        detected_crop, confidence = get_simulated_analysis(user_query, image_file)
        if detected_crop:
            image_html = f"<div class='vision-badge'><i class='fa-solid fa-camera'></i> Identified: <b>{detected_crop}</b> ({confidence:.1%})</div>"
            user_query = f"[IMAGE ANALYSIS: User uploaded image of {detected_crop}. Confidence: {confidence:.2f}] {user_query}"

    # 3. Weather Context - Detect City from Query if possible
    # We'll use a simple keyword search for common Indian cities/states, or let Groq handle it
    target_city = "Chennai" # Default
    common_locations = ["Delhi", "Mumbai", "Kolkata", "Bangalore", "Hyderabad", "Salem", "Coimbatore", "Madurai", "Trichy", "Karur", "Thanjavur", "Tamil Nadu", "Kerala", "Karnataka", "Andhra", "Punjab"]
    for loc in common_locations:
        if loc.lower() in user_query.lower():
            target_city = loc
            break

    weather_data = get_weather_data(target_city)
    weather_string = f"{weather_data['temp']}°C, {weather_data['condition']} in {weather_data['city']}" if weather_data else "Unavailable"

    # Get Response from Groq
    llm_response = get_llm_response(user_query, language=language, market_context=None, weather_context=weather_string)
    
    if llm_response:
        return jsonify({
            "response": image_html + llm_response,
            "weather": weather_data
        })
            
    return jsonify({
        "response": image_html + "I'm having trouble connecting to my brain right now. Please try again soon.",
        "weather": weather_data
    })

@app.route('/weather')
@app.route('/api/weather')
def weather():
    city = request.args.get('city')
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    data = get_weather_data(city=city, lat=lat, lon=lon)
    if data:
        return jsonify(data)
    return jsonify({"error": "Weather unavailable"}), 500

@app.route('/ping')
def ping():
    """Health-check endpoint for uptime monitoring (e.g., UptimeRobot)."""
    return jsonify({"status": "alive", "service": "AgroVeda"}), 200

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 7860))
    app.run(host="0.0.0.0", port=port, debug=True)
