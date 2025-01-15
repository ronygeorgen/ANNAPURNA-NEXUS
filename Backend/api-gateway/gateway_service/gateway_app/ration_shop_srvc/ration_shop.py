import json
from django.http import JsonResponse
import requests
import os
from urllib3.filepost import encode_multipart_formdata

# Constants for service URLs - Using ConfigMap environment variable
RATION_SHOP_BASE_URL = f"http://{os.getenv('RATION_SHOP_SERVICE_URL', 'ration-shop-service:8002')}"

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

def create_ration_shop(request):
    if request.method == 'POST':
        try:
            json_data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error':'Authorization credentials not found'}, status=401)

            url = f"{RATION_SHOP_BASE_URL}/ration-shop/create/"
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }
            response = requests.post(url, json=json_data, headers=headers)
            gateway_response = JsonResponse(response.json(), status=response.status_code)
            return _forward_cookies(response, gateway_response)
            
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error':'Method not allowed'}, status=405)

def get_sub_admins(request):
    if request.method == 'GET':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            url = f"{RATION_SHOP_BASE_URL}/ration-shop/sub-admins/"
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }
            
            try:
                response = requests.get(url, headers=headers, timeout=10)
                response.raise_for_status()
                response_data = response.json()
                gateway_response = JsonResponse(response_data, safe=False, status=response.status_code)
                return _forward_cookies(response, gateway_response)

            except requests.Timeout:
                return JsonResponse({'error': 'Request to ration shop service timed out'}, status=504)
            except requests.ConnectionError:
                return JsonResponse({'error': 'Unable to connect to ration shop service'}, status=503)
            except requests.RequestException as e:
                return JsonResponse({'error': f'Request failed: {str(e)}'}, status=500)
            except ValueError:
                return JsonResponse({'error': 'Invalid response from service'}, status=500)
            
        except Exception as e:
            return JsonResponse({'error': f'Unexpected error: {str(e)}'}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def get_sub_admin_profile(request):
    if request.method == 'GET':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            url = f"{RATION_SHOP_BASE_URL}/ration-shop/profile/"
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            response = requests.get(url, headers=headers)
            gateway_response = JsonResponse(response.json(), status=response.status_code)
            return _forward_cookies(response, gateway_response)
            
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def update_sub_admin_profile(request):
    if request.method == 'PATCH':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            url = f"{RATION_SHOP_BASE_URL}/ration-shop/profile/update/"
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid JSON'}, status=400)
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }
            response = requests.patch(url, json=data, headers=headers)
            gateway_response = JsonResponse(response.json(), status=response.status_code)
            return _forward_cookies(response, gateway_response)
            
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def upload_profile_picture(request):
    if request.method == 'POST':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            if 'image' not in request.FILES:
                return JsonResponse({'error': 'No image provided'}, status=400)
            
            url = f"{RATION_SHOP_BASE_URL}/ration-shop/profile/upload_picture/"
            files = {'image': (request.FILES['image'].name, request.FILES['image'].read())}
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            response = requests.post(url, files=files, headers=headers)
            gateway_response = JsonResponse(response.json(), status=response.status_code)
            return _forward_cookies(response, gateway_response)
            
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def upload_shop_image(request):
    if request.method == 'POST':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            if 'image' not in request.FILES:
                return JsonResponse({'error': 'No image provided'}, status=400)
            
            url = f"{RATION_SHOP_BASE_URL}/ration-shop/profile/upload_shop_image/"
            files = {'image': (request.FILES['image'].name, request.FILES['image'].read())}
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            response = requests.post(url, files=files, headers=headers)
            gateway_response = JsonResponse(response.json(), status=response.status_code)
            return _forward_cookies(response, gateway_response)
            
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def delete_shop_image(request, image_id):
    if request.method == 'DELETE':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            url = f"{RATION_SHOP_BASE_URL}/ration-shop/profile/delete_shop_image/{image_id}/"
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            response = requests.delete(url, headers=headers)
            gateway_response = JsonResponse(response.json(), status=response.status_code)
            return _forward_cookies(response, gateway_response)
            
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def get_all_shops(request):
    if request.method == 'GET':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            url = f"{RATION_SHOP_BASE_URL}/ration-shop/shops/"
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            response = requests.get(url, headers=headers)
            gateway_response = JsonResponse(response.json(), safe=False, status=response.status_code)
            return _forward_cookies(response, gateway_response)
            
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def get_all_shops_id_and_name(request):
    if request.method == 'GET':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            url = f"{RATION_SHOP_BASE_URL}/ration-shop/fetch-all-shops/"
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            response = requests.get(url, headers=headers)
            gateway_response = JsonResponse(response.json(), safe=False, status=response.status_code)
            return _forward_cookies(response, gateway_response)
            
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)