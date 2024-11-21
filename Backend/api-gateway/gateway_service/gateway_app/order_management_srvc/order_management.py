import json
from django.http import JsonResponse
import requests
import os

def create_order(request):
    if request.method == 'POST':
        try:
            json_data = json.loads(request.body)
            print(json_data)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        try:
            access_token = request.COOKIES.get('access_token')

            if not access_token:
                return JsonResponse({'error':'Authorization credentials not found'}, status=401)

            create_order_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8003/order-management/order-create/')            

            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }
            response = requests.post(create_order_url, json=json_data, headers=headers)

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