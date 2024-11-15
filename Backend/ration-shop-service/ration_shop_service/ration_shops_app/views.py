from django.shortcuts import get_object_or_404
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from django.db import transaction
from django.core.cache import cache
from .authentication import AdminTokenAuthentication
from .permissions import IsAdmin
from .models import SubAdminAuth, RationShop, ShopImage
from .serializers import RationShopProfileSerializer, SubAdminSerializer, RationShopSerializer
from rest_framework.parsers import MultiPartParser, FormParser

class SubAdminListView(APIView):
    authentication_classes = [AdminTokenAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        sub_admins = SubAdminAuth.objects.filter(is_active=True)
        serializer = SubAdminSerializer(sub_admins, many=True)
        return Response(serializer.data)

class RationShopViewSet(ModelViewSet):
    serializer_class = RationShopSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    authentication_classes = [AdminTokenAuthentication]

    def get_queryset(self):
        return RationShop.objects.all()
    
    def create(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    # Get the admin from SubAdminAuth
                    admin = SubAdminAuth.objects.get(sub_admin_id=request.user.admin_id)
                    
                    # Let the serializer handle owner assignment
                    shop = serializer.save(created_by=admin)
                    
                    return Response({
                        'message': 'Ration shop created successfully!',
                        'shop': {
                            'id': shop.shop_id,
                            'name': shop.name,
                            'location': shop.location,
                            'mobileNumber': shop.mobile_number,
                            'owner': {
                                'id': shop.owner.sub_admin_id,
                                'email': shop.owner.email
                            }
                        }
                    }, status=status.HTTP_201_CREATED)
            
            except SubAdminAuth.DoesNotExist:
                return Response({
                    'error': 'Invalid admin ID'
                }, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                print(e)
                return Response({
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)



class SubAdminProfileView(APIView):
    print('reacched here')
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        shop = get_object_or_404(RationShop, owner=request.user)
        serializer = RationShopProfileSerializer(shop, context={'request':request})
        return Response(serializer.data)
    
    def patch(self, request):
        # Update user's owner name if provided
        if 'owner_name' in request.data:
            sub_admin = request.user
            sub_admin.owner_name = request.data['owner_name']
            sub_admin.save()
        
        # Update shop details if provided
        shop = get_object_or_404(RationShop, owner=request.user)
        shop_data = {field: request.data[field] for field in ['shopName', 'shopDescription', 'location', 'isOpen'] if field in request.data}

        if shop_data:
            serializer = RationShopProfileSerializer(shop, data=shop_data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response(RationShopProfileSerializer(shop, context={'request': request}).data)

class SubAdminProfilePictureUpload(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        shop = get_object_or_404(RationShop, owner=request.user)
        
        if 'image' not in request.FILES:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

        # Deactivate existing profile picture if any
        ShopImage.objects.filter(
            shop=shop,
            image_type='PROFILE',
            is_active=True
        ).update(is_active=False)

        # Add new profile picture
        ShopImage.objects.create(
            shop=shop,
            image=request.FILES['image'],
            image_type='PROFILE',
            is_active=True
        )

        serializer = RationShopProfileSerializer(shop, context={'request': request})
        return Response(serializer.data)

class SubAdminShopImageUpload(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        shop = get_object_or_404(RationShop, owner=request.user)
        
        if 'image' not in request.FILES:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

        if shop.images.filter(image_type='SHOP', is_active=True).count() >= 3:
            return Response({'error': 'Maximum 3 shop images allowed'}, status=status.HTTP_400_BAD_REQUEST)

        ShopImage.objects.create(
            shop=shop,
            image=request.FILES['image'],
            image_type='SHOP',
            is_active=True
        )

        serializer = RationShopProfileSerializer(shop, context={'request': request})
        return Response(serializer.data)

class SubAdminShopImageDelete(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, image_id):
        shop = get_object_or_404(RationShop, owner=request.user)
        image = get_object_or_404(ShopImage, id=image_id, shop=shop)
        
        image.is_active = False
        image.save()

        serializer = RationShopProfileSerializer(shop, context={'request': request})
        return Response(serializer.data)
























































# class SubAdminProfileView(APIView):
#     permission_classes = [IsAuthenticated]
#     parser_classes = (MultiPartParser, FormParser)

#     def get(self, request):
#         shop = get_object_or_404(RationShop, owner=request.user)
#         serializer = RationShopProfileSerializer(shop, context={'request':request})
#         return Response(serializer.data)
    
#     def patch(self, request):
#         # Update user's owner name if provided
#         if 'owner_name' in request.data:
#             sub_admin = request.user
#             sub_admin.owner_name = request.data['owner_name']
#             sub_admin.save()
        
#          # Update shop details if provided
#         shop = get_object_or_404(RationShop, owner=request.user)
#         shop_data = {field: request.data[field] for field in ['shopName', 'shopDescription', 'location', 'isOpen'] if field in request.data}

#         if shop_data:
#             serializer = RationShopProfileSerializer(shop, data=shop_data, partial=True, context={'request': request})
#             if serializer.is_valid():
#                 serializer.save()
#             else:
#                 return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#         # Return updated shop profile data
#         return Response(RationShopProfileSerializer(shop, context={'request': request}).data)
    
#     @action(detail=False, methods=['POST'])
#     def upload_profile_picture(self, request):
#         shop = get_object_or_404(RationShop, owner=request.user)
        
#         if 'image' not in request.FILES:
#             return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

#         # Deactivate existing profile picture if any
#         ShopImage.objects.filter(
#             shop=shop,
#             image_type='PROFILE',
#             is_active=True
#         ).update(is_active=False)

#         # Add new profile picture
#         ShopImage.objects.create(
#             shop=shop,
#             image=request.FILES['image'],
#             image_type='PROFILE',
#             is_active=True
#         )

#         # Return updated profile data
#         serializer = RationShopProfileSerializer(shop, context={'request': request})
#         return Response(serializer.data)
    
#     @action(detail=False, methods=['POST'])
#     def upload_shop_image(self, request):
#         shop = get_object_or_404(RationShop, owner=request.user)
        
#         if 'image' not in request.FILES:
#             return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

#         # Ensure the limit of 3 active shop images
#         if shop.images.filter(image_type='SHOP', is_active=True).count() >= 3:
#             return Response({'error': 'Maximum 3 shop images allowed'}, status=status.HTTP_400_BAD_REQUEST)

#         # Create a new shop image
#         ShopImage.objects.create(
#             shop=shop,
#             image=request.FILES['image'],
#             image_type='SHOP',
#             is_active=True
#         )

#         # Return updated shop data
#         serializer = RationShopProfileSerializer(shop, context={'request': request})
#         return Response(serializer.data)
    
#     @action(detail=False, methods=['DELETE'])
#     def delete_shop_image(self, request, image_id):
#         shop = get_object_or_404(RationShop, owner=request.user)
#         image = get_object_or_404(ShopImage, id=image_id, shop=shop)
        
#         # Mark image as inactive
#         image.is_active = False
#         image.save()

#         # Return updated shop data
#         serializer = RationShopProfileSerializer(shop, context={'request': request})
#         return Response(serializer.data)