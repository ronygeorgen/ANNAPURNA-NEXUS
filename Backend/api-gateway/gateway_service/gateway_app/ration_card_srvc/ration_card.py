import os
import json
import requests
from django.http import JsonResponse

def register_ration_card(request):
    if request.method == 'POST':
        try:
            print("Request DATA:", request.data)
            print("Request FILES:", request.FILES)
            # Check for authentication
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            # Get the service address from environment variables
            upload_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8002/ration-card/create/')            
            # Prepare the multipart form data
            files = {}
            if 'supporting_document' in request.FILES:
                files['supporting_document'] = (
                    request.FILES['supporting_document'].name,
                    request.FILES['supporting_document'].read()
                )
            
            # Add family member images
            for key in request.FILES.keys():
                if key.startswith('family_members[') and key.endswith('].image'):
                    files[key] = (
                        request.FILES[key].name,
                        request.FILES[key].read()
                    )
            
            # Extract head details from the form data
            form_data = {
                'head_name': request.POST.get('head_name'),
                'head_age': request.POST.get('head_age'),
                'head_monthly_income': request.POST.get('head_monthly_income'),
                'head_aadhaar': request.POST.get('head_aadhaar'),
                'mobile_number': request.POST.get('mobile_number'),
                'household_address': request.POST.get('household_address'),
                'registered_shop':request.data.get('registered_shop'),
                'card_type': request.POST.get('card_type'),
                'family_members': request.POST.get('family_members'),
            }
            
            # Set up headers
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            # Make the request to the ration shop service
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
            
            # Forward any cookies
            for cookie in response.cookies:
                gateway_response.set_cookie(
                    key=cookie.name,
                    value=cookie.value,
                    httponly=cookie.has_nonstandard_attr('HttpOnly'),
                    secure=cookie.secure,
                    samesite=cookie.get_nonstandard_attr('SameSite')
                )
            
            return gateway_response
            
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
            
            ration_card_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8002/ration-card/fetch/')
            
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            response = requests.get(ration_card_url, headers=headers)
            
            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            
            
            gateway_response = JsonResponse(response_data, status=response.status_code)
            
            for cookie in response.cookies:
                gateway_response.set_cookie(
                    key=cookie.name,
                    value=cookie.value,
                    httponly=cookie.has_nonstandard_attr('HttpOnly'),
                    secure=cookie.secure,
                    samesite=cookie.get_nonstandard_attr('SameSite')
                )
            
            return gateway_response
            
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
            
            ration_card_verify_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', f'http://localhost:8002/ration-card/verify/{card_number}/')
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }
            
            response = requests.get(ration_card_verify_url, headers=headers)
            
            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            
            gateway_response = JsonResponse(response_data, status=response.status_code)
            
            for cookie in response.cookies:
                gateway_response.set_cookie(
                    key=cookie.name,
                    value=cookie.value,
                    httponly=cookie.has_nonstandard_attr('HttpOnly'),
                    secure=cookie.secure,
                    samesite=cookie.get_nonstandard_attr('SameSite')
                )
            
            return gateway_response
            
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
            
            ration_card_fetch_shop_admin_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', f'http://localhost:8002/ration-card/fetch-shop-card-admin/{shop_id}/')
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }
            
            response = requests.get(ration_card_fetch_shop_admin_url, headers=headers)
            
            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            
            gateway_response = JsonResponse(response_data, status=response.status_code)
            
            for cookie in response.cookies:
                gateway_response.set_cookie(
                    key=cookie.name,
                    value=cookie.value,
                    httponly=cookie.has_nonstandard_attr('HttpOnly'),
                    secure=cookie.secure,
                    samesite=cookie.get_nonstandard_attr('SameSite')
                )
            
            return gateway_response
            
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
            
            # Update URL to dynamically include card_number
            url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8002/ration-card/').rstrip('/') + f'/{card_number}/shop-verify/'
            
            try:
                data = json.loads(request.body)
                # Ensure card_number is in the data
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
            
            for cookie in response.cookies:
                gateway_response.set_cookie(
                    key=cookie.name,
                    value=cookie.value,
                    httponly=cookie.has_nonstandard_attr('HttpOnly'),
                    secure=cookie.secure,
                    samesite=cookie.get_nonstandard_attr('SameSite')
                )
            
            return gateway_response
            
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
            
            url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8002/ration-card/card-types/')
            
            # Remove JSON parsing for GET request
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
            
            for cookie in response.cookies:
                gateway_response.set_cookie(
                    key=cookie.name,
                    value=cookie.value,
                    httponly=cookie.has_nonstandard_attr('HttpOnly'),
                    secure=cookie.secure,
                    samesite=cookie.get_nonstandard_attr('SameSite')
                )
            
            return gateway_response
            
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
            
            # Update URL to dynamically include card_number
            url = os.environ.get('RATION_SHOP_SVC_ADDRESS', f'http://localhost:8002/ration-card/verify-card-admin/{card_number}/')
            
            try:
                data = json.loads(request.body)
                # Ensure card_number is in the data
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
            
            for cookie in response.cookies:
                gateway_response.set_cookie(
                    key=cookie.name,
                    value=cookie.value,
                    httponly=cookie.has_nonstandard_attr('HttpOnly'),
                    secure=cookie.secure,
                    samesite=cookie.get_nonstandard_attr('SameSite')
                )
            
            return gateway_response
            
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    

