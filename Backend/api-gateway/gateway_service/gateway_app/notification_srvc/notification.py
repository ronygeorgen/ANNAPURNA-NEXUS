import json
from django.http import JsonResponse
import requests
import os
from concurrent.futures import ThreadPoolExecutor
from collections import defaultdict
import datetime


def ActiveSubAdmins(request, shopId):
    if request.method == 'GET':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            
            orders_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', f'http://localhost:8004/notification/video-call/check-online-status/{shopId}/')

            
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            response = requests.get(orders_url, headers=headers)
            
            try:
                response_data = response.json()
                print(response_data)
            except ValueError:
                response_data = {}
            
            gateway_response = JsonResponse(response_data, status=response.status_code, safe=False)
            
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