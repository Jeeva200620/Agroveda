import os
import requests
from dotenv import load_dotenv

load_dotenv()

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

def get_weather_data(city=None, lat=None, lon=None):
    """
    Fetches real-time weather, forecast, and nearby locations.
    """
    if not WEATHER_API_KEY:
        return None

    try:
        # Determine the query parameter
        if lat and lon:
            query = f"lat={lat}&lon={lon}"
            # For find API, we use the same coords
            find_query = f"lat={lat}&lon={lon}&cnt=5"
        elif city:
            query = f"q={city}"
            # If city is used, we first need it to get its coords for 'find'
            find_query = f"q={city}&cnt=5"
        else:
            query = f"q=Madurai" # Changing default to Madurai for the user
            find_query = f"q=Madurai&cnt=5"

        # 1. Current Weather
        current_url = f"https://api.openweathermap.org/data/2.5/weather?{query}&appid={WEATHER_API_KEY}&units=metric"
        curr_res = requests.get(current_url).json()

        if str(curr_res.get("cod")) != "200":
            return None

        # 2. Forecast
        forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?{query}&appid={WEATHER_API_KEY}&units=metric"
        fore_res = requests.get(forecast_url).json()

        # 3. Nearby Areas (The 'improvement' requested)
        nearby_url = f"https://api.openweathermap.org/data/2.5/find?{find_query}&appid={WEATHER_API_KEY}&units=metric"
        nearby_res = requests.get(nearby_url).json()

        weather_summary = {
            "city": curr_res["name"],
            "temp": round(curr_res["main"]["temp"]),
            "condition": curr_res["weather"][0]["main"],
            "description": curr_res["weather"][0]["description"],
            "humidity": curr_res["main"]["humidity"],
            "wind": curr_res["wind"]["speed"],
            "forecast": [],
            "nearby": []
        }

        # Simplified forecast
        if fore_res.get("list"):
            for item in fore_res["list"][:3]:
                weather_summary["forecast"].append({
                    "time": item["dt_txt"].split(" ")[1][:5],
                    "temp": round(item["main"]["temp"]),
                    "condition": item["weather"][0]["main"]
                })

        # Add nearby areas
        if nearby_res.get("list"):
            for item in nearby_res["list"]:
                if item["name"] != curr_res["name"]: # Don't repeat current city
                    weather_summary["nearby"].append({
                        "name": item["name"],
                        "temp": round(item["main"]["temp"]),
                        "condition": item["weather"][0]["main"]
                    })

        return weather_summary

    except Exception as e:
        print(f"Weather Fetch Error: {e}")
        return None

    except Exception as e:
        print(f"Weather Fetch Error: {e}")
        return None
