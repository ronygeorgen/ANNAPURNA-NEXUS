import json
from django.http import JsonResponse
import requests
import os

def create_product_items(request):
    if request.method == 'POST':
        try:
            json_data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        try:
            access_token = request.COOKIES.get('access_token')

            if not access_token:
                return JsonResponse({'error':'Authorization credentials not found'}, status=401)

            create_product_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8002/product-management/create/')            

            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }
            response = requests.post(create_product_url, json=json_data, headers=headers)

            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            
            gateway_response = JsonResponse(response_data, status=response.status_code)

            # Forward any new cookies from user service response
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
        return JsonResponse({'error':'Method not allowed'}, status=405)
    

def get_quota_info(request):
    if request.method == 'GET':
        try:
            # Retrieve access token from cookies
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({
                    'error': 'Authorization credentials not found',
                    'details': 'No access token present in cookies'
                }, status=401)

            # Get query parameters
            card_type = request.GET.get('cardType', 'antyodaya')
            shop_id = request.GET.get('shopId')

            # Construct request to quota info service
            quota_info_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8002/product-management/quota-info/')
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }

            # Prepare query parameters
            params = {
                'cardType': card_type
            }
            if shop_id:
                params['shopId'] = shop_id

            # Make request to quota info service with timeout
            try:
                response = requests.get(
                    quota_info_url, 
                    headers=headers, 
                    params=params,
                    timeout=10  # 10 seconds timeout
                )
                
                # Handle different status codes
                if response.status_code == 200:
                    try:
                        response_data = response.json()
                        print(response_data)
                    except ValueError:
                        return JsonResponse({
                            'error': 'Invalid JSON response from quota info service',
                            'details': response.text
                        }, status=500)
                elif response.status_code == 401:
                    return JsonResponse({
                        'error': 'Unauthorized',
                        'details': 'Invalid or expired access token'
                    }, status=401)
                elif response.status_code == 403:
                    return JsonResponse({
                        'error': 'Forbidden',
                        'details': 'Insufficient permissions'
                    }, status=403)
                else:
                    return JsonResponse({
                        'error': 'Service request failed',
                        'details': response.text,
                        'status_code': response.status_code
                    }, status=response.status_code)

            except requests.Timeout:
                return JsonResponse({
                    'error': 'Request timed out',
                    'details': 'Quota info service did not respond in time'
                }, status=504)

            except requests.ConnectionError:
                return JsonResponse({
                    'error': 'Connection error',
                    'details': 'Unable to connect to quota info service'
                }, status=503)

            # Create gateway response with original data
            gateway_response = JsonResponse(response_data, status=response.status_code)

            # Propagate cookies from original response
            for cookie in response.cookies:
                gateway_response.set_cookie(
                    key=cookie.name,
                    value=cookie.value,
                    httponly=cookie.has_nonstandard_attr('HttpOnly'),
                    secure=cookie.secure,
                    samesite=cookie.get_nonstandard_attr('SameSite', 'Lax')
                )

            return gateway_response

        except Exception as e:
            # Catch-all for unexpected errors
            return JsonResponse({
                'error': 'Unexpected error occurred',
                'details': str(e)
            }, status=500)
    else:
        return JsonResponse({'error':'Method not allowed'}, status=405)