def face_authentication(request):
    if request.method == 'POST':
        try:
            # Check for access token
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            # Get the URL for the ration shop service
            url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8002/ration-card/face-auth/')
            
            # Prepare headers
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            # Handle file upload (support both image and video)
            if request.FILES:
                # Check if video or image is uploaded
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
                
                # Include card number from POST data
                post_data = {
                    'card_number': request.POST.get('card_number', '')
                }
                
                # Forward the request to the ration shop service
                response = requests.post(url, headers=headers, files=files, data=post_data)
            else:
                # If no files are present, it's an invalid request
                return JsonResponse({'error': 'No image or video uploaded'}, status=400)
            
            # Parse the response
            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            
            # Create gateway response
            gateway_response = JsonResponse(response_data, status=response.status_code)
            
            # Forward any cookies from the service response
            for cookie in response.cookies:
                gateway_response.set_cookie(
                    key=cookie.name,
                    value=cookie.value,
                    httponly=cookie.has_nonstandard_attr('HttpOnly'),
                    secure=cookie.secure,
                    samesite=cookie.get_nonstandard_attr('SameSite')
                )
            
            return gateway_response
            
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)



def send_otp(request):
    if request.method == 'POST':
        try:
            # Check for access token
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            # Get the URL for the ration shop service
            url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8002/ration-card/send-otp/')
            
            # Prepare headers
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            # Handle file upload (support both image and video)
            
                
            try:
                body = json.loads(request.body)
                post_data = {
                    'card_number': body.get('card_number', ''),
                    'user_email': body.get('user_email', ''),
                    'phone_number': body.get('phone_number', '')
                }
            except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid JSON body'}, status=400)
                
            # Forward the request to the ration shop service
            response = requests.post(url, headers=headers, data=post_data)
            
            
            # Parse the response
            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            
            # Create gateway response
            gateway_response = JsonResponse(response_data, status=response.status_code)
            
            # Forward any cookies from the service response
            for cookie in response.cookies:
                gateway_response.set_cookie(
                    key=cookie.name,
                    value=cookie.value,
                    httponly=cookie.has_nonstandard_attr('HttpOnly'),
                    secure=cookie.secure,
                    samesite=cookie.get_nonstandard_attr('SameSite')
                )
            
            return gateway_response
            
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


def verify_otp(request):
    if request.method == 'POST':
        try:
            # Check for access token
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            # Get the URL for the ration shop service
            url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8002/ration-card/verify-otp/')
            
            # Prepare headers
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            # Handle file upload (support both image and video)
            
                
            try:
                body = json.loads(request.body)
                post_data = {
                    'card_number': body.get('card_number', ''),
                    'user_email': body.get('user_email', ''),
                    'otp': body.get('otp', '')
                }
            except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid JSON body'}, status=400)
                
            # Forward the request to the ration shop service
            response = requests.post(url, headers=headers, data=post_data)
            
            
            # Parse the response
            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            
            # Create gateway response
            gateway_response = JsonResponse(response_data, status=response.status_code)
            
            # Forward any cookies from the service response
            for cookie in response.cookies:
                gateway_response.set_cookie(
                    key=cookie.name,
                    value=cookie.value,
                    httponly=cookie.has_nonstandard_attr('HttpOnly'),
                    secure=cookie.secure,
                    samesite=cookie.get_nonstandard_attr('SameSite')
                )
            
            return gateway_response
            
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

def requested_ration_card_user(request):
    if request.method == 'GET':
        try:
            # Check for access token
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            # Get the URL for the ration shop service
            url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8002/ration-card/user-requested-cards/')
            
            # Prepare headers
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            # Handle file upload (support both image and video)
            
                
            user_email = request.GET.get('user_email')
            if not user_email:
                return JsonResponse({'error': 'User email is required'}, status=400)
            
                
            # Forward the request to the ration shop service
            response = requests.get(url, headers=headers, params={'user_email': user_email})
            
            
            # Parse the response
            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            # Create gateway response
            gateway_response = JsonResponse(response_data, safe=False, status=response.status_code)
            
            # Forward any cookies from the service response
            for cookie in response.cookies:
                gateway_response.set_cookie(
                    key=cookie.name,
                    value=cookie.value,
                    httponly=cookie.has_nonstandard_attr('HttpOnly'),
                    secure=cookie.secure,
                    samesite=cookie.get_nonstandard_attr('SameSite')
                )
            
            return gateway_response
            
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)