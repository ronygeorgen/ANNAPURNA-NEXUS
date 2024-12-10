from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import CardType, Category, Item, Quota, ShopStock, RationShop
from .serializers import ProductManagementSerializer
from django.db.models import F
from ration_shops_app.authentication import UserJWTAuthentication


class ProductManagementView(APIView):
    @transaction.atomic
    def post(self, request):
        serializer = ProductManagementSerializer(data=request.data)
        if serializer.is_valid():
            try:
                card_type = CardType.objects.get(name=serializer.validated_data['cardType'])
                category = Category.objects.get(name=serializer.validated_data['itemCategory'])
                
                # Create or get item
                item, created = Item.objects.get_or_create(
                    name=serializer.validated_data['itemName'],
                    category=category,
                    unit=serializer.validated_data['itemUnit']
                )
                
                # Create or update quota
                quota, quota_created = Quota.objects.get_or_create(
                    card_type=card_type,
                    item=item,
                    defaults={
                        'max_quantity': serializer.validated_data['quotaMaxQuantity'],
                        'price_per_unit': serializer.validated_data['quotaPricePerUnit']
                    }
                )
                
                if not quota_created:
                    quota.max_quantity = serializer.validated_data['quotaMaxQuantity']
                    quota.price_per_unit = serializer.validated_data['quotaPricePerUnit']
                    quota.save()
                
                # Create or update shop stock
                shop_stock, stock_created = ShopStock.objects.get_or_create(
                    shop_id=serializer.validated_data['shop'],

                    item=item,
                    defaults={
                        'total_quantity': serializer.validated_data['totalQuantity'],
                        'remaining_quantity': serializer.validated_data['totalQuantity']
                    }
                )
                
                if not stock_created:
                    shop_stock.total_quantity = serializer.validated_data['totalQuantity']
                    shop_stock.remaining_quantity = serializer.validated_data['totalQuantity']
                    shop_stock.save()
                
                return Response({
                    'message': 'Product management data submitted successfully',
                    'status': 'success'
                }, status=status.HTTP_201_CREATED)
            
            except Exception as e:
                return Response({
                    'message': str(e),
                    'status': 'error'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class QuotaInfoView(APIView):
    permission_classes = [UserJWTAuthentication]
    def get(self, request):
        # Get query parameters
        card_type = request.query_params.get('cardType')
        shop_id = request.query_params.get('shopId')

        try:
            
            # Fetch Regular Quota Items
            regular_quota = Quota.objects.filter(
                card_type__name=card_type,
                item__category__name='regular'
            ).annotate(
                item_name=F('item__name'),
                item_unit=F('item__unit')
            ).values(
                'item_name', 
                'item_unit', 
                'max_quantity', 
                'price_per_unit'
            )

            # Fetch Additional Quota Items
            additional_quota = Quota.objects.filter(
                card_type__name=card_type,
                item__category__name='additional'
            ).annotate(
                item_name=F('item__name'),
                item_unit=F('item__unit')
            ).values(
                'item_name', 
                'item_unit', 
                'max_quantity', 
                'price_per_unit'
            )

            return Response({
                'regular_quota': list(regular_quota),
                'additional_quota': list(additional_quota)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)