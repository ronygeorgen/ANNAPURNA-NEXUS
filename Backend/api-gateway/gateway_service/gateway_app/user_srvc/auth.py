import json
from urllib import response
from django.conf import settings
from django.http import JsonResponse
import requests
from rest_framework.views import APIView
import environ
import os

def register(request):
    try:
        json_data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    
    response = requests.post(
        f"http://{os.environ.get('USER_SVC_ADDRESS')}/register/",json=json_data
    )
    return JsonResponse(response.json())