from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from .serializers import RegisterSerializer, LoginSerializer, CreateSubAdminSerializer, GoogleAuthSerializer
from rest_framework import status
from django.http import JsonResponse
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.permissions import BasePermission
from users_admins_app.models import Account, OTP
import logging
from .authentication import UserJWTAuthenticationCards
from django.db.models import Count, Sum
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
import random
from datetime import timedelta



logger = logging.getLogger(__name__)

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)

    refresh['email'] = user.email

    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def generate_otp():
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

def send_otp_email(email, otp):
    subject = 'Your OTP for Email Verification'
    message = f'Your OTP is: {otp}\nThis OTP will expire in 2 minutes.'
    from_email = settings.EMAIL_HOST_USER
    recipient_list = [email]
    
    send_mail(subject, message, from_email, recipient_list)

class RegisterView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            otp = generate_otp()
            OTP.objects.create(user=user, otp=otp)
            send_otp_email(user.email, otp)

            user_data = {
                "id": user.id,
                "email": user.email,
            }
            response_data = {
                "message": "Registration successful. Please verify OTP.",
                "user": user_data,
                # "tokens": tokens
            }
            response = JsonResponse(response_data, status=status.HTTP_201_CREATED)
            return response
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class VerifyOTPView(APIView):
    def post(self, request):
        user_id = request.data.get('user_id')
        otp_value = request.data.get('otp')
        
        try:
            user = Account.objects.get(id=user_id)
            otp_obj = OTP.objects.filter(user=user).latest('created_at')
            
            if not otp_obj.is_valid():
                return Response({
                    "error": "OTP has expired"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if otp_obj.otp != otp_value:
                otp_obj.attempts += 1
                otp_obj.save()
                return Response({
                    "error": "Invalid OTP"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user.email_verified = True
            user.save()
            
            tokens = get_tokens_for_user(user)
            return Response({
                "message": "Email verified successfully",
                "tokens": tokens
            }, status=status.HTTP_200_OK)
            
        except Account.DoesNotExist:
            return Response({
                "error": "User not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except OTP.DoesNotExist:
            return Response({
                "error": "No OTP found"
            }, status=status.HTTP_404_NOT_FOUND)

class ResendOTPView(APIView):
    def post(self, request):
        user_id = request.data.get('user_id')
        
        try:
            user = Account.objects.get(id=user_id)
            last_otp = OTP.objects.filter(user=user).latest('created_at')
            
            # Check if 30 seconds have passed since last OTP
            time_diff = timezone.now() - last_otp.created_at
            if time_diff.total_seconds() < 30:
                return Response({
                    "error": "Please wait before requesting new OTP",
                    "wait_time": 30 - int(time_diff.total_seconds())
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate and send new OTP
            new_otp = generate_otp()
            OTP.objects.create(user=user, otp=new_otp)
            send_otp_email(user.email, new_otp)
            
            return Response({
                "message": "New OTP sent successfully"
            }, status=status.HTTP_200_OK)
            
        except Account.DoesNotExist:
            return Response({
                "error": "User not found"
            }, status=status.HTTP_404_NOT_FOUND)


class LoginView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            # Get the pre-authenticated user from serializer
            user = serializer.validated_data['user']
            
            tokens = get_tokens_for_user(user)
            user_data = {
                "id": user.id,
                "email": user.email,
            }
            response_data = {
                "message": "Login successful",
                "user": user_data,
                "tokens": tokens
            }
            response = JsonResponse(response_data, status=status.HTTP_200_OK)
            response.set_cookie('access_token', tokens['access'], httponly=True, secure=True, samesite='Strict')
            response.set_cookie('refresh_token', tokens['refresh'], httponly=True, secure=True, samesite='Strict')
            return response
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    




class UpdateLocationView(APIView):

    authentication_classes = [UserJWTAuthenticationCards]
    
    def patch(self, request):
        user = request.user
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        user.latitude = latitude
        user.longitude = longitude
        user.save()
        
        return Response({
            'message': 'Location updated successfully',
            'latitude': latitude,
            'longitude': longitude
        })


class GoogleAuthView(APIView):
    def post(self, request):
        GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID
        serializer = GoogleAuthSerializer(data=request.data)
        if serializer.is_valid():
            auth_token = serializer.validated_data['auth_token']
            
            try:
                # Verify the token
                idinfo = id_token.verify_oauth2_token(
                    auth_token, 
                    requests.Request(), 
                    GOOGLE_CLIENT_ID  
                )

                # Get or create user
                email = idinfo['email']
                user, created = Account.objects.get_or_create(
                    email=email,
                    defaults={
                        'google_id': idinfo['sub'],
                        'first_name': idinfo.get('given_name', ''),
                        'last_name': idinfo.get('family_name', ''),
                        'is_active': True,
                        'is_user': True
                    }
                )
                

                # Generate tokens
                tokens = get_tokens_for_user(user)
                
                response_data = {
                    "message": "Login successful",
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                    },
                    "tokens": tokens
                }

                response = JsonResponse(response_data)
                response.set_cookie('access_token', tokens['access'], httponly=True, secure=True, samesite='Strict')
                response.set_cookie('refresh_token', tokens['refresh'], httponly=True, secure=True, samesite='Strict')
                return response

            except ValueError:
                return Response({"error": "Invalid token"}, status=400)

        return Response(serializer.errors, status=400)

class AdminLoginView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            admin = authenticate(request, email=email, password=password)

            if admin is not None:
                if admin.is_superadmin:
                    tokens = get_tokens_for_user(admin)
                    admin_data = {
                        "id":admin.id,
                        "email":admin.email,
                        "is_superadmin": admin.is_superadmin
                    }
                    response_data = {
                        "message": "Admin login successful",
                        "admin": admin_data,
                        "tokens":tokens
                    }
                    response = JsonResponse(response_data, status=status.HTTP_200_OK)
                    response.set_cookie('access_token', tokens['access'], httponly=True, secure=True, samesite='Strict')
                    response.set_cookie('refresh_token', tokens['refresh'], httponly=True, secure=True, samesite='Strict')
                    return response
                else:
                    return Response({"error": "Not authorized as an admin"}, status=status.HTTP_403_FORBIDDEN)

            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SubAdminLoginView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            sub_admin = authenticate(request, email=email, password=password)

            if sub_admin is not None:
                if sub_admin.is_subadmin:
                    tokens = get_tokens_for_user(sub_admin)
                    sub_admin_data = {
                        "id":sub_admin.id,
                        "email":sub_admin.email,
                        "is_subadmin": sub_admin.is_subadmin
                    }
                    response_data = {
                        "message": "Sub-Admin login successful",
                        "sub_admin": sub_admin_data,
                        "tokens":tokens
                    }
                    response = JsonResponse(response_data, status=status.HTTP_200_OK)
                    response.set_cookie('access_token', tokens['access'], httponly=True, secure=True, samesite='Strict')
                    response.set_cookie('refresh_token', tokens['refresh'], httponly=True, secure=True, samesite='Strict')
                    return response
                else:
                    return Response({"error": "Not authorized as an admin"}, status=status.HTTP_403_FORBIDDEN)

            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IsSuperAdmin(BasePermission):

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superadmin)


class CreateSubAdminView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request, *args, **kwargs):
        serializer = CreateSubAdminSerializer(data=request.data)
        if serializer.is_valid():
            sub_admin = serializer.save()
            return Response({
                "message": "Sub-admin created successfully",
                "sub_admin": {
                    "id": sub_admin.id,
                    "email": sub_admin.email,
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RefreshTokenView(APIView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')
        
        # Debug logging to verify refresh token retrieval
        if not refresh_token:
            logger.warning("Refresh token missing in request.")
            return Response({"error": "Refresh token required"}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            refresh = RefreshToken(refresh_token)
            new_access_token = str(refresh.access_token)
            
            response = Response({
                'message': 'Token refreshed successfully',
                'access_token': new_access_token  # Send back access token if needed
            })
            response.set_cookie(
                'access_token',
                new_access_token,
                httponly=True,
                secure=True,
                samesite='Strict'
            )
            return response
            
        except Exception as e:
            logger.error(f"Invalid refresh token: {str(e)}")
            response = Response(
                {"error": "Invalid refresh token"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            response.delete_cookie('access_token')
            response.delete_cookie('refresh_token')
            return response


class UserCountView(APIView):
    def get(self, request):
        user_count = Account.objects.filter(
            is_superadmin=False, 
            is_subadmin=False, 
            is_user=False
        ).count()
        print(user_count)

        return Response({
            'count': user_count
        })