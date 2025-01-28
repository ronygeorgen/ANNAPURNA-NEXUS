import json
from django.http import JsonResponse
import requests
import os


def register(request):
    if request.method == 'POST':
        try:
            json_data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        try:
            user_service_url = os.environ.get('USER_SVC_ADDRESS', 'http://localhost:8000/user/register/')
            response = requests.post(user_service_url, json=json_data)
            gateway_response = JsonResponse(response.json(), status=response.status_code)

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


def login(request):
    if request.method == 'POST':
        try:
            json_data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        try:
            login_service_url = os.environ.get('USER_SVC_ADDRESS', 'http://localhost:8000/user/login/')
            response = requests.post(login_service_url, json=json_data)
            gateway_response = JsonResponse(response.json(), status=response.status_code)

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


def resend_otp(request):
    if request.method == 'POST':
        try:
            json_data = json.loads(request.body)
            user_id = json_data.get('user_id')  # Extract auth_token
            
            if not user_id:
                return JsonResponse({'error': 'user id is required'}, status=400)
                
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        try:
            url = os.environ.get('USER_SVC_ADDRESS', 'http://localhost:8000/user/resend-otp/')
            
            # Forward the request with auth_token
            response = requests.post(
                url, 
                json={'user_id': user_id}  # Explicitly passing user_id
            )
            
            gateway_response = JsonResponse(response.json(), status=response.status_code)

            # Forward cookies from the service response
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

def verify_signup_otp(request):
    if request.method == 'POST':
        try:
            json_data = json.loads(request.body)
            user_id = json_data.get('user_id')   
            otp = json_data.get('otp')  
            
            if not user_id or not otp:
                return JsonResponse({'error': 'user id and otp is required'}, status=400)
                
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        try:
            url = os.environ.get('USER_SVC_ADDRESS', 'http://localhost:8000/user/verify-otp/')
            
            # Forward the request with auth_token
            response = requests.post(
                url, 
                json={'user_id': user_id, 'otp': otp  }  # Explicitly passing user_id and otp
            )
            
            gateway_response = JsonResponse(response.json(), status=response.status_code)

            # Forward cookies from the service response
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
    
def google_auth(request):
    if request.method == 'POST':
        try:
            json_data = json.loads(request.body)
            auth_token = json_data.get('auth_token')  # Extract auth_token
            
            if not auth_token:
                return JsonResponse({'error': 'Auth token is required'}, status=400)
                
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        try:
            google_auth_service_url = os.environ.get('USER_SVC_ADDRESS', 'http://localhost:8000/user/google-auth/')
            
            # Forward the request with auth_token
            response = requests.post(
                google_auth_service_url, 
                json={'auth_token': auth_token}  # Explicitly passing auth_token
            )
            
            gateway_response = JsonResponse(response.json(), status=response.status_code)

            # Forward cookies from the service response
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

def updatelocation(request):
    if request.method == 'PATCH':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            json_data = json.loads(request.body)
            print('json data====',json_data)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        try:
            url = os.environ.get('USER_SVC_ADDRESS', 'http://localhost:8000/user/update-location/')
            headers = {
                    'Authorization': f'Bearer {access_token}',
                    'Content-Type': 'application/json'
                }
            response = requests.patch(url, json=json_data, headers=headers)
            gateway_response = JsonResponse(response.json(), status=response.status_code)

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

def loginAdmin(request):
    if request.method == 'POST':
        try:
            json_data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        try:
            login_service_url = os.environ.get('USER_SVC_ADDRESS', 'http://localhost:8000/user/admin-login/')
            response = requests.post(login_service_url, json=json_data)
            gateway_response = JsonResponse(response.json(), status=response.status_code)

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

def loginSubAdmin(request):
    if request.method == 'POST':
        try:
            json_data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        try:
            login_service_url = os.environ.get('USER_SVC_ADDRESS', 'http://localhost:8000/user/sub-admin-login/')
            response = requests.post(login_service_url, json=json_data)
            gateway_response = JsonResponse(response.json(), status=response.status_code)

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

def create_sub_admin(request):
    if request.method == 'POST':
        try:
            json_data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        try:
            access_token = request.COOKIES.get('access_token')
            # refresh_token = request.COOKIES.get('refresh_token')

            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)

            create_sub_admin_url = os.environ.get('USER_SVC_ADDRESS', 'http://localhost:8000/user/create-sub-admin/')

            headers = {
                'Authorization': f'Bearer {access_token}',  
                'Content-Type': 'application/json',
            }

            response = requests.post(create_sub_admin_url, json=json_data, headers=headers)
            
           
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
        return JsonResponse({'error': 'Method not allowed'}, status=405)

def refresh_token(request):
    if request.method == 'POST':
        try:
            refresh_token = request.COOKIES.get('refresh_token')
            # if not refresh_token:
            #     return JsonResponse({'error': 'Refresh token required'}, status=401)

            # Forward to user service
            refresh_url = os.environ.get('USER_SVC_ADDRESS', 'http://localhost:8000/user/refresh-token/')
            response = requests.post(
                refresh_url,
                cookies={'refresh_token': refresh_token}
            )

            # Create gateway response
            gateway_response = JsonResponse(response.json(), status=response.status_code)

            # Forward any cookies from user service
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
    

def get_all_users_count(request):
    if request.method == 'GET':
        try:
            # Get access token from cookies
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            # Get the ration shop service address from environment variables
            url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8000/user/user-count/')
            
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