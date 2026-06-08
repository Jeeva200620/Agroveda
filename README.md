---
title: Agroveda
emoji: 🌿
colorFrom: green
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# 🌿 AgroVeda - AI-Powered Agricultural Expert System

AgroVeda is a premium, high-performance agricultural expert web application designed to empower farmers and agronomists with real-time AI crop consultation, clinical-grade plant disease detection, localized agricultural weather analytics, and cloud database persistence.

---

## ✨ Key Features

### 🎙️ Multi-Lingual AI Expert Advisor
* Powered by **Groq (Llama 3.3 70B)** for lightning-fast, comprehensive, and educational agricultural guidance.
* Out-of-the-box support for both **English** and **Tamil (தமிழ்)**.
* Explains plant diseases through biological causes, symptoms, and step-by-step organic or chemical treatment protocols.

### 🩺 AgroVision AI (Vision Model)
* Integrated TensorFlow image classifier (`agroveda_crop_model.h5`) trained on the PlantVillage dataset.
* Automatically analyzes and diagnoses crop health and pest infections (e.g., Early Blight, Late Blight, Leaf Mold, Bacterial Spot, Spider Mites) from user-uploaded images.

### 🌦️ Localized Micro-Climate Weather Hub
* **Auto-Location**: Detects farm coordinates via browser geolocation.
* **Micro-Climate Zones**: Fetches live weather conditions for the selected city and lists temperatures for 5+ surrounding agricultural sub-stations.
* **24h Forecast**: Smooth scrollable hourly temperature and condition tracker.

### 🔐 Supabase Cloud Integration
* **User Authentication**: Secure Sign Up and Sign In flows with configurable email confirmation settings.
* **Persistent Settings**: User name, region, role, default soil type, and weather alert preferences are saved to the cloud.
* **AI Optimization**: Dynamically outputs personalized, localized agricultural advice based on the user's soil type and location.
* **Chat Logs**: Automatically saves and restores conversation history for each authenticated user session.
* **Cloud Storage**: Uploads uploaded crop images to a Supabase Storage bucket (`plant_images`) for persistent retrieval.

### 🎨 Premium User Interface
* **Organic Palette**: Clean, simple, gentle light-green theme tailored for agricultural applications (using primary `#3b6e4c` and secondary `#557a5e` green tones).
* **Glassmorphic Design**: Modern, responsive layout featuring quick-access sidebar, dynamic state badges, and interactive profile/notification dropdowns.

---

## ⚙️ Technology Stack
* **Backend**: Flask (Python)
* **AI/ML**: Groq API (LLM inference), TensorFlow (Local computer vision classification)
* **Database & Auth**: Supabase (PostgreSQL DB, Auth, Object Storage)
* **Frontend**: Vanilla HTML5, CSS3, Tailwind CSS (Form controls), Google Material Symbols

---

## 🚀 Installation & Local Setup

### 1. Clone & Environment Setup
Clone the repository to your local machine and set up a virtual environment:
```bash
git clone <your-repository-url>
cd agri_chat_bot
python -m venv venv
```

### 2. Activate & Install Dependencies
* **Windows**:
  ```powershell
  venv\Scripts\activate
  pip install -r requirements.txt
  ```
* **Linux/macOS**:
  ```bash
  source venv/bin/activate
  pip install -r requirements.txt
  ```

### 3. Database Schema Setup
Execute the following schema in your **Supabase SQL Editor** to create the tables and configure Row Level Security (RLS) policies:

```sql
-- Create Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text not null default 'Farmer',
  location text default 'Madurai, Tamil Nadu',
  soil_type text default 'Alluvial Soil',
  weather_alerts boolean default true,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view and edit their own profiles." 
  on public.profiles for all 
  using (auth.uid() = id);

-- Create Chats Table
create table public.chats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  message text not null,
  is_user boolean not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.chats enable row level security;

create policy "Users can view and create their own chat history." 
  on public.chats for all 
  using (auth.uid() = user_id);
```

### 4. Storage Bucket Setup
1. In your Supabase dashboard, go to **Storage**.
2. Create a new bucket named `plant_images`.
3. Set the bucket privacy setting to **Public** (so public URLs can be fetched).

### 5. Environment Variables
Create a `.env` file in the root folder of the project:
```env
GROQ_API_KEY=your_groq_api_key
WEATHER_API_KEY=your_openweathermap_api_key
```

### 6. Run Local Server
```bash
python app.py
```
Open `http://127.0.0.1:5000` in your web browser.

---

## ☁️ Deployment on Railway

The repository is configured out-of-the-box for production deployment on **Railway**:

1. **Gunicorn Server**: Already added to the dependency manifest.
2. **Launch Procfile**: Includes a [Procfile](file:///c:/Users/Jeeva/agri_chat_bot/Procfile) specifying `web: gunicorn app:app`.
3. **Deployment**:
   - Go to your **[Railway Dashboard](https://railway.app/)**.
   - Create a new service and select **Deploy from GitHub repo**.
   - Select your repository.
   - Go to the **Variables** tab and set the environment variables:
     * `GROQ_API_KEY`
     * `WEATHER_API_KEY`
   - Railway will build and host the application automatically.
