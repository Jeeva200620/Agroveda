// --- Supabase Config Keys ---
const SUPABASE_URL = 'https://mhvargfrzhsspfbxsaul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odmFyZ2Zyemhzc3BmYnhzYXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4OTU0MDUsImV4cCI6MjA5NjQ3MTQwNX0.8go2v5R8ghUvg6W7pjkrJYk0nzlpyLr9h6TDDCmnIVk'; // Replace with your actual anon key

let supabaseClient = null;
try {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (e) {
    console.error("Failed to initialize Supabase client:", e);
}

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const chatHistory = document.getElementById('chat-history');

    // Image Upload Elements
    const attachBtn = document.getElementById('attach-btn');
    const imageInput = document.getElementById('image-upload');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removeImageBtn = document.getElementById('remove-image');

    let currentImageFile = null;
    let currentLanguage = 'en';

    // --- Language Handling ---
    const langEnBtn = document.getElementById('lang-en');
    const langTaBtn = document.getElementById('lang-ta');
    const appTitle = document.querySelector('header h1');
    const appSubTitle = document.querySelector('header p');
    const userInputPlaceholder = document.getElementById('user-input');

    // Dropdowns and Interactive Header Buttons
    const notificationBtn = document.getElementById('notification-btn');
    const notificationDropdown = document.getElementById('notification-dropdown');
    const notificationBadge = document.getElementById('notification-badge');
    const notificationsList = document.getElementById('notifications-list');
    const clearNotificationsBtn = document.getElementById('clear-notifications-btn');

    const profileBtn = document.getElementById('profile-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    const profileSettingsBtn = document.getElementById('profile-settings-btn');
    const weatherWidget = document.getElementById('weather-widget');

    // Display elements inside card
    const profileCardName = document.getElementById('profile-card-name');
    const profileCardRole = document.getElementById('profile-card-role');
    const profileCardLocation = document.getElementById('profile-card-location');
    const profileCardSoil = document.getElementById('profile-card-soil');
    const profileCardQueries = document.getElementById('profile-card-queries');
    const sidebarFarmerName = document.getElementById('sidebar-farmer-name');
    const sidebarFarmerRole = document.getElementById('sidebar-farmer-role');

    // Settings fields
    const settingsFarmerName = document.getElementById('settings-farmer-name');
    const settingsFarmerLocation = document.getElementById('settings-farmer-location');
    const settingsSoilType = document.getElementById('settings-soil-type');
    const settingsWeatherAlerts = document.getElementById('settings-weather-alerts');

    const translations = {
        en: {
            title: "Agricultural Expert Analysis",
            subtitle: "Powered by Llama-3 & AgroVision AI",
            placeholder: "e.g., 'What fertilizer is best for tomatoes in red soil?' or 'Weather in Salem'",
            welcomeTitle: "Hello! I'm AgroVeda.",
            welcomeText: "Your expert agricultural partner. I can help with:",
            welcomeList: [
                "Detailed crop & disease diagnosis from images.",
                "Professional solutions for pests and soil health.",
                "Real-time market insights and weather advice."
            ],
            welcomeFooter: "How can I assist you today?",
            nav: {
                chat: "Chat",
                market: "Market Prices",
                weather: "Weather",
                settings: "Settings",
                role: "Farmer"
            },
            notifications: {
                title: "Notifications",
                clear: "Mark all as read",
                empty: "No new notifications",
                alerts: {
                    rain: "Rain forecast: Heavy rain expected in Madurai within 4 hours. Protect harvested crops.",
                    pest: "Pest Alert: Tomato Leaf Mold cases reported nearby. Inspect your crops.",
                    price: "Market Price Update: Onion prices rose by 15% in Salem today.",
                    saved: "Preferences saved successfully."
                }
            },
            profile: {
                region: "Region:",
                soil: "Soil Type:",
                queries: "Consultations:",
                manage: "Manage Preferences"
            },
            settingsLabels: {
                name: "Farmer Name",
                location: "Region / Location",
                soil: "Default Soil Type",
                alertsTitle: "Weather Alerts",
                alertsDesc: "Get push notifications for extreme weather changes."
            }
        },
        ta: {
            title: "விவசாய நிபுணர் ஆய்வு",
            subtitle: "Llama-3 & அக்ரோவிஷன் AI மூலம் இயக்கப்படுகிறது",
            placeholder: "எ.கா., 'சேலத்தில் வானிலை எப்படி இருக்கிறது?'",
            welcomeTitle: "வணக்கம்! நான் அக்ரோவேதா (AgroVeda).",
            welcomeText: "உங்கள் நிபுணர் விவசாய பங்குதாரர். நான் உதவக்கூடியவை:",
            welcomeList: [
                "படங்களிலிருந்து விரிவான பயிர் மற்றும் நோய் கண்டறிதல்.",
                "பூச்சிகள் மற்றும் மண் ஆரோக்கியத்திற்கான தொழில்முறை தீர்வுகள்.",
                "நேரடி சந்தை நுண்ணறிவு மற்றும் வானிலை ஆலோசனை."
            ],
            welcomeFooter: "இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
            nav: {
                chat: "உரையாடல்",
                market: "சந்தை விலை",
                weather: "வானிலை",
                settings: "அமைப்புகள்",
                role: "விவசாயி"
            },
            notifications: {
                title: "அறிவிப்புகள்",
                clear: "அனைத்தையும் படித்ததாகக் குறிக்கவும்",
                empty: "புதிய அறிவிப்புகள் இல்லை",
                alerts: {
                    rain: "மழை முன்னறிவிப்பு: மதுரையில் 4 மணி நேரத்திற்குள் பலத்த மழை எதிர்பார்க்கப்படுகிறது. அறுவடை செய்த பயிர்களைப் பாதுகாக்கவும்.",
                    pest: "பூச்சி எச்சரிக்கை: தக்காளி இலை அச்சு நோய் அருகில் கண்டறியப்பட்டுள்ளது. உங்கள் பயிர்களை ஆய்வு செய்யவும்.",
                    price: "சந்தை விலை நிலவரம்: சேலத்தில் இன்று வெங்காய விலை 15% உயர்ந்துள்ளது.",
                    saved: "விருப்பத்தேர்வுகள் வெற்றிகரமாகச் சேமிக்கப்பட்டன."
                }
            },
            profile: {
                region: "மண்டலம்:",
                soil: "மண் வகை:",
                queries: "ஆலோசனைகள்:",
                manage: "அமைப்புகளை நிர்வகி"
            },
            settingsLabels: {
                name: "விவசாயி பெயர்",
                location: "மண்டலம் / இருப்பிடம்",
                soil: "இயல்பு மண் வகை",
                alertsTitle: "வானிலை எச்சரிக்கைகள்",
                alertsDesc: "தீவிர வானிலை மாற்றங்களுக்கான புஷ் அறிவிப்புகளைப் பெறுங்கள்."
            }
        }
    };

    let notifications = [
        { id: 1, type: 'rain', key: 'rain', time: '10m ago', read: false },
        { id: 2, type: 'pest', key: 'pest', time: '1h ago', read: false },
        { id: 3, type: 'price', key: 'price', time: '3h ago', read: false }
    ];

    function renderNotificationsList() {
        if (!notificationsList) return;
        const t = translations[currentLanguage];
        notificationsList.innerHTML = '';

        const unreadCount = notifications.filter(n => !n.read).length;
        if (unreadCount > 0) {
            notificationBadge.classList.remove('hidden');
        } else {
            notificationBadge.classList.add('hidden');
        }

        if (notifications.length === 0) {
            notificationsList.innerHTML = `
                <div class="p-6 text-center text-xs text-on-surface-variant/50">
                    <span class="material-symbols-outlined text-3xl mb-2 opacity-35">notifications_off</span>
                    <p>${t.notifications.empty}</p>
                </div>
            `;
            return;
        }

        notifications.forEach(n => {
            const item = document.createElement('div');
            item.className = `p-3 flex items-start gap-3 hover:bg-surface-container/50 transition-colors cursor-pointer ${n.read ? 'opacity-65' : 'bg-primary/5'}`;
            
            let icon = 'info';
            let colorClass = 'text-primary';
            if (n.type === 'rain') { icon = 'cloudy_snowing'; colorClass = 'text-secondary'; }
            else if (n.type === 'pest') { icon = 'bug_report'; colorClass = 'text-error'; }
            else if (n.type === 'price') { icon = 'trending_up'; colorClass = 'text-primary'; }

            const text = t.notifications.alerts[n.key];
            
            item.innerHTML = `
                <span class="material-symbols-outlined ${colorClass} shrink-0 mt-0.5" style="font-size: 1.25rem;">${icon}</span>
                <div class="flex flex-col flex-grow min-w-0">
                    <p class="text-xs font-semibold leading-normal text-on-surface break-words">${text}</p>
                    <span class="text-[9px] text-on-surface-variant/60 mt-1">${n.time}</span>
                </div>
                ${!n.read ? `<span class="w-1.5 h-1.5 bg-primary rounded-full shrink-0 mt-2"></span>` : ''}
            `;

            item.addEventListener('click', (e) => {
                n.read = true;
                renderNotificationsList();
                if (n.type === 'rain') {
                    switchView('weather');
                    notificationDropdown.classList.add('hidden');
                }
            });

            notificationsList.appendChild(item);
        });
    }

    function updateUITranslation(lang) {
        currentLanguage = lang;
        const t = translations[lang];
        appTitle.textContent = t.title;
        appSubTitle.textContent = t.subtitle;
        userInputPlaceholder.placeholder = t.placeholder;

        // Toggle language button active colors dynamically
        if (lang === 'en') {
            if (langEnBtn) {
                langEnBtn.classList.add('bg-primary', 'text-on-primary');
                langEnBtn.classList.remove('bg-surface-container-highest', 'text-on-surface-variant');
            }
            if (langTaBtn) {
                langTaBtn.classList.remove('bg-primary', 'text-on-primary');
                langTaBtn.classList.add('bg-surface-container-highest', 'text-on-surface-variant');
            }
        } else {
            if (langTaBtn) {
                langTaBtn.classList.add('bg-primary', 'text-on-primary');
                langTaBtn.classList.remove('bg-surface-container-highest', 'text-on-surface-variant');
            }
            if (langEnBtn) {
                langEnBtn.classList.remove('bg-primary', 'text-on-primary');
                langEnBtn.classList.add('bg-surface-container-highest', 'text-on-surface-variant');
            }
        }

        // Update sidebar
        if (chatNav) {
            const span = chatNav.querySelector('span:not(.material-symbols-outlined)');
            if (span) span.textContent = t.nav.chat;
        }
        if (weatherNav) {
            const span = weatherNav.querySelector('span:not(.material-symbols-outlined)');
            if (span) span.textContent = t.nav.weather;
        }
        if (settingsNav) {
            const span = settingsNav.querySelector('span:not(.material-symbols-outlined)');
            if (span) span.textContent = t.nav.settings;
        }

        if (sidebarFarmerRole) sidebarFarmerRole.textContent = t.nav.role;
        if (profileCardRole) profileCardRole.textContent = t.nav.role;

        // Update dropdowns & settings translations
        if (document.getElementById('notif-title')) document.getElementById('notif-title').textContent = t.notifications.title;
        if (clearNotificationsBtn) clearNotificationsBtn.textContent = t.notifications.clear;
        if (document.getElementById('profile-lbl-location')) document.getElementById('profile-lbl-location').textContent = t.profile.region;
        if (document.getElementById('profile-lbl-soil')) document.getElementById('profile-lbl-soil').textContent = t.profile.soil;
        if (document.getElementById('profile-lbl-queries')) document.getElementById('profile-lbl-queries').textContent = t.profile.queries;
        if (document.getElementById('profile-btn-manage')) document.getElementById('profile-btn-manage').textContent = t.profile.manage;

        // Settings view translations
        if (document.getElementById('lbl-settings-name')) document.getElementById('lbl-settings-name').textContent = t.settingsLabels.name;
        if (document.getElementById('lbl-settings-location')) document.getElementById('lbl-settings-location').textContent = t.settingsLabels.location;
        if (document.getElementById('lbl-settings-soil')) document.getElementById('lbl-settings-soil').textContent = t.settingsLabels.soil;
        if (document.getElementById('lbl-settings-alerts-title')) document.getElementById('lbl-settings-alerts-title').textContent = t.settingsLabels.alertsTitle;
        if (document.getElementById('lbl-settings-alerts-desc')) document.getElementById('lbl-settings-alerts-desc').textContent = t.settingsLabels.alertsDesc;

        // Refresh dynamic components
        renderNotificationsList();

        // Update welcome message if it's the first one
        const firstMessage = chatHistory.querySelector('.message-formatted');
        if (firstMessage && chatHistory.children.length === 1) {
            firstMessage.innerHTML = `
                <h4>${t.welcomeTitle}</h4>
                <p>${t.welcomeText}</p>
                <ul>
                    ${t.welcomeList.map(item => `<li>${item}</li>`).join('')}
                </ul>
                <p>${t.welcomeFooter}</p>
            `;
        }

        // Sync settings language buttons active state
        updateSettingsLanguageActiveState(lang);
    }

    langEnBtn.addEventListener('click', () => {
        langEnBtn.classList.add('active');
        langTaBtn.classList.remove('active');
        updateUITranslation('en');
    });

    langTaBtn.addEventListener('click', () => {
        langTaBtn.classList.add('active');
        langEnBtn.classList.remove('active');
        updateUITranslation('ta');
    });

    // --- Navigation & View Handling ---
    const chatNav = document.getElementById('chat-nav');
    const weatherNav = document.getElementById('weather-nav');
    const settingsNav = document.getElementById('settings-nav');
    const chatView = document.getElementById('chat-view');
    const weatherView = document.getElementById('weather-view');
    const settingsView = document.getElementById('settings-view');

    // Initialize View
    chatView.classList.add('active');

    function switchView(viewId) {
        document.querySelectorAll('.content-view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(b => {
            b.classList.remove('active');
            b.classList.remove('text-primary');
        });

        if (viewId === 'chat') {
            chatView.classList.add('active');
            chatNav.classList.add('active');
        } else if (viewId === 'weather') {
            weatherView.classList.add('active');
            weatherNav.classList.add('active');
        } else if (viewId === 'settings') {
            settingsView.classList.add('active');
            settingsNav.classList.add('active');
        }
    }

    chatNav.addEventListener('click', () => switchView('chat'));
    weatherNav.addEventListener('click', () => switchView('weather'));
    if (settingsNav) settingsNav.addEventListener('click', () => switchView('settings'));

    // --- State Weather Hub Logic ---
    const weatherInputHub = document.getElementById('state-weather-input');
    const weatherBtnHub = document.getElementById('get-state-weather');
    const weatherReportCard = document.getElementById('weather-report-card');

    function sanitizeName(name) {
        if (!name) return "";
        // Remove diacritics (macrons, etc.)
        const sanitized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        // Dictionary for specific spelling corrections
        const corrections = {
            "Tirupparangunram": "Thiruparankundram",
            "Tiruppuvanam": "Thiruppuvanam",
            "Alanganallur": "Alanganallur",
            "Palamedu": "Palamedu",
            "Madurai": "Madurai",
            "Tiruchirappalli": "Trichy",
            "Thoothukudi": "Tuticorin",
            "Tirunelveli": "Nellai"
        };

        return corrections[sanitized] || sanitized;
    }

    const districtImages = {
        "Ariyalur": "https://images.unsplash.com/photo-1542332213-31f87348057f?auto=format&fit=crop&q=80&w=1200",
        "Chengalpattu": "https://images.unsplash.com/photo-1498466654-2035efbd5751?auto=format&fit=crop&q=80&w=1200",
        "Chennai": "https://images.unsplash.com/photo-1549466654-2035efbd5751?auto=format&fit=crop&q=80&w=1200",
        "Coimbatore": "https://images.unsplash.com/photo-1623910383949-6060c5a3260c?auto=format&fit=crop&q=80&w=1200",
        "Cuddalore": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=1200",
        "Dharmapuri": "https://images.unsplash.com/photo-161680193231-1582046427d1?auto=format&fit=crop&q=80&w=1200",
        "Dindigul": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&q=80&w=1200",
        "Erode": "https://images.unsplash.com/photo-1542332213-31f87348057f?auto=format&fit=crop&q=80&w=1200",
        "Kallakurichi": "https://images.unsplash.com/photo-1611680193231-1582046427d1?auto=format&fit=crop&q=80&w=1200",
        "Kanchipuram": "https://images.unsplash.com/photo-1635835948950-89196b297b10?auto=format&fit=crop&q=80&w=1200",
        "Kanyakumari": "https://images.unsplash.com/photo-1591523457597-d860f3815121?auto=format&fit=crop&q=80&w=1200",
        "Karur": "https://images.unsplash.com/photo-1542332213-31f87348057f?auto=format&fit=crop&q=80&w=1200",
        "Krishnagiri": "https://images.unsplash.com/photo-1623910383949-6060c5a3260c?auto=format&fit=crop&q=80&w=1200",
        "Madurai": "https://images.unsplash.com/photo-1620619767323-b95a89183081?auto=format&fit=crop&q=80&w=1200",
        "Mayiladuthurai": "https://images.unsplash.com/photo-1635835948950-89196b297b10?auto=format&fit=crop&q=80&w=1200",
        "Nagapattinam": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=1200",
        "Namakkal": "https://images.unsplash.com/photo-1542332213-31f87348057f?auto=format&fit=crop&q=80&w=1200",
        "Nilgiris": "https://images.unsplash.com/photo-1598463167123-097564d3fd42?auto=format&fit=crop&q=80&w=1200",
        "Perambalur": "https://images.unsplash.com/photo-1542332213-31f87348057f?auto=format&fit=crop&q=80&w=1200",
        "Pudukkottai": "https://images.unsplash.com/photo-1611680193231-1582046427d1?auto=format&fit=crop&q=80&w=1200",
        "Ramanathapuram": "https://images.unsplash.com/photo-1591523457597-d860f3815121?auto=format&fit=crop&q=80&w=1200",
        "Ranipet": "https://images.unsplash.com/photo-1596402184320-417d7178a2cd?auto=format&fit=crop&q=80&w=1200",
        "Salem": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=1200",
        "Sivaganga": "https://images.unsplash.com/photo-1620619767323-b95a89183081?auto=format&fit=crop&q=80&w=1200",
        "Tenkasi": "https://images.unsplash.com/photo-1611680193231-1582046427d1?auto=format&fit=crop&q=80&w=1200",
        "Thanjavur": "https://images.unsplash.com/photo-1635835948950-89196b297b10?auto=format&fit=crop&q=80&w=1200",
        "Theni": "https://images.unsplash.com/photo-1611680193231-1582046427d1?auto=format&fit=crop&q=80&w=1200",
        "Thoothukudi": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=1200",
        "Tiruchirappalli": "https://images.unsplash.com/photo-1600100397561-4328bc94474b?auto=format&fit=crop&q=80&w=1200",
        "Tirunelveli": "https://images.unsplash.com/photo-1611680193231-1582046427d1?auto=format&fit=crop&q=80&w=1200",
        "Tirupathur": "https://images.unsplash.com/photo-1596402184320-417d7178a2cd?auto=format&fit=crop&q=80&w=1200",
        "Tiruppur": "https://images.unsplash.com/photo-1623910383949-6060c5a3260c?auto=format&fit=crop&q=80&w=1200",
        "Tiruvallur": "https://images.unsplash.com/photo-1549466654-2035efbd5751?auto=format&fit=crop&q=80&w=1200",
        "Tiruvannamalai": "https://images.unsplash.com/photo-1620619767323-b95a89183081?auto=format&fit=crop&q=80&w=1200",
        "Tiruvarur": "https://images.unsplash.com/photo-1635835948950-89196b297b10?auto=format&fit=crop&q=80&w=1200",
        "Vellore": "https://images.unsplash.com/photo-1596402184320-417d7178a2cd?auto=format&fit=crop&q=80&w=1200",
        "Viluppuram": "https://images.unsplash.com/photo-1596402184320-417d7178a2cd?auto=format&fit=crop&q=80&w=1200",
        "Virudhunagar": "https://images.unsplash.com/photo-1611680193231-1582046427d1?auto=format&fit=crop&q=80&w=1200"
    };

    function getDistrictBg(city) {
        const defaultBg = "https://images.unsplash.com/photo-1542332213-31f87348057f?auto=format&fit=crop&q=80&w=1200";
        if (!city) return defaultBg;
        const keys = Object.keys(districtImages);
        const match = keys.find(k => city.toLowerCase().includes(k.toLowerCase()));
        return match ? districtImages[match] : defaultBg;
    }

    async function fetchDetailedWeather(city = null, lat = null, lon = null) {
        let queryStr = "";
        if (lat && lon) {
            queryStr = `lat=${lat}&lon=${lon}`;
            weatherReportCard.innerHTML = `<p class="placeholder-text">Locating agricultural areas...</p>`;
        } else if (city) {
            queryStr = `city=${city}`;
            weatherReportCard.innerHTML = `<p class="placeholder-text">Fetching data for ${city}...</p>`;
        } else return;

        try {
            const response = await fetch(`/api/weather?${queryStr}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            
            const bgImgUrl = getDistrictBg(data.city);
            const cityName = sanitizeName(data.city);

            weatherReportCard.innerHTML = `
                <section class="relative w-full rounded-xl overflow-hidden min-h-[400px] flex flex-col justify-end p-6 md:p-10 shadow-2xl animate-fade-in mt-12 bg-primary">
                    <div class="absolute inset-0 z-0">
                        <img alt="" class="w-full h-full object-cover opacity-60" src="${bgImgUrl}"/>
                        <div class="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent"></div>
                    </div>
                    
                    <div class="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-end">
                        <div class="space-y-4">
                            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold font-label uppercase tracking-tighter">
                                <span class="w-2 h-2 rounded-full bg-on-secondary-fixed animate-pulse"></span>
                                Live Updates: ${cityName}
                            </div>
                            <div class="flex items-baseline gap-4">
                                <span class="font-headline font-black text-6xl md:text-8xl text-white tracking-tighter">${data.temp}°</span>
                                <div class="flex flex-col">
                                    <span class="font-headline font-bold text-2xl md:text-3xl text-white">${data.condition}</span>
                                    <span class="text-white/70 font-body">Current Agriculture Conditions</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white/10 backdrop-blur-xl p-6 md:p-8 rounded-lg border-l-4 border-[#ffdbca]">
                            <div class="flex items-start justify-between mb-6">
                                <div>
                                    <h3 class="font-headline font-bold text-xl text-white">Optimal Growing Conditions</h3>
                                    <p class="text-white/70 text-sm font-body">Ideal data analysis for ${cityName}.</p>
                                </div>
                                <span class="material-symbols-outlined text-white text-4xl">psychology</span>
                            </div>
                            <div class="grid grid-cols-3 gap-2">
                                <div class="space-y-1">
                                    <p class="text-[10px] font-label font-bold text-white/60 uppercase">Humidity</p>
                                    <p class="text-xl font-headline font-bold text-white">${data.humidity}%</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-[10px] font-label font-bold text-white/60 uppercase">Wind</p>
                                    <p class="text-xl font-headline font-bold text-white">${data.wind} km/h</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-[10px] font-label font-bold text-white/60 uppercase">Index</p>
                                    <p class="text-xl font-headline font-bold text-white text-[#ffdbca]">Optimal</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div style="margin-top: 3rem;">
                        <h4 style="margin-bottom: 1.5rem; color: #3b6e4c; font-weight: 800; font-family: Manrope;">Nearby Agricultural Areas</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem;">
                            ${data.nearby && data.nearby.length > 0 ? data.nearby.map(n => `
                                <div style="background: rgba(0,0,0,0.03); padding: 1rem; border-radius: 12px; border: 1px solid rgba(0,0,0,0.05); text-align: center;">
                                    <span style="display:block; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; color: #3b6e4c;">${sanitizeName(n.name)}</span>
                                    <span style="color: #557a5e; font-size: 1.1rem; font-weight: 600">${n.temp}°C</span>
                                    <p style="font-size: 0.7rem; color: #414844; margin-top: 0.3rem">${n.condition}</p>
                                </div>
                            `).join('') : '<p style="color: #414844; font-size: 0.9rem;">No nearby sub-stations found.</p>'}
                        </div>
                </div>

                <div style="margin-top: 3rem;">
                        <h4 style="margin-bottom: 1.5rem; color: #3b6e4c; font-weight: 800; font-family: Manrope;">Hourly Forecast (Next 24h)</h4>
                        <div style="display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 1rem;" class="custom-scroll">
                            ${data.forecast.map(f => `
                                <div style="background: rgba(0,0,0,0.03); padding: 1.2rem; border-radius: 16px; min-width: 110px; text-align: center; border: 1px solid rgba(0,0,0,0.05)">
                                    <span style="display:block; font-size: 0.8rem; color: #414844; margin-bottom: 0.5rem">${f.time}</span>
                                    <span class="material-symbols-outlined text-[#557a5e] mb-2 text-2xl">cloud</span>
                                    <span style="display:block; font-weight: 600; color: #3b6e4c;">${f.temp}°C</span>
                                </div>
                            `).join('')}
                        </div>
                </div>
            `;
        } catch (err) {
            weatherReportCard.innerHTML = `<p class="placeholder-text" style="color: #e74c3c">Error: Could not find data. Ensure location is enabled.</p>`;
        }
    }

    async function updateWeatherWidget(city = null, lat = null, lon = null) {
        let queryStr = "";
        if (lat && lon) queryStr = `lat=${lat}&lon=${lon}`;
        else if (city) queryStr = `city=${city}`;
        else queryStr = "city=Chennai"; // Default

        try {
            const response = await fetch(`/api/weather?${queryStr}`);
            const data = await response.json();
            
            if (data.error) return;

            document.getElementById('weather-temp').textContent = `${data.temp}°C`;
            document.getElementById('weather-condition').textContent = data.condition;
            document.getElementById('weather-city').textContent = data.city;
            
            const icons = {
                'Clear': 'fa-sun', 'Clouds': 'fa-cloud', 'Rain': 'fa-cloud-showers-heavy',
                'Drizzle': 'fa-cloud-rain', 'Thunderstorm': 'fa-bolt', 'Snow': 'fa-snowflake'
            };
            document.getElementById('weather-icon').className = `fa-solid ${icons[data.condition] || 'fa-cloud'}`;
            document.getElementById('weather-widget').style.display = 'flex';
        } catch (e) { console.log("Weather failed"); }
    }

    function initGeoLocation(target = 'widget') {
        const errorMsg = "Locating...";
        if (target === 'widget') document.getElementById('weather-city').textContent = errorMsg;
        else weatherReportCard.innerHTML = `<p class="placeholder-text">${errorMsg}</p>`;

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(position => {
                const { latitude, longitude } = position.coords;
                if (target === 'widget') updateWeatherWidget(null, latitude, longitude);
                else fetchDetailedWeather(null, latitude, longitude);
            }, error => {
                console.log("Geo error:", error.code, error.message);
                // The improvement: If we are in debug/local and geoloc fails, try to use a more sensible default or prompt.
                // For now, let's use 'Madurai' as the preferred default for the user since they mentioned it.
                if (target === 'widget') updateWeatherWidget('Madurai');
                else fetchDetailedWeather('Madurai');
                
                if (error.code === 1) {
                    console.log("User denied location access.");
                }
            }, { timeout: 10000 });
        } else {
            if (target === 'widget') updateWeatherWidget('Madurai');
            else fetchDetailedWeather('Madurai');
        }
    }

    weatherNav.addEventListener('click', () => {
        switchView('weather');
        initGeoLocation('hub');
    });

    const detectBtn = document.getElementById('detect-location-btn');
    if (detectBtn) {
        detectBtn.addEventListener('click', () => initGeoLocation('hub'));
    }

    if (weatherBtnHub) {
        weatherBtnHub.addEventListener('click', () => {
            const city = weatherInputHub.value.trim();
            if (city) fetchDetailedWeather(city);
        });
    }

    if (weatherInputHub) {
        weatherInputHub.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const city = weatherInputHub.value.trim();
                if (city) fetchDetailedWeather(city);
            }
        });
    }


    // --- Image Handling ---
    attachBtn.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            currentImageFile = file;

            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreviewContainer.style.display = 'flex';
            };
            reader.readAsDataURL(file);
        }
    });

    removeImageBtn.addEventListener('click', () => {
        currentImageFile = null;
        imageInput.value = ''; // Reset input
        imagePreview.src = '';
        imagePreviewContainer.style.display = 'none';
    });

    // --- Chat Logic ---

    function scrollToBottom() {
        setTimeout(() => {
            chatHistory.scrollTo({
                top: chatHistory.scrollHeight,
                behavior: 'smooth'
            });
        }, 50);
    }

    function appendMessage(content, isUser = false, imageUrl = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `flex items-start gap-4 ${isUser ? 'self-end flex-row-reverse' : 'self-start'} max-w-[85%] mb-6`;

        // Avatar
        let avatarHtml = isUser 
            ? `<div class="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0"><img src="/static/avatar.png" class="w-full h-full object-cover" alt="User Avatar"></div>`
            : `<div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0"><span class="material-symbols-outlined text-white text-xl">smart_toy</span></div>`;

        // Container
        let innerContentDiv = document.createElement('div');
        innerContentDiv.className = `space-y-3 ${isUser ? 'flex flex-col items-end' : ''}`;
        
        // Bubble
        let bubbleDiv = document.createElement('div');
        if (isUser) {
            bubbleDiv.className = "bg-surface-container-high p-5 rounded-tr-none rounded-tl-lg rounded-br-lg rounded-bl-lg text-on-surface";
        } else {
            bubbleDiv.className = "bg-secondary-container p-6 rounded-tl-none rounded-tr-lg rounded-br-lg rounded-bl-lg shadow-sm text-on-secondary-container message-formatted";
        }

        let imageHtml = '';
        if (imageUrl) {
            imageHtml = `<img src="${imageUrl}" class="w-full max-w-sm rounded-lg mb-3 border border-outline-variant" alt="Uploaded Image">`;
        }

        bubbleDiv.innerHTML = imageHtml + content;
        innerContentDiv.appendChild(bubbleDiv);

        msgDiv.innerHTML = avatarHtml;
        msgDiv.appendChild(innerContentDiv);
        chatHistory.appendChild(msgDiv);
        
        scrollToBottom();
    }

    function showTypingIndicator() {
        const id = 'typing-indicator';
        const msgDiv = document.createElement('div');
        msgDiv.className = 'flex items-start gap-4 self-start max-w-[85%] mb-6';
        msgDiv.id = id;

        msgDiv.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-white text-xl">smart_toy</span>
            </div>
            <div class="space-y-3">
                <div class="bg-secondary-container p-4 rounded-tl-none rounded-tr-lg rounded-br-lg rounded-bl-lg shadow-sm flex gap-1.5 items-center">
                    <span class="dot w-2 h-2 bg-primary rounded-full opacity-60" style="animation: blink 1.4s infinite .2s;"></span>
                    <span class="dot w-2 h-2 bg-primary rounded-full opacity-60" style="animation: blink 1.4s infinite .4s;"></span>
                    <span class="dot w-2 h-2 bg-primary rounded-full opacity-60" style="animation: blink 1.4s infinite .6s;"></span>
                </div>
            </div>
            <style>
                @keyframes blink { 0% { opacity: .2; } 20% { opacity: 1; } 100% { opacity: .2; } }
            </style>
        `;
        chatHistory.appendChild(msgDiv);
        scrollToBottom();
        return id;
    }

    function removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }


    let consultationCount = 12;

    function updateAIOptimizationTip() {
        const name = (settingsFarmerName && settingsFarmerName.value.trim()) || "Farmer";
        const location = (settingsFarmerLocation && settingsFarmerLocation.value.trim()) || "your region";
        const soil = (settingsSoilType && settingsSoilType.value) || "Alluvial Soil";
        
        const firstName = name.split(' ')[0];
        
        let tip = "";
        if (soil === "Alluvial Soil") {
            tip = `"${firstName}, based on your location in <b>${location}</b> and your <b>Alluvial Soil</b> preference, we've updated your dashboard to prioritize wheat irrigation cycles and potash-rich fertilizer schedules."`;
        } else if (soil === "Red Soil") {
            tip = `"${firstName}, based on your location in <b>${location}</b> and your <b>Red Soil</b> preference, we've updated your dashboard to prioritize groundnut water drainage and nitrogen-rich organic compost schedules."`;
        } else if (soil === "Black Soil") {
            tip = `"${firstName}, based on your location in <b>${location}</b> and your <b>Black Soil</b> preference, we've updated your dashboard to prioritize cotton moisture retention and phosphorus-rich soil treatments."`;
        } else {
            tip = `"${firstName}, based on your location in <b>${location}</b> and your agricultural profile, we've optimized your recommendations for localized weather anomalies and crop health warnings."`;
        }
        
        const tipContainer = document.getElementById('ai-optimization-tip-text');
        if (tipContainer) {
            tipContainer.innerHTML = tip;
        }
    }

    function updateProfileCardData() {
        if (!profileCardName) return;
        const name = (settingsFarmerName && settingsFarmerName.value.trim()) || "Farmer User";
        const location = (settingsFarmerLocation && settingsFarmerLocation.value.trim()) || "Madurai, Tamil Nadu";
        const soil = (settingsSoilType && settingsSoilType.value) || "Alluvial Soil";
        
        const roleEl = document.getElementById('settings-farmer-role');
        const role = (roleEl && roleEl.value) || "Farmer";

        profileCardName.textContent = name;
        profileCardLocation.textContent = location;
        profileCardSoil.textContent = soil;
        profileCardQueries.textContent = consultationCount;

        if (sidebarFarmerName) sidebarFarmerName.textContent = name;
        if (sidebarFarmerRole) sidebarFarmerRole.textContent = role;
        if (profileCardRole) profileCardRole.textContent = role;

        updateAIOptimizationTip();
    }

    async function sendMessage() {
        const query = input.value.trim();

        // Don't send if empty AND no image
        if (!query && !currentImageFile) return;

        // Capture state before clearing
        const fileToSend = currentImageFile;
        const queryToSend = query;
        const langToSend = currentLanguage;
        let userImageDisplayUrl = null;
        if (fileToSend) {
            userImageDisplayUrl = imagePreview.src;
        }

        // Increment consultations on send
        consultationCount++;
        updateProfileCardData();

        // Add User Message to Chat UI
        appendMessage(queryToSend || (langToSend === 'ta' ? 'படம் பகிரப்பட்டது' : 'Image shared'), true, userImageDisplayUrl);

        // Clear UI inputs immediately for responsiveness
        input.value = '';
        if (currentImageFile) {
            currentImageFile = null;
            imageInput.value = '';
            imagePreview.src = '';
            imagePreviewContainer.style.display = 'none';
        }

        // Show loading
        const loadingId = showTypingIndicator();

        // Direct image upload to Supabase Storage if active
        let supabaseImageUrl = null;
        if (fileToSend && supabaseClient && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
            try {
                const fileExt = fileToSend.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
                const { data, error } = await supabaseClient.storage
                    .from('plant_images')
                    .upload(fileName, fileToSend);
                
                if (!error) {
                    const { data: { publicUrl } } = supabaseClient.storage
                        .from('plant_images')
                        .getPublicUrl(fileName);
                    supabaseImageUrl = publicUrl;
                }
            } catch (err) {
                console.error("Storage upload error:", err);
            }
        }

        // Write User Message to Supabase
        if (supabaseClient && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
            supabaseClient.auth.getSession().then(({ data: { session } }) => {
                const sessionUser = session?.user;
                if (sessionUser) {
                    supabaseClient.from('chats').insert({
                        user_id: sessionUser.id,
                        message: queryToSend || 'Image shared',
                        is_user: true,
                        image_url: supabaseImageUrl || userImageDisplayUrl
                    }).then(({ error }) => {
                        if (error) console.error("Error saving user chat message:", error);
                    });
                }
            });
        }

        try {
            // Use FormData for file upload
            const formData = new FormData();
            formData.append('query', queryToSend);
            formData.append('lang', langToSend);
            if (fileToSend) {
                formData.append('image', fileToSend);
            }

            const response = await fetch('/api/chat', {
                method: 'POST',
                body: formData 
            });

            const data = await response.json();

            // Remove loading
            removeTypingIndicator(loadingId);

            if (data.error) {
                appendMessage(`<strong>Error:</strong> ${data.error}`);
            } else {
                appendMessage(data.response);
                if (data.weather) {
                    // Update widget if response included fresh weather
                    updateWeatherWidget(data.weather.city);
                }

                // Write AI Response to Supabase
                if (supabaseClient && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
                    supabaseClient.auth.getSession().then(({ data: { session } }) => {
                        const sessionUser = session?.user;
                        if (sessionUser) {
                            supabaseClient.from('chats').insert({
                                user_id: sessionUser.id,
                                message: data.response,
                                is_user: false
                            }).then(({ error }) => {
                                if (error) console.error("Error saving AI response:", error);
                            });
                        }
                    });
                }
            }

        } catch (error) {
            removeTypingIndicator(loadingId);
            appendMessage(`<strong>Connection Error:</strong> Could not reach the server.`);
            console.error(error);
        }
    }

    sendBtn.addEventListener('click', sendMessage);

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // --- Weather Widget Click Redirect ---
    if (weatherWidget) {
        weatherWidget.addEventListener('click', () => {
            switchView('weather');
            initGeoLocation('hub');
        });
    }

    // --- Dropdowns Toggling & Outside Clicks ---
    function closeAllDropdowns() {
        if (notificationDropdown) notificationDropdown.classList.add('hidden');
        if (profileDropdown) profileDropdown.classList.add('hidden');
    }

    if (notificationBtn && notificationDropdown) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = notificationDropdown.classList.contains('hidden');
            closeAllDropdowns();
            if (isHidden) {
                notificationDropdown.classList.remove('hidden');
            }
        });
    }

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = profileDropdown.classList.contains('hidden');
            closeAllDropdowns();
            if (isHidden) {
                profileDropdown.classList.remove('hidden');
            }
        });
    }

    // Close on clicking outside
    window.addEventListener('click', (e) => {
        if (notificationDropdown && notificationBtn && 
            !notificationDropdown.contains(e.target) && !notificationBtn.contains(e.target)) {
            notificationDropdown.classList.add('hidden');
        }
        if (profileDropdown && profileBtn && 
            !profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
            profileDropdown.classList.add('hidden');
        }
    });

    // Mark all as read / Clear notifications
    if (clearNotificationsBtn) {
        clearNotificationsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifications = [];
            renderNotificationsList();
        });
    }

    function updateSettingsLanguageActiveState(lang) {
        const btnEn = document.getElementById('settings-lang-en');
        const btnTa = document.getElementById('settings-lang-ta');
        const btnHi = document.getElementById('settings-lang-hi');
        
        if (!btnEn) return;

        [btnEn, btnTa, btnHi].forEach(btn => {
            if (btn) {
                btn.classList.remove('bg-primary', 'text-on-primary');
                btn.classList.add('bg-surface-container-high', 'text-on-surface-variant');
            }
        });

        if (lang === 'en' && btnEn) {
            btnEn.classList.add('bg-primary', 'text-on-primary');
            btnEn.classList.remove('bg-surface-container-high', 'text-on-surface-variant');
        } else if (lang === 'ta' && btnTa) {
            btnTa.classList.add('bg-primary', 'text-on-primary');
            btnTa.classList.remove('bg-surface-container-high', 'text-on-surface-variant');
        } else if (lang === 'hi' && btnHi) {
            btnHi.classList.add('bg-primary', 'text-on-primary');
            btnHi.classList.remove('bg-surface-container-high', 'text-on-surface-variant');
        }
    }

    // Settings elements real-time update
    const settingsFarmerRole = document.getElementById('settings-farmer-role');
    if (settingsFarmerName) settingsFarmerName.addEventListener('input', updateProfileCardData);
    if (settingsFarmerLocation) settingsFarmerLocation.addEventListener('input', updateProfileCardData);
    if (settingsSoilType) settingsSoilType.addEventListener('change', updateProfileCardData);
    if (settingsFarmerRole) settingsFarmerRole.addEventListener('change', updateProfileCardData);

    // Settings language selectors
    const settingsLangEn = document.getElementById('settings-lang-en');
    const settingsLangTa = document.getElementById('settings-lang-ta');
    const settingsLangHi = document.getElementById('settings-lang-hi');

    if (settingsLangEn) {
        settingsLangEn.addEventListener('click', () => {
            if (langEnBtn) langEnBtn.click();
        });
    }
    if (settingsLangTa) {
        settingsLangTa.addEventListener('click', () => {
            if (langTaBtn) langTaBtn.click();
        });
    }
    if (settingsLangHi) {
        settingsLangHi.addEventListener('click', () => {
            alert("Hindi language support is coming soon!");
        });
    }

    // Profile quick settings button
    if (profileSettingsBtn) {
        profileSettingsBtn.addEventListener('click', () => {
            switchView('settings');
            closeAllDropdowns();
        });
    }

    // Cancel Button logic
    const cancelChangesBtn = document.getElementById('settings-cancel-btn');
    if (cancelChangesBtn) {
        cancelChangesBtn.addEventListener('click', () => {
            switchView('chat');
        });
    }

    // Save Changes button logic
    const saveChangesBtn = document.getElementById('settings-save-btn');
    if (saveChangesBtn) {
        saveChangesBtn.addEventListener('click', () => {
            updateProfileCardData();
            
            // Push dynamic "saved" notification
            const newNotif = {
                id: Date.now(),
                type: 'price', // generic/green style
                key: 'saved',
                time: 'Just now',
                read: false
            };
            
            notifications.unshift(newNotif);
            renderNotificationsList();

            // Success feedback animation
            const originalHtml = saveChangesBtn.innerHTML;
            saveChangesBtn.innerHTML = `<span class="material-symbols-outlined text-base">check</span> Saved!`;
            saveChangesBtn.classList.remove('bg-primary');
            saveChangesBtn.classList.add('bg-secondary');
            
            setTimeout(() => {
                saveChangesBtn.innerHTML = originalHtml;
                saveChangesBtn.classList.remove('bg-secondary');
                saveChangesBtn.classList.add('bg-primary');
                // Auto switch back to chat view on save for a premium UX
                setTimeout(() => {
                    switchView('chat');
                }, 300);
            }, 1500);

            // Update Supabase profiles table
            if (supabaseClient && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
                supabaseClient.auth.getSession().then(({ data: { session } }) => {
                    const sessionUser = session?.user;
                    if (sessionUser) {
                        const name = (settingsFarmerName && settingsFarmerName.value.trim()) || "Farmer User";
                        const location = (settingsFarmerLocation && settingsFarmerLocation.value.trim()) || "Madurai, Tamil Nadu";
                        const soil = (settingsSoilType && settingsSoilType.value) || "Alluvial Soil";
                        const roleEl = document.getElementById('settings-farmer-role');
                        const role = (roleEl && roleEl.value) || "Farmer";
                        const alertsCheck = document.getElementById('settings-weather-alerts');
                        const alerts = alertsCheck ? alertsCheck.checked : true;
                        
                        supabaseClient
                            .from('profiles')
                            .upsert({
                                id: sessionUser.id,
                                full_name: name,
                                location: location,
                                soil_type: soil,
                                role: role,
                                weather_alerts: alerts,
                                updated_at: new Date()
                            }).then(({ error }) => {
                                if (error) console.error("Error saving profile details to database:", error);
                            });
                    }
                });
            }
        });
    }

    // --- Authentication & Session Logic ---
    let isSignUpMode = false;

    const authOverlay = document.getElementById('auth-overlay');
    const authForm = document.getElementById('auth-form');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const authName = document.getElementById('auth-name');
    const authNameGroup = document.getElementById('auth-name-group');
    const authError = document.getElementById('auth-error');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const authBtnText = document.getElementById('auth-btn-text');
    const authToggleBtn = document.getElementById('auth-toggle-btn');
    const authToggleText = document.getElementById('auth-toggle-text');
    const profileLogoutBtn = document.getElementById('profile-logout-btn');

    if (authToggleBtn) {
        authToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            isSignUpMode = !isSignUpMode;
            if (isSignUpMode) {
                authNameGroup.classList.remove('hidden');
                authName.required = true;
                authBtnText.textContent = 'Create Account';
                authSubmitBtn.querySelector('.material-symbols-outlined').textContent = 'person_add';
                authToggleText.textContent = 'Already have an account?';
                authToggleBtn.textContent = 'Sign In';
            } else {
                authNameGroup.classList.add('hidden');
                authName.required = false;
                authName.value = '';
                authBtnText.textContent = 'Sign In';
                authSubmitBtn.querySelector('.material-symbols-outlined').textContent = 'login';
                authToggleText.textContent = "Don't have an account?";
                authToggleBtn.textContent = 'Create Account';
            }
            authError.classList.add('hidden');
        });
    }

    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            authError.classList.add('hidden');
            
            const email = authEmail.value.trim();
            const password = authPassword.value;
            const fullName = authName.value.trim();
            
            if (!supabaseClient || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
                showAuthError("Supabase connection is not configured. Please set your Anon Key.");
                return;
            }
            
            authSubmitBtn.disabled = true;
            const iconEl = authSubmitBtn.querySelector('.material-symbols-outlined');
            if (iconEl) {
                iconEl.textContent = 'sync';
                iconEl.classList.add('animate-spin');
            }
            if (authBtnText) {
                authBtnText.textContent = 'Loading...';
            }
            
            try {
                if (isSignUpMode) {
                    const { data, error } = await supabaseClient.auth.signUp({
                        email: email,
                        password: password,
                        options: {
                            data: {
                                full_name: fullName || 'Farmer User',
                                role: 'Farmer',
                                location: 'Madurai, Tamil Nadu',
                                soil_type: 'Alluvial Soil',
                                weather_alerts: true
                            }
                        }
                    });
                    
                    if (error) throw error;
                    
                    const user = data.user;
                    const session = data.session;
                    if (user) {
                        if (session) {
                            // If auto-confirm is enabled, session is active. Log in immediately!
                            await handleLoginSuccess(user);
                        } else {
                            // If email confirmation is required, session is null.
                            alert("Account created successfully! A confirmation link has been sent to your email. Please check your inbox (and spam folder) and verify your email before logging in.");
                            authToggleBtn.click();
                        }
                    }
                } else {
                    const { data, error } = await supabaseClient.auth.signInWithPassword({
                        email: email,
                        password: password
                    });
                    
                    if (error) throw error;
                    
                    const session = data.session;
                    if (session) {
                        await handleLoginSuccess(session.user);
                    }
                }
            } catch (err) {
                console.error("Auth error:", err);
                showAuthError(err.message || "An authentication error occurred.");
            } finally {
                authSubmitBtn.disabled = false;
                const finalIconEl = authSubmitBtn.querySelector('.material-symbols-outlined');
                if (finalIconEl) {
                    finalIconEl.classList.remove('animate-spin');
                    finalIconEl.textContent = isSignUpMode ? 'person_add' : 'login';
                }
                if (authBtnText) {
                    authBtnText.textContent = isSignUpMode ? 'Create Account' : 'Sign In';
                }
            }
        });
    }

    function showAuthError(msg) {
        if (authError) {
            authError.textContent = msg;
            authError.classList.remove('hidden');
        }
    }

    async function handleLoginSuccess(user) {
        if (!user) return;
        
        try {
            const { data: profile, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
                
            if (error && error.code !== 'PGRST116') {
                throw error;
            }
            
            let finalProfile = profile;
            if (!finalProfile) {
                // Fallback: If profile row doesn't exist, create one now that the user is authenticated.
                const meta = user.user_metadata || {};
                const defaultProfile = {
                    id: user.id,
                    full_name: meta.full_name || 'Farmer User',
                    role: meta.role || 'Farmer',
                    location: meta.location || 'Madurai, Tamil Nadu',
                    soil_type: meta.soil_type || 'Alluvial Soil',
                    weather_alerts: meta.weather_alerts !== undefined ? meta.weather_alerts : true
                };
                
                const { data: newProfile, error: insertError } = await supabaseClient
                    .from('profiles')
                    .insert([defaultProfile])
                    .select()
                    .single();
                
                if (insertError) {
                    console.error("Error creating default profile row:", insertError);
                } else {
                    finalProfile = newProfile;
                }
            }
            
            const displayProfile = finalProfile || {
                full_name: user.user_metadata?.full_name || 'Farmer User',
                role: user.user_metadata?.role || 'Farmer',
                location: user.user_metadata?.location || 'Madurai, Tamil Nadu',
                soil_type: user.user_metadata?.soil_type || 'Alluvial Soil',
                weather_alerts: user.user_metadata?.weather_alerts !== undefined ? user.user_metadata.weather_alerts : true
            };
            
            if (settingsFarmerName) settingsFarmerName.value = displayProfile.full_name;
            if (settingsFarmerLocation) settingsFarmerLocation.value = displayProfile.location;
            if (settingsSoilType) settingsSoilType.value = displayProfile.soil_type;
            
            const roleEl = document.getElementById('settings-farmer-role');
            if (roleEl) roleEl.value = displayProfile.role;
            
            const alertsCheck = document.getElementById('settings-weather-alerts');
            if (alertsCheck) alertsCheck.checked = displayProfile.weather_alerts;
            
            updateProfileCardData();
        } catch (e) {
            console.error("Error fetching or initializing user profile:", e);
        }
        
        await loadChatLogs(user.id);
        
        if (authOverlay) {
            authOverlay.classList.add('hidden');
        }
    }

    async function loadChatLogs(userId) {
        if (!supabaseClient) return;
        
        try {
            const { data: logs, error } = await supabaseClient
                .from('chats')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: true });
                
            if (error) throw error;
            
            if (chatHistory) {
                chatHistory.innerHTML = '';
            }
            
            if (logs && logs.length > 0) {
                logs.forEach(log => {
                    appendMessage(log.message, log.is_user, log.image_url);
                });
            } else {
                renderWelcomeMessage();
            }
        } catch (e) {
            console.error("Error loading chat logs:", e);
        }
    }

    function renderWelcomeMessage() {
        const t = translations[currentLanguage];
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'flex items-start gap-4 self-start max-w-[85%] mb-6';
        welcomeDiv.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-white text-xl">smart_toy</span>
            </div>
            <div class="space-y-3">
                <div class="bg-secondary-container p-6 rounded-tl-none rounded-tr-lg rounded-br-lg rounded-bl-lg shadow-sm text-on-secondary-container message-formatted">
                    <h4>${t.welcomeTitle}</h4>
                    <p>${t.welcomeText}</p>
                    <ul>
                        ${t.welcomeList.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                    <p>${t.welcomeFooter}</p>
                </div>
            </div>
        `;
        if (chatHistory) chatHistory.appendChild(welcomeDiv);
    }

    if (profileLogoutBtn) {
        profileLogoutBtn.addEventListener('click', async () => {
            if (supabaseClient) {
                await supabaseClient.auth.signOut();
            }
            if (settingsFarmerName) settingsFarmerName.value = 'Farmer User';
            if (settingsFarmerLocation) settingsFarmerLocation.value = 'Madurai, Tamil Nadu';
            if (settingsSoilType) settingsSoilType.value = 'Alluvial Soil';
            const roleEl = document.getElementById('settings-farmer-role');
            if (roleEl) roleEl.value = 'Farmer';
            
            updateProfileCardData();
            
            if (chatHistory) chatHistory.innerHTML = '';
            
            if (authOverlay) {
                authOverlay.classList.remove('hidden');
            }
            
            closeAllDropdowns();
        });
    }

    // Initial setups
    // Update profile display on load
    updateProfileCardData();
    updateUITranslation(currentLanguage);
    initGeoLocation(); // Start live location detection immediately

    // Session checking on load
    if (supabaseClient && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                handleLoginSuccess(session.user);
            } else {
                if (authOverlay) authOverlay.classList.remove('hidden');
                renderWelcomeMessage();
            }
        });
    } else {
        if (authOverlay) authOverlay.classList.add('hidden');
        renderWelcomeMessage();
    }

    // Focus input on load
    if (input) input.focus();

    // --- Responsive Sidebar Toggling ---
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    const sidebar = document.querySelector('aside');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');

    function openSidebar() {
        if (sidebar) {
            sidebar.classList.remove('-translate-x-full');
            sidebar.classList.add('translate-x-0');
        }
        if (sidebarBackdrop) {
            sidebarBackdrop.classList.remove('hidden');
            // Force reflow
            sidebarBackdrop.offsetHeight;
            sidebarBackdrop.classList.add('opacity-100');
        }
    }

    function closeSidebar() {
        if (sidebar) {
            sidebar.classList.remove('translate-x-0');
            sidebar.classList.add('-translate-x-full');
        }
        if (sidebarBackdrop) {
            sidebarBackdrop.classList.remove('opacity-100');
            sidebarBackdrop.classList.add('opacity-0');
            // Wait for transition to complete before hiding
            setTimeout(() => {
                if (sidebarBackdrop.classList.contains('opacity-0')) {
                    sidebarBackdrop.classList.add('hidden');
                }
            }, 300);
        }
    }

    if (menuToggleBtn) {
        menuToggleBtn.addEventListener('click', openSidebar);
    }
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', closeSidebar);
    }
    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', closeSidebar);
    }

    // Also close sidebar on navigation item clicks (on mobile devices)
    document.querySelectorAll('aside nav button').forEach(btn => {
        btn.addEventListener('click', () => {
            if (window.innerWidth < 1024) { // lg breakpoint is 1024px
                closeSidebar();
            }
        });
    });
});
