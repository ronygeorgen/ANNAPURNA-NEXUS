import json
from django.http import JsonResponse
import requests
import os

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

            create_ration_shop_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8002/ration-shop/create/')            

            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }

            response = requests.post(create_ration_shop_url, json=json_data, headers=headers)

            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            
            return JsonResponse(response_data, status=response.status_code)
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error':'Method not allowed'}, status=405)

def get_sub_admins(request):
    if request.method == 'GET':
        try:
            access_token = request.COOKIES.get('access_token')
            print('access_token:',access_token)
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            # Get the ration shop service URL from environment variables
            get_sub_admins_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8002/ration-shop/sub-admins/')
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }
            
            try:
                response = requests.get(get_sub_admins_url, headers=headers, timeout=10)
                response.raise_for_status()
                
                # Directly use the response data
                response_data = response.json()
                
                return JsonResponse(response_data, safe=False, status=response.status_code)
            
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
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)