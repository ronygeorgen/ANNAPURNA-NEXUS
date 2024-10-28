from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .user_srvc import auth
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
import json

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            response = auth.register(request)
            return response
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            response = auth.login(request)
            return response
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminLoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(seflf, request, *args, **kwargs):
        try:
            response = auth.loginAdmin(request)
            return response
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CreateSubAdminView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        # print(f'User: {request.user}, Authenticated: {request.user.is_authenticated}')
        try:
            response = auth.create_sub_admin(request)
            return response
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class SubAdminLoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(seflf, request, *args, **kwargs):
        try:
            response = auth.loginSubAdmin(request)
            return response
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LogoutView(APIView):
    def post(self, request):
        response = Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        return response