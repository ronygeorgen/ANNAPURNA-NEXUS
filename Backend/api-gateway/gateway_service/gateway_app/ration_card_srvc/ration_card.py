import os
import json
import requests
from django.http import JsonResponse

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

def register_ration_card(request):
    if request.method == 'POST':
        try:
            print("Request DATA:", request.data)
            print("Request FILES:", request.FILES)
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            upload_url = f"{RATION_SHOP_BASE_URL}/ration-card/create/"
            
            files = {}
            if 'supporting_document' in request.FILES:
                files['supporting_document'] = (
                    request.FILES['supporting_document'].name,
                    request.FILES['supporting_document'].read()
                )
            
            for key in request.FILES.keys():
                if key.startswith('family_members[') and key.endswith('].image'):
                    files[key] = (
                        request.FILES[key].name,
                        request.FILES[key].read()
                    )
            
            form_data = {
                'head_name': request.POST.get('head_name'),
                'head_age': request.POST.get('head_age'),
                'head_monthly_income': request.POST.get('head_monthly_income'),
                'head_aadhaar': request.POST.get('head_aadhaar'),
                'mobile_number': request.POST.get('mobile_number'),
                'household_address': request.POST.get('household_address'),
                'registered_shop': request.data.get('registered_shop'),
                'card_type': request.POST.get('card_type'),
                'family_members': request.POST.get('family_members'),
            }
            
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            response = requests.post(
                upload_url,
                data=form_data,
                files=files,
                headers=headers
            )
            
            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            
            gateway_response = JsonResponse(response_data, status=response.status_code)
            return _forward_cookies(response, gateway_response)
            
        except requests.RequestException as e:
            return JsonResponse({
                'error': 'Service temporarily unavailable',
                'details': str(e)
            }, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

def get_ration_cards(request):
    if request.method == 'GET':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            url = f"{RATION_SHOP_BASE_URL}/ration-card/fetch/"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            response = requests.get(url, headers=headers)
            
            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            
            gateway_response = JsonResponse(response_data, status=response.status_code)
            return _forward_cookies(response, gateway_response)
            
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

def verify_ration_card_by_number(request, card_number):
    if request.method == 'GET':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            url = f"{RATION_SHOP_BASE_URL}/ration-card/verify/{card_number}/"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }
            
            response = requests.get(url, headers=headers)
            
            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            
            gateway_response = JsonResponse(response_data, status=response.status_code)
            return _forward_cookies(response, gateway_response)
            
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

def fetch_card_for_admin_view(request, shop_id):
    if request.method == 'GET':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            url = f"{RATION_SHOP_BASE_URL}/ration-card/fetch-shop-card-admin/{shop_id}/"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }
            
            response = requests.get(url, headers=headers)
            
            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            
            gateway_response = JsonResponse(response_data, status=response.status_code)
            return _forward_cookies(response, gateway_response)
            
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

def shop_verify_card(request, card_number):
    if request.method == 'PATCH':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            url = f"{RATION_SHOP_BASE_URL}/ration-card/{card_number}/shop-verify/"
            
            try:
                data = json.loads(request.body)
                data['card_number'] = card_number
            except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid JSON'}, status=400)
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }
            
            response = requests.patch(url, json=data, headers=headers)
            
            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            
            gateway_response = JsonResponse(response_data, status=response.status_code)
            return _forward_cookies(response, gateway_response)
            
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

def fetch_card_types(request):
    if request.method == 'GET':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            url = f"{RATION_SHOP_BASE_URL}/ration-card/card-types/"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }
            
            response = requests.get(url, headers=headers)
            
            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            
            gateway_response = JsonResponse(response_data, status=response.status_code)
            return _forward_cookies(response, gateway_response)
            
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

def admin_verify_card(request, card_number):
    if request.method == 'PATCH':
        try:
            print(card_number)
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            url = f"{RATION_SHOP_BASE_URL}/ration-card/verify-card-admin/{card_number}/"
            
            try:
                data = json.loads(request.body)
                data['card_number'] = card_number
            except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid JSON'}, status=400)
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }
            
            response = requests.patch(url, json=data, headers=headers)
            
            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            
            gateway_response = JsonResponse(response_data, status=response.status_code)
            return _forward_cookies(response, gateway_response)
            
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

def face_authentication(request):
    if request.method == 'POST':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            url = f"{RATION_SHOP_BASE_URL}/ration-card/face-auth/"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            if request.FILES:
                if 'live_video' in request.FILES:
                    files = {
                        'live_video': request.FILES['live_video']
                    }
                elif 'live_image' in request.FILES:
                    files = {
                        'live_image': request.FILES['live_image']
                    }
                else:
                    return JsonResponse({'error': 'No image or video uploaded'}, status=400)
                
                post_data = {
                    'card_number': request.POST.get('card_number', '')
                }
                
                response = requests.post(url, headers=headers, files=files, data=post_data)
            else:
                return JsonResponse({'error': 'No image or video uploaded'}, status=400)
            
            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            
            gateway_response = JsonResponse(response_data, status=response.status_code)
            return _forward_cookies(response, gateway_response)
            
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

def send_otp(request):
    if request.method == 'POST':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            url = f"{RATION_SHOP_BASE_URL}/ration-card/send-otp/"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            try:
                body = json.loads(request.body)
                post_data = {
                    'card_number': body.get('card_number', ''),
                    'user_email': body.get('user_email', ''),
                    'phone_number': body.get('phone_number', '')
                }
            except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid JSON body'}, status=400)
                
            response = requests.post(url, headers=headers, data=post_data)
            
            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            
            gateway_response = JsonResponse(response_data, status=response.status_code)
            return _forward_cookies(response, gateway_response)
            
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

def verify_otp(request):
    if request.method == 'POST':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            url = f"{RATION_SHOP_BASE_URL}/ration-card/verify-otp/"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            try:
                body = json.loads(request.body)
                post_data = {
                    'card_number': body.get('card_number', ''),
                    'user_email': body.get('user_email', ''),
                    'otp': body.get('otp', '')
                }
            except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid JSON body'}, status=400)
                
            response = requests.post(url, headers=headers, data=post_data)
            
            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            
            gateway_response = JsonResponse(response_data, status=response.status_code)
            return _forward_cookies(response, gateway_response)
            
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

def requested_ration_card_user(request):
    if request.method == 'GET':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            url = f"{RATION_SHOP_BASE_URL}/ration-card/user-requested-cards/"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            user_email = request.GET.get('user_email')
            if not user_email:
                return JsonResponse({'error': 'User email is required'}, status=400)
                
            response = requests.get(url, headers=headers, params={'user_email': user_email})
            
            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
                
            gateway_response = JsonResponse(response_data, safe=False, status=response.status_code)
            return _forward_cookies(response, gateway_response)
            
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)