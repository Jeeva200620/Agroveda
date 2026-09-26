"""
SEIR / Cellular Automata Disease Dispersion Engine
Models spatio-temporal disease spread across a crop grid incorporating
wind vector (velocity + degree angle), relative humidity, and pathogen kinetics.
"""

import math

# Pathogen profiles calibrated against PlantVillage dataset classes
PATHOGEN_PROFILES = {
    # High virulence, airborne fungal sporangia, accelerated by high humidity
    "Potato___Late_blight": {
        "virulence": 2.5,
        "wind_susceptibility": 1.6,
        "humidity_opt": 85,
        "temp_opt": 19,
        "tamil": "உருளைக்கிழங்கு தாமத கருகல் நோய்"
    },
    "Tomato_Late_blight": {
        "virulence": 2.4,
        "wind_susceptibility": 1.5,
        "humidity_opt": 85,
        "temp_opt": 19,
        "tamil": "தக்காளி தாமத கருகல் நோய்"
    },
    # Moderate virulence, alternating wet/dry
    "Potato___Early_blight": {
        "virulence": 1.4,
        "wind_susceptibility": 1.1,
        "humidity_opt": 75,
        "temp_opt": 25,
        "tamil": "உருளைக்கிழங்கு ஆரம்ப கருகல் நோய்"
    },
    "Tomato_Early_blight": {
        "virulence": 1.3,
        "wind_susceptibility": 1.0,
        "humidity_opt": 75,
        "temp_opt": 25,
        "tamil": "தக்காளி ஆரம்ப கருகல் நோய்"
    },
    # Fungal mold, high greenhouse humidity
    "Tomato_Leaf_Mold": {
        "virulence": 1.1,
        "wind_susceptibility": 0.8,
        "humidity_opt": 85,
        "temp_opt": 23,
        "tamil": "தக்காளி இலை அச்சு நோய்"
    },
    # Rain-splash & wind bacteria
    "Tomato_Bacterial_spot": {
        "virulence": 1.5,
        "wind_susceptibility": 1.2,
        "humidity_opt": 80,
        "temp_opt": 28,
        "tamil": "தக்காளி பாக்டீரியா புள்ளி நோய்"
    },
    "Pepper__bell___Bacterial_spot": {
        "virulence": 1.4,
        "wind_susceptibility": 1.1,
        "humidity_opt": 80,
        "temp_opt": 28,
        "tamil": "குடைமிளகாய் பாக்டீரியா புள்ளி நோய்"
    },
    # Mites: thrive in dry/warm conditions
    "Tomato_Spider_mites_Two_spotted_spider_mite": {
        "virulence": 0.7,
        "wind_susceptibility": 0.6,
        "humidity_opt": 45,
        "temp_opt": 31,
        "tamil": "தக்காளி சிவப்பு சிலந்தி பேன்"
    },
    # Septoria leaf spot
    "Tomato_Septoria_leaf_spot": {
        "virulence": 1.2,
        "wind_susceptibility": 0.9,
        "humidity_opt": 80,
        "temp_opt": 22,
        "tamil": "தக்காளி செப்டோரியா இலைப்புள்ளி"
    }
}

DEFAULT_PROFILE = {
    "virulence": 1.0,
    "wind_susceptibility": 1.0,
    "humidity_opt": 70,
    "temp_opt": 24,
    "tamil": "பயிர் நோய் தொற்று"
}

def calculate_infection_timeline(
    disease_name: str,
    wind_deg: float = 90.0,
    wind_speed: float = 10.0,
    humidity: float = 70.0,
    temp: float = 26.0,
    grid_rows: int = 10,
    grid_cols: int = 10,
    start_row: int = 5,
    start_col: int = 5,
    max_days: int = 30
) -> dict:
    """
    Computes day-by-day infection progression across a discrete grid.
    Returns:
        {
            "disease_name": str,
            "tamil_label": str,
            "timeline": {"plant_r_c": day_infected, ...},
            "stats": {"total_plants": 100, "infected_30d": N, ...}
        }
    """
    profile = PATHOGEN_PROFILES.get(disease_name, DEFAULT_PROFILE)
    virulence = profile["virulence"]
    wind_susc = profile["wind_susceptibility"]

    # Humidity modifier: fungal spores proliferate under target humidity
    hum_delta = abs(humidity - profile["humidity_opt"])
    hum_factor = max(0.5, 1.3 - (hum_delta / 80.0))

    # Temperature modifier
    temp_delta = abs(temp - profile["temp_opt"])
    temp_factor = max(0.6, 1.2 - (temp_delta / 25.0))

    effective_speed = virulence * hum_factor * temp_factor

    # Wind directional vector components
    # 0 deg = North (spreads toward +row), 90 deg = East (+col), 180 = South (-row), 270 = West (-col)
    wind_rad = math.radians(wind_deg)
    wind_vec_x = math.sin(wind_rad) * (wind_speed / 15.0) * wind_susc # col axis
    wind_vec_y = math.cos(wind_rad) * (wind_speed / 15.0) * wind_susc # row axis

    timeline = {}
    infected_count = 0

    for r in range(grid_rows):
        for c in range(grid_cols):
            # Distance from epicentre adjusted by wind drift
            dr = (r - start_row) - wind_vec_y
            dc = (c - start_col) - wind_vec_x
            effective_dist = math.sqrt(dr**2 + dc**2)

            day = int(effective_dist / max(0.2, effective_speed)) + 1
            if day <= max_days:
                timeline[f"plant_{r}_{c}"] = day
                infected_count += 1

    return {
        "disease_name": disease_name,
        "tamil_label": profile.get("tamil", "பயிர் நோய்"),
        "timeline": timeline,
        "stats": {
            "total_plants": grid_rows * grid_cols,
            "infected_30d": infected_count,
            "infection_percentage": round((infected_count / (grid_rows * grid_cols)) * 100, 1),
            "effective_spread_rate": round(effective_speed, 2),
            "wind_bias": {"x": round(wind_vec_x, 2), "y": round(wind_vec_y, 2)}
        }
    }
