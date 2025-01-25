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
import cloudinary
from cloudinary.exceptions import Error as CloudinaryError
from .services import MapboxGeocoder
from math import radians, sin, cos, sqrt, atan2

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

                    # Geocode location
                    location = serializer.validated_data.get('location')
                    latitude, longitude = MapboxGeocoder.get_coordinates(location)

                    serializer.validated_data['latitude'] = latitude
                    serializer.validated_data['longitude'] = longitude
                    
                    # Let the serializer handle owner assignment
                    shop = serializer.save(created_by=admin)
                    
                    return Response({
                        'message': 'Ration shop created successfully!',
                        'shop': {
                            'id': shop.shop_id,
                            'name': shop.name,
                            'location': shop.location,
                            'latitude': shop.latitude,
                            'longitude': shop.longitude,
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

    def post(self, request):
        shop = get_object_or_404(RationShop, owner=request.user)
        cloudinary_url = request.data.get('profile_picture')
        cloudinary_public_id = request.data.get('cloudinary_public_id')
        
        if not cloudinary_url:
            return Response({'error': 'No image URL provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        shop.images.filter(image_type='PROFILE', is_active=True).update(is_active=False)

        # Add new profile picture
        profile_image = ShopImage.objects.create(
            shop=shop,
            image=cloudinary_url,
            cloudinary_public_id=cloudinary_public_id,
            image_type='PROFILE',
            is_active=True
        )

        
        return Response({
            'id': profile_image.id,
            'url': cloudinary_url
        })

class SubAdminShopImageUpload(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]
    # parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        shop = get_object_or_404(RationShop, owner=request.user)
        cloudinary_url = request.data.get('image_url')
        cloudinary_public_id = request.data.get('cloudinary_public_id')
        
        if not cloudinary_url:
            return Response({'error': 'No image URL provided'}, status=status.HTTP_400_BAD_REQUEST)

        if shop.images.filter(image_type='SHOP', is_active=True).count() >= 3:
            return Response({'error': 'Maximum 3 shop images allowed'}, status=status.HTTP_400_BAD_REQUEST)

   

        shop_image = ShopImage.objects.create(
            shop=shop,
            image=cloudinary_url,
            cloudinary_public_id=cloudinary_public_id,
            image_type='SHOP',
            is_active=True
        )

        return Response({
            'id': shop_image.id,
            'url': cloudinary_url
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
    

# class ShopDisplayAtUser(APIView):
#     authentication_classes = [UserJWTAuthentication]

#     def get(self, request):
#         try:
#             shops = RationShop.objects.filter(
#                 is_active=True
#                 ).select_related('owner').prefetch_related(
#                     models.Prefetch(
#                         'images',
#                         queryset=ShopImage.objects.filter(is_active=True)
#                     )
#                 )
            
#             serializer = PublicShopDisplaySerializer(
#                 shops,
#                 many=True,
#                 context={'request':request}
#             )
#             return Response(serializer.data)
#         except Exception as e:
#             return Response(
#                 {'error': str(e)}, 
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )



class ShopDisplayAtUser(APIView):
    authentication_classes = [UserJWTAuthentication]

    def haversine_distance(self, lat1, lon1, lat2, lon2):
        R = 6371.0  # Earth radius in kilometers
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        return R * c

    def get(self, request):
        try:
            # Get user's location from query params
            user_lat = request.query_params.get('latitude')
            user_lon = request.query_params.get('longitude')
            print('user_lat:',user_lat)
            print('user_lon:',user_lon)
            max_distance = float(request.query_params.get('max_distance', 10))

            # Base query with existing prefetching
            shops = RationShop.objects.filter(
                is_active=True
            ).select_related('owner').prefetch_related(
                models.Prefetch(
                    'images',
                    queryset=ShopImage.objects.filter(is_active=True)
                )
            )

            # If location provided, filter by distance
            if user_lat and user_lon:
                nearby_shops = []
                for shop in shops:
                    if shop.latitude and shop.longitude:
                        distance = self.haversine_distance(
                            float(user_lat), float(user_lon), 
                            float(shop.latitude), float(shop.longitude)
                        )
                        
                        if distance <= max_distance:
                            nearby_shops.append(shop)
                
                # Serialize only nearby shops
                serializer = PublicShopDisplaySerializer(
                    nearby_shops,
                    many=True,
                    context={'request': request, 'user_distance': True}
                )
            else:
                # If no location, return all shops
                serializer = PublicShopDisplaySerializer(
                    shops,
                    many=True,
                    context={'request': request}
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

