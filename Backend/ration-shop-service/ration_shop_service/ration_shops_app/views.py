from django.shortcuts import get_object_or_404
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from django.db import transaction
from django.core.cache import cache
from .authentication import CookieJWTAuthentication, UserJWTAuthentication
from .permissions import IsAdmin
from .models import SubAdminAuth, RationShop, ShopImage
from .serializers import RationShopProfileSerializer, SubAdminSerializer, RationShopSerializer, PublicShopDisplaySerializer
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import models

class SubAdminListView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        sub_admins = SubAdminAuth.objects.filter(is_active=True, shops_owned__isnull=True)
        serializer = SubAdminSerializer(sub_admins, many=True)
        return Response(serializer.data)

class RationShopViewSet(ModelViewSet):
    serializer_class = RationShopSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    authentication_classes = [CookieJWTAuthentication]


    def get_queryset(self):
        return RationShop.objects.all()
    
    def create(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    # Get the admin from SubAdminAuth
                    admin = SubAdminAuth.objects.get(sub_admin_id=request.user.sub_admin_id)
                    
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
                return Response({
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)



class SubAdminProfileView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        shop = get_object_or_404(RationShop, owner=request.user)
        serializer = RationShopProfileSerializer(shop, context={'request':request})
        return Response(serializer.data)
    
    def patch(self, request):
        shop = get_object_or_404(RationShop, owner=request.user)
        print('request data in views:',request.data)
        serializer = RationShopProfileSerializer(shop, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        print("Validation errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class SubAdminProfilePictureUpload(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        shop = get_object_or_404(RationShop, owner=request.user)
        
        if 'image' not in request.FILES:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        shop.images.filter(image_type='PROFILE', is_active=True).update(is_active=False)

        # Add new profile picture
        profile_image = ShopImage.objects.create(
            shop=shop,
            image=request.FILES['image'],
            image_type='PROFILE',
            is_active=True
        )

        
        return Response({
            'id': profile_image.id,
            'url': request.build_absolute_uri(profile_image.image.url)
        })

class SubAdminShopImageUpload(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        shop = get_object_or_404(RationShop, owner=request.user)
        
        if 'image' not in request.FILES:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

        if shop.images.filter(image_type='SHOP', is_active=True).count() >= 3:
            return Response({'error': 'Maximum 3 shop images allowed'}, status=status.HTTP_400_BAD_REQUEST)

   

        shop_image = ShopImage.objects.create(
            shop=shop,
            image=request.FILES['image'],
            image_type='SHOP',
            is_active=True
        )

        return Response({
            'id': shop_image.id,
            'url': request.build_absolute_uri(shop_image.image.url)
        })

class SubAdminShopImageDelete(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, image_id):
        shop = get_object_or_404(RationShop, owner=request.user)
        image = get_object_or_404(ShopImage, id=image_id, shop=shop)
        
        image.is_active = False
        image.save()

        return Response({'id': image_id})
    

class ShopDisplayAtUser(APIView):
    authentication_classes = [UserJWTAuthentication]

    def get(self, request):
        try:
            shops = RationShop.objects.filter(
                is_active=True
                ).select_related('owner').prefetch_related(
                    models.Prefetch(
                        'images',
                        queryset=ShopImage.objects.filter(is_active=True)
                    )
                )
            
            serializer = PublicShopDisplaySerializer(
                shops,
                many=True,
                context={'request':request}
            )
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class GetShopIDandName(APIView):
    authentication_classes = [UserJWTAuthentication]

    def get(self, request):
        shops = RationShop.objects.filter(is_active=True).values('shop_id','name')
        return Response(shops)