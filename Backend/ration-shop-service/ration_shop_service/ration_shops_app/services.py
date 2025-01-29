import requests
from django.conf import settings

class MapboxGeocoder:
    @staticmethod
    def get_coordinates(location):
        base_url = settings.MAPBOX_URL
        params = {
            'access_token': settings.MAPBOX_ACCESS_TOKEN,
            'limit': 1
        }
        
        try:
            response = requests.get(
                f"{base_url}{location}.json", 
                params=params
            )
            data = response.json()
            
            if data['features']:
                longitude, latitude = data['features'][0]['center']
                return latitude, longitude
            return None, None
        
        except Exception as e:
            print(f"Geocoding error: {e}")
            return None, None