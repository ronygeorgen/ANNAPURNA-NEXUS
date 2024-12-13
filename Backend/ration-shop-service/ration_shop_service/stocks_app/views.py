from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import  Category, Item, Quota, ShopStock, RationShop
from ration_cards_app.models import CardType, RationCard, QuotaAllocation
from django.utils import timezone
from ration_cards_app.models import CardType
from .serializers import ProductManagementSerializer
from django.db.models import F
from stocks_app.authentication import UserJWTAuthenticationStock


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
                    month=timezone.now().month,
                    year=timezone.now().year,
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
                
                # Automatically allocate quota to existing approved ration cards
                self.auto_allocate_quota_to_existing_cards(card_type, item, quota)
                
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
    
    def auto_allocate_quota_to_existing_cards(self, card_type, item, quota):
        """
        Automatically allocate quota for a new item to all approved ration cards
        of the same card type
        """
        # Find all approved ration cards with this card type
        approved_cards = RationCard.objects.filter(
            card_type=card_type,
            status='ADMIN_APPROVED'
        )
        
        # Allocate quota for each approved card
        quota_allocations = []
        for card in approved_cards:
            # Calculate max quantity based on family size
            max_quantity = card.calculate_family_size() * quota.max_quantity
            
            # Check if quota allocation already exists
            existing_allocation = QuotaAllocation.objects.filter(
                ration_card=card,
                item=item,
                quota=quota
            ).first()
            
            if existing_allocation:
                # Update existing allocation
                existing_allocation.allocated_quantity = max_quantity
                existing_allocation.remaining_quantity = max_quantity
                existing_allocation.is_used = False
                existing_allocation.save()
            else:
                # Create new quota allocation
                quota_allocations.append(
                    QuotaAllocation(
                        ration_card=card,
                        item=item,
                        quota=quota,
                        allocated_quantity=max_quantity,
                        remaining_quantity=max_quantity,
                        is_used=False
                    )
                )
        
        # Bulk create new quota allocations
        if quota_allocations:
            QuotaAllocation.objects.bulk_create(quota_allocations)
    

class QuotaInfoView(APIView):
    permission_classes = [UserJWTAuthenticationStock]

    def get(self, request):
        # Get query parameters
        card_type = request.query_params.get('cardType')
        shop_id = request.query_params.get('shopId')
        card_number = request.query_params.get('cardNumber')

        try:
            # First, validate and fetch the RationCard
            try:
                ration_card = RationCard.objects.get(
                    card_number=card_number, 
                )
            except RationCard.DoesNotExist:
                return Response({
                    'error': 'Ration card not found'
                }, status=status.HTTP_404_NOT_FOUND)

            # Fetch Quota Allocations for this specific card
            quota_allocations = QuotaAllocation.objects.filter(
                ration_card=ration_card
            ).select_related(
                'item', 
                'item__category', 
                'quota'
            )

            # Prepare detailed quota information
            quota_info = []
            for allocation in quota_allocations:
                quota_info.append({
                    'item_name': allocation.item.name,
                    'item_unit': allocation.item.unit,
                    'category': allocation.item.category.get_name_display(),
                    'allocated_quantity': allocation.allocated_quantity,
                    'remaining_quantity':allocation.remaining_quantity,
                    'price_per_unit': allocation.quota.price_per_unit
                })

            # Separate into regular and additional quotas
            regular_quota = [
                item for item in quota_info 
                if item['category'] == 'Regular Quota'
            ]
            
            additional_quota = [
                item for item in quota_info 
                if item['category'] == 'Additional Quota'
            ]

            return Response({
                'regular_quota': regular_quota,
                'additional_quota': additional_quota
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)