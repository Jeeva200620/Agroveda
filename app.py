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
# --- GROQ LLM CONFIGURATION (FREE TIER MULTI-MODEL FALLBACK) ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
GROQ_MODELS = [
    "openai/gpt-oss-120b",        # 120B SOTA verified on user key
    "openai/gpt-oss-20b",         # Fast high-efficiency fallback
    "qwen/qwen3.8-27b",           # Multilingual agricultural fallback
    "llama-3.3-70b-versatile"     # Standard legacy fallback
]

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
        system_rules = (
            "You are AgroVeda, a senior agricultural scientist, agronomy researcher, and experienced plant pathologist. "
            "MANDATORY REQUIREMENT: For EVERY response, you MUST provide BOTH English AND Tamil explanations, clearly organized into two sections: "
            "<div class='space-y-4'>"
            "<div class='p-3 bg-white/70 dark:bg-black/30 rounded-xl border border-primary/20'>"
            "<h4 style='color:#1b5e20; font-weight:bold; margin-bottom:8px;'>🇬🇧 Agricultural Expert Clinical Analysis (English)</h4>"
            "Provide thorough, high-level scientific and practical advice: clinical symptoms, pathogen biology, disease cycle, and step-by-step integrated crop management."
            "</div>"
            "<div class='p-3 bg-white/70 dark:bg-black/30 rounded-xl border border-primary/20'>"
            "<h4 style='color:#1b5e20; font-weight:bold; margin-bottom:8px;'>🇮🇳 விவசாயிகளுக்கான நேரடி வழிகாட்டுதல் (தமிழ் விளக்கம்)</h4>"
            "அறிகுறிகள், உடனடி தீர்வு, இயற்கை மற்றும் இரசாயன பூச்சிக்கொல்லி தெளிக்கும் முறைகள், மற்றும் வானிலைக்கேற்ற களப் பாதுகாப்பு முறைகளை எளிய தமிழில் முழுமையாக விளக்கவும்."
            "</div>"
            "</div>"
            "Do NOT use markdown asterisks or backticks. Use ONLY HTML tags: <b>, <h4>, <p>, <ul>, <li>, <br>. "
        )
        if market_context:
            system_rules += f" Current Market Prices: {market_context}. "
        if weather_context:
            system_rules += f" Current Weather Condition: {weather_context}. Include climate-tailored advice (irrigation timing, spray safety during wind/rain). "

        messages = [
            {'role': 'system', 'content': system_rules},
            {'role': 'user', 'content': user_query}
        ]
        
        last_error = None
        for model_name in GROQ_MODELS:
            try:
                chat_completion = client.chat.completions.create(
                    messages=messages,
                    model=model_name,
                )
                return chat_completion.choices[0].message.content
            except Exception as model_err:
                last_error = model_err
                continue
                
        return f"Sorry, there was an error processing your request: {str(last_error)}"

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
    
    response_payload = {
        "response": image_html + (llm_response or "I'm having trouble connecting to my brain right now."),
        "weather": weather_data,
        "detected_crop": detected_crop,
        "confidence": confidence
    }
    return jsonify(response_payload)

# --- 3D DIGITAL TWIN & BLENDER SIMULATION ENDPOINTS ---
from concurrent.futures import ThreadPoolExecutor
import uuid
from blender.scripts.seir_math import calculate_infection_timeline
from blender_bridge.scene_generator import (
    generate_disease_simulation_video,
    generate_soil_visualization,
    generate_treatment_zone_map
)

sim_executor = ThreadPoolExecutor(max_workers=2)
SIMULATION_JOBS = {}

@app.route('/api/visualize-disease', methods=['POST'])
def visualize_disease():
    """
    Dual-Track 3D Disease Simulation Endpoint.
    Returns mathematical SEIR timeline points immediately for 0ms Three.js WebGL display,
    and asynchronously dispatches Blender HD rendering.
    """
    data = request.json or {}
    disease_name = data.get('disease_name', 'Tomato_Early_blight')
    wind_speed = float(data.get('wind_speed', 12.0))
    wind_deg = float(data.get('wind_deg', 90.0))
    humidity = float(data.get('humidity', 75.0))
    temp = float(data.get('temp', 26.0))
    user_id = data.get('user_id', 'guest')

    job_id = str(uuid.uuid4())[:8]

    # 1. Instant SEIR Mathematical Timeline (Takes 1ms)
    sim_data = calculate_infection_timeline(
        disease_name=disease_name,
        wind_deg=wind_deg,
        wind_speed=wind_speed,
        humidity=humidity,
        temp=temp
    )

    # 2. Register job state
    SIMULATION_JOBS[job_id] = {
        "job_id": job_id,
        "status": "rendering",
        "disease_name": disease_name,
        "tamil_label": sim_data.get("tamil_label", ""),
        "timeline": sim_data.get("timeline", {}),
        "stats": sim_data.get("stats", {}),
        "media_url": None
    }

    # 3. Offload Blender render to background thread worker
    def render_worker():
        try:
            url = generate_disease_simulation_video(
                job_id=job_id,
                disease_name=disease_name,
                tamil_label=sim_data.get("tamil_label", ""),
                timeline=sim_data.get("timeline", {}),
                wind_speed=wind_speed,
                wind_deg=wind_deg,
                user_id=user_id
            )
            SIMULATION_JOBS[job_id]["media_url"] = url
            SIMULATION_JOBS[job_id]["status"] = "completed"
        except Exception as e:
            print(f"[Worker Error] Simulation {job_id} failed: {e}")
            SIMULATION_JOBS[job_id]["status"] = "failed"
            SIMULATION_JOBS[job_id]["error"] = str(e)

    sim_executor.submit(render_worker)

    # Return immediately (HTTP 202 Accepted) so browser never times out
    return jsonify({
        "status": "accepted",
        "job_id": job_id,
        "disease_name": disease_name,
        "tamil_label": sim_data.get("tamil_label", ""),
        "timeline": sim_data.get("timeline", {}),
        "stats": sim_data.get("stats", {})
    }), 202

@app.route('/api/simulation-status/<job_id>', methods=['GET'])
def get_simulation_status(job_id):
    job = SIMULATION_JOBS.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(job)

@app.route('/api/visualize-soil', methods=['POST'])
def visualize_soil():
    data = request.json or {}
    soil_type = data.get('soil_type', 'Clay Loam')
    moisture = float(data.get('moisture_level', 68.0))
    user_id = data.get('user_id', 'guest')
    url = generate_soil_visualization(soil_type, moisture, user_id)
    return jsonify({"status": "success", "media_url": url})

@app.route('/api/visualize-treatment', methods=['POST'])
def visualize_treatment():
    data = request.json or {}
    infected_nodes = data.get('infected_nodes', [[5, 5]])
    treatment_type = data.get('treatment_type', 'Trichoderma Harzianum (Bio-Fungicide)')
    user_id = data.get('user_id', 'guest')
    url = generate_treatment_zone_map(infected_nodes, treatment_type, user_id)
    return jsonify({"status": "success", "media_url": url})

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

