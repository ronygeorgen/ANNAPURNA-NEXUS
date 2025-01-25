from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from .serializers import RegisterSerializer, LoginSerializer, CreateSubAdminSerializer
from rest_framework import status
from django.http import JsonResponse
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.permissions import BasePermission
from users_admins_app.models import Account
import logging
from .authentication import UserJWTAuthenticationCards
from django.db.models import Count, Sum

logger = logging.getLogger(__name__)

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)

    refresh['email'] = user.email

    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class RegisterView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = get_tokens_for_user(user)
            user_data = {
                "id": user.id,
                "email": user.email,
            }
            response_data = {
                "message": "Registration successful",
                "user": user_data,
                "tokens": tokens
            }
            response = JsonResponse(response_data, status=status.HTTP_201_CREATED)
            response.set_cookie('access_token', tokens['access'], httponly=True, secure=True, samesite='Strict')
            response.set_cookie('refresh_token', tokens['refresh'], httponly=True, secure=True, samesite='Strict')
            return response
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            user = authenticate(request, email=email, password=password)

            if user is not None:
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
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        
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
        
        return Response({'message': 'Location updated successfully'})

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