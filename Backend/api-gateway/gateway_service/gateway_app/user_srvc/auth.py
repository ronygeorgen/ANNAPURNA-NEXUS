from django.conf import settings
import json
from django.http import JsonResponse
import requests
import os

# Constants for service URLs
USER_SERVICE_BASE_URL = f"http://{os.getenv('USER_SERVICE_URL', 'user-service:8000')}"

def _forward_cookies(response, gateway_response):
    """Helper function to forward cookies from service response to gateway response"""
    for cookie in response.cookies:
        gateway_response.set_cookie(
            key=cookie.name, 
            value=cookie.value, 
            httponly=cookie.has_nonstandard_attr('HttpOnly'),
            secure=cookie.secure,
            samesite=cookie.get_nonstandard_attr('SameSite')
        )
    return gateway_response
    

def register(request):
    if request.method == 'POST':
        try:
            json_data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        try:
            url = f"{USER_SERVICE_BASE_URL}/user/register/"
            response = requests.post(url, json=json_data)
            gateway_response = JsonResponse(response.json(), status=response.status_code)
            return _forward_cookies(response, gateway_response)
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def login(request):
    if request.method == 'POST':
        try:
            json_data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        try:
            url = f"{USER_SERVICE_BASE_URL}/user/login/"
            response = requests.post(url, json=json_data)
            gateway_response = JsonResponse(response.json(), status=response.status_code)
            return _forward_cookies(response, gateway_response)
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def loginAdmin(request):
    if request.method == 'POST':
        try:
            json_data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        try:
            url = f"{USER_SERVICE_BASE_URL}/user/admin-login/"
            response = requests.post(url, json=json_data)
            gateway_response = JsonResponse(response.json(), status=response.status_code)
            return _forward_cookies(response, gateway_response)
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def loginSubAdmin(request):
    if request.method == 'POST':
        try:
            json_data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        try:
            url = f"{USER_SERVICE_BASE_URL}/user/sub-admin-login/"
            response = requests.post(url, json=json_data)
            gateway_response = JsonResponse(response.json(), status=response.status_code)
            return _forward_cookies(response, gateway_response)
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def create_sub_admin(request):
    if request.method == 'POST':
        try:
            json_data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)

            url = f"{USER_SERVICE_BASE_URL}/user/create-sub-admin/"
            headers = {
                'Authorization': f'Bearer {access_token}',  
                'Content-Type': 'application/json',
            }

            response = requests.post(url, json=json_data, headers=headers)
            gateway_response = JsonResponse(response.json(), status=response.status_code)
            return _forward_cookies(response, gateway_response)
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def refresh_token(request):
    if request.method == 'POST':
        try:
            refresh_token = request.COOKIES.get('refresh_token')
            url = f"{USER_SERVICE_BASE_URL}/user/refresh-token/"
            response = requests.post(
                url,
                cookies={'refresh_token': refresh_token}
            )
            gateway_response = JsonResponse(response.json(), status=response.status_code)
            return _forward_cookies(response, gateway_response)
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def get_all_users_count(request):
    if request.method == 'GET':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            url = f"{USER_SERVICE_BASE_URL}/user/user-count/"
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            response = requests.get(url, headers=headers)
            gateway_response = JsonResponse(response.json(), status=response.status_code)
            return _forward_cookies(response, gateway_response)
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)