import os
import json
import requests
from django.http import JsonResponse

def register_ration_card(request):
    if request.method == 'POST':
        try:
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
            
            # Extract head details from the form data
            form_data = {
                'head_name': request.POST.get('head_name'),
                'head_age': request.POST.get('head_age'),
                'head_monthly_income': request.POST.get('head_monthly_income'),
                'head_aadhaar': request.POST.get('head_aadhaar'),
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
            print(card_number)
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
            
            print(response_data)
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