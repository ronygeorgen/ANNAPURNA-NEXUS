import json
from django.http import JsonResponse
import requests
import os
from concurrent.futures import ThreadPoolExecutor
from collections import defaultdict
import datetime
from dateutil import parser

def create_order(request):
    if request.method == 'POST':
        try:
            json_data = json.loads(request.body)
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
    
def get_orders(request):
    if request.method == 'GET':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            
            orders_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8003/order-management/order-list/')

            
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            response = requests.get(orders_url, headers=headers)
            
            try:
                response_data = response.json()
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
    

def get_orders_for_sub_admin(request):
    if request.method == 'GET':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            shop_id = request.GET.get('shop_id')
            
            orders_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8003/order-management/order-list-sub-admin/')

            params = {}
            if shop_id:
                params['shop_id'] = shop_id
            
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            response = requests.get(orders_url, headers=headers, params=params)
            
            try:
                response_data = response.json()
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


def get_orders_for_user(request):
    if request.method == 'GET':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            user_email = request.GET.get('user_email')
            
            orders_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8003/order-management/order-list-user/')

            params = {}
            if user_email:
                params['user_email'] = user_email
            
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            response = requests.get(orders_url, headers=headers, params=params)
            
            try:
                response_data = response.json()
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


def get_orders_for_user_cardbased(request):
    if request.method == 'GET':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            card_number = request.GET.get('card_number')
            
            orders_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8003/order-management/order-list-cardbased/')

            params = {}
            if card_number:
                params['card_number'] = card_number
            
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            response = requests.get(orders_url, headers=headers, params=params)
            
            try:
                response_data = response.json()
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
    
def stripe_pay(request):
    if request.method == 'POST':
        try:
            json_data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        try:
            access_token = request.COOKIES.get('access_token')

            if not access_token:
                return JsonResponse({'error':'Authorization credentials not found'}, status=401)

            create_order_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8003/order-management/create-checkout-session/')            

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


def save_stripe_order(request):
    if request.method == 'POST':
        try:
            json_data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        try:
            access_token = request.COOKIES.get('access_token')

            if not access_token:
                return JsonResponse({'error':'Authorization credentials not found'}, status=401)

            create_order_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8003/order-management/save-stripe-order/')            

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
    

def verify_order(request, order_id):
    if request.method == 'GET':
            
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            order_verify_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', f'http://localhost:8003/order-management/order-fetch-stripe/{order_id}/')
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }
            
            response = requests.get(order_verify_url, headers=headers)
            
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

def ordered_products_count_admin(request):
    if request.method == 'GET':
        try:
            # Get access token from cookies
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            # Get the ration shop service address from environment variables
            url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8003/order-management/ordered-products-count/')
            
            # Set up headers with the access token
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            # Forward the request to the shop service
            response = requests.get(url, headers=headers)
            
            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            
            # Create the gateway response
            gateway_response = JsonResponse(response_data, status=response.status_code)
            
            # Forward any cookies from the shop service
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


def ordered_revenue_admin(request):
    if request.method == 'GET':
        try:
            # Get access token from cookies
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            # Get the ration shop service address from environment variables
            url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8003/order-management/revenue/')
            
            # Set up headers with the access token
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            # Forward the request to the shop service
            response = requests.get(url, headers=headers)
            
            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            
            # Create the gateway response
            gateway_response = JsonResponse(response_data, status=response.status_code)
            
            # Forward any cookies from the shop service
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
    

def fetch_service_data(url, headers, params=None):
    try:
        response = requests.get(url, headers=headers, params=params)
        return response.json() if response.status_code == 200 else None
    except Exception as e:
        print('Exception in dashboard matrics function',e)
        return None

def dashboard_metrics(request):
    if request.method == 'GET':
        try:
            # Get access token and shop_id
            access_token = request.COOKIES.get('access_token')
            shop_id = request.GET.get('shop_id')
            
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            if not shop_id:
                return JsonResponse({'error': 'Shop ID is required'}, status=400)
            
            headers = {'Authorization': f'Bearer {access_token}'}
            params = {'shop_id': shop_id}
            
            # Service URLs
            order_service = os.environ.get('ORDER_SERVICE_ADDRESS', 'http://localhost:8003')
            ration_shop_service = os.environ.get('RATION_SHOP_SERVICE_ADDRESS', 'http://localhost:8002')
            
            # Define endpoints with params
            urls = {
                'revenue': (f"{order_service}/order-management/sub-admin-revenue/", params),
                'orders': (f"{order_service}/order-management/sub-admin-orders/", params),
                'registered_cards': (f"{ration_shop_service}/ration-card/sub-admin-registered-cards/", params),
                'pending_cards': (f"{ration_shop_service}/ration-card/sub-admin-pending-cards/", params)
            }
            
            # Fetch data in parallel
            with ThreadPoolExecutor(max_workers=4) as executor:
                futures = {
                    key: executor.submit(fetch_service_data, url, headers, params)
                    for key, (url, params) in urls.items()
                }
                
                results = {
                    key: future.result()
                    for key, future in futures.items()
                }
            
            # Calculate monthly stats from orders
            monthly_stats = []
            if results['orders'] and results['orders'].get('orders'):
                
                monthly_data = defaultdict(lambda: {'total_sales': 0, 'count': 0})
                
                for order in results['orders']['orders']:
                    if order['status'] == 'PENDING':
                        date = parser.parse(order['created_at'])
                        month_key = date.strftime('%b')
                        monthly_data[month_key]['total_sales'] += float(order['total_amount'])
                        monthly_data[month_key]['count'] += 1
                
                monthly_stats = [
                    {
                        'month': month,
                        'Sales': data['total_sales'],
                        'Orders': data['count']
                    }
                    for month, data in monthly_data.items()
                ]
            
            response_data = {
                'revenue': sum(float(order['total_amount']) 
                             for order in results['orders'].get('orders', [])
                             if order['status'] == 'PENDING'),
                'orders': results['orders'].get('orders', []),
                'registered_cards': results['registered_cards'].get('total_cards', 0),
                'pending_cards': results['pending_cards'].get('pending_cards', 0),
                'monthly_stats': monthly_stats
            }
            
            return JsonResponse(response_data)
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def previous_address(request, user_email):
    if request.method == 'GET':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            base_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8003')

            url = f"{base_url}/order-management/user-addresses/{user_email}/"

            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            response = requests.get(url, headers=headers)
            
            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            
            gateway_response = JsonResponse(response_data, safe=False, status=response.status_code)
            
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

    return JsonResponse({'error': 'Method not allowed'}, status=405)