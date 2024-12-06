import json
from django.http import JsonResponse
import requests
import os
from urllib3.filepost import encode_multipart_formdata

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

def get_sub_admins(request):
    if request.method == 'GET':
        try:
            access_token = request.COOKIES.get('access_token')

            # print('access_token:',access_token)
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
                gateway_response = JsonResponse(response_data, safe=False, status=response.status_code)

                # Forward any new cookies from user service response
                for cookie in response.cookies:
                    print('cookie name=',cookie.name)
                    gateway_response.set_cookie(
                        key=cookie.name,
                        value=cookie.value,
                        httponly=cookie.has_nonstandard_attr('HttpOnly'),
                        secure=cookie.secure,
                        samesite=cookie.get_nonstandard_attr('SameSite')
                    )
                print('gateway_response',gateway_response)

                return gateway_response

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
    

def get_sub_admin_profile(request):
    if request.method == 'GET':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            profile_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8002/ration-shop/profile/')
            
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            response = requests.get(profile_url, headers=headers)
            
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

def update_sub_admin_profile(request):
    if request.method == 'PATCH':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            profile_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8002/ration-shop/profile/update/')
            
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid JSON'}, status=400)
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }
            
            response = requests.patch(profile_url, json=data, headers=headers)
            
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

def upload_profile_picture(request):
    if request.method == 'POST':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            if 'image' not in request.FILES:
                return JsonResponse({'error': 'No image provided'}, status=400)
            
            upload_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8002/ration-shop/profile/upload_picture/')
            
            # Prepare the file for multipart upload
            files = {'image': (request.FILES['image'].name, request.FILES['image'].read())}
            
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            response = requests.post(upload_url, files=files, headers=headers)
            
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

def upload_shop_image(request):
    if request.method == 'POST':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            if 'image' not in request.FILES:
                return JsonResponse({'error': 'No image provided'}, status=400)
            
            upload_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8002/ration-shop/profile/upload_shop_image/')
            
            # Prepare the file for multipart upload
            files = {'image': (request.FILES['image'].name, request.FILES['image'].read())}
            
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            response = requests.post(upload_url, files=files, headers=headers)
            
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

def delete_shop_image(request, image_id):
    if request.method == 'DELETE':
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            delete_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', f'http://localhost:8002/ration-shop/profile/delete_shop_image/{image_id}/')
            
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            response = requests.delete(delete_url, headers=headers)
            
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

def get_all_shops(request):
    if request.method == 'GET':
        try:
            # Get access token from cookies
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            # Get the ration shop service address from environment variables
            shop_service_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8002/ration-shop/shops/')
            
            # Set up headers with the access token
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            # Forward the request to the shop service
            response = requests.get(shop_service_url, headers=headers)
            
            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            
            # Create the gateway response
            gateway_response = JsonResponse(response_data, safe=False, status=response.status_code)
            
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


def get_all_shops_id_and_name(request):
    if request.method == 'GET':
        try:
            # Get access token from cookies
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({'error': 'Authorization credentials not found'}, status=401)
            
            # Get the ration shop service address from environment variables
            shop_service_url = os.environ.get('RATION_SHOP_SVC_ADDRESS', 'http://localhost:8002/ration-shop/fetch-all-shops/')
            
            # Set up headers with the access token
            headers = {
                'Authorization': f'Bearer {access_token}',
            }
            
            # Forward the request to the shop service
            response = requests.get(shop_service_url, headers=headers)
            
            try:
                response_data = response.json()
            except ValueError:
                response_data = {}
            
            # Create the gateway response
            gateway_response = JsonResponse(response_data, safe=False, status=response.status_code)
            
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