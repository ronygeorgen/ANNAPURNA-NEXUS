from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .user_srvc import auth
from .ration_shop_srvc import ration_shop
from .ration_card_srvc import ration_card
from .product_management_srvc import product_manage
from .order_management_srvc import order_management
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
    
class CreateRationShopView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        try:
            response = ration_shop.create_ration_shop(request)
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GetSubAdminView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, *args, **kwargs):
        try:
            response = ration_shop.get_sub_admins(request)
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RefreshView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        try:
            response = auth.refresh_token(request)
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SubAdminProfileView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, *args, **kwargs):
        try:
            response = ration_shop.get_sub_admin_profile(request)
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    def patch(self, request, *args, **kwargs):
        try:
            response = ration_shop.update_sub_admin_profile(request)
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class SubAdminProfilePictureUploadView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        try:
            response = ration_shop.upload_profile_picture(request)
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class SubAdminShopImageUploadView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        try:
            response = ration_shop.upload_shop_image(request)
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class SubAdminShopImageDeleteView(APIView):
    permission_classes = [AllowAny]
    
    def delete(self, request, image_id, *args, **kwargs):
        try:
            response = ration_shop.delete_shop_image(request, image_id)
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=500)
        
class GetRationShopsAtUserSide(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, *args, **kwargs):
        try:
            response = ration_shop.get_all_shops(request)
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CreateRationCard(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            response = ration_card.register_ration_card(request)
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GetRationCards(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        try:
            response = ration_card.get_ration_cards(request)
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyRationCardByNumber(APIView):
    permission_classes = [AllowAny]

    def get(self, request, card_number, *args, **kwargs):
        try:
            response = ration_card.verify_ration_card_by_number(request, card_number)
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CreateProductItems(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            response = product_manage.create_product_items(request)
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetQuotaInfo(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        try:
            response = product_manage.get_quota_info(request)
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CreateOrder(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            response = order_management.create_order(request)
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)