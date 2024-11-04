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
from .models import AdminAuth, SubAdminAuth, RationShop
from .serializers import SubAdminSerializer, RationShopSerializer

class SubAdminListView(APIView):
    authentication_classes = [AdminTokenAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        sub_admins = SubAdminAuth.objects.filter(is_active=True)
        serializer = SubAdminSerializer(sub_admins, many=True)
        return Response(serializer.data)

# views.py
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

