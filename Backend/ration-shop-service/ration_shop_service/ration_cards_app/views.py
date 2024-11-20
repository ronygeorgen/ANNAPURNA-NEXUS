from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
import json
from rest_framework.permissions import IsAuthenticated
from .authentication import SubAdminJWTAuthentication
from ration_shops_app.models import RationShop
from .models import RationCard, FamilyMember, CardType
from .serializers import RationCardSerializer, FamilyMemberSerializer, RationCardRetrieveSerializer
from .authentication import UserJWTAuthentication


class RationCardRegistrationView(APIView):
    authentication_classes = [UserJWTAuthentication]
    parser_classes = (MultiPartParser, FormParser)
    
    @transaction.atomic
    def post(self, request, *args, **kwargs):
        try:
            
            jwt_payload = request.user
            # Extract and validate family members data
            family_members_data = json.loads(request.data.get('family_members', '[]'))
            
            # Create family members first
            family_members = []
            for member_data in family_members_data:
                serializer = FamilyMemberSerializer(data=member_data)
                if serializer.is_valid(raise_exception=True):
                    family_member = serializer.save()
                    family_members.append(family_member)
            
            shop_id = request.data.get('registered_shop')
            try:
                shop_instance = RationShop.objects.get(shop_id=shop_id)
            except RationShop.DoesNotExist:
                return Response({
                    'message': 'Invalid shop selected'
                }, status=status.HTTP_400_BAD_REQUEST)
            print('shoop instance in views: ',shop_instance)
            # Prepare ration card data
            card_data = {
                'head_name': request.data.get('head_name'),
                'head_age': request.data.get('head_age'),
                'head_monthly_income': request.data.get('head_monthly_income'),
                'head_aadhaar': request.data.get('head_aadhaar'),
                'household_address': request.data.get('household_address'),
                'registered_shop': shop_instance.shop_id,
                'requester_id': jwt_payload['user_id'],
                'requester_email': jwt_payload['email'],
                # 'supporting_document': request.FILES.get('supporting_document'),
                # Add any additional fields needed
            }

            # Add supporting document if provided
            if 'supporting_document' in request.FILES:
                card_data['supporting_document'] = request.FILES['supporting_document']
            
            # Create ration card
            card_serializer = RationCardSerializer(data=card_data)
            if card_serializer.is_valid(raise_exception=True):
                ration_card = card_serializer.save()
                
                # Add family members to the ration card
                ration_card.family_members.set(family_members)
                
                return Response({
                    'message': 'Ration card application submitted successfully',
                    'card_number': ration_card.card_number
                }, status=status.HTTP_201_CREATED)
                
        except json.JSONDecodeError:
            return Response({
                'message': 'Invalid family members data format'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Roll back transaction on error
            transaction.set_rollback(True)
            return Response({
                'message': 'Failed to create ration card',
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        

class RationCardListView(APIView):
    authentication_classes = [SubAdminJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            sub_admin = request.user
            
            # First check if the sub_admin has any active shops
            if not RationShop.objects.filter(owner=sub_admin, is_active=True).exists():
                return Response(
                    {'error': 'No active shops found for this sub-admin'}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            # Get ration cards for all shops owned by the sub-admin
            ration_cards = RationCard.objects.filter(
                registered_shop__owner=sub_admin,
                registered_shop__is_active=True,
                status__in=['PENDING', 'SHOP_VERIFIED', 'ADMIN_APPROVED', 'SHOP_REJECTED', 'ADMIN_REJECTED']
            ).select_related(
                'registered_shop',
                'card_type'
            ).prefetch_related(
                'family_members'
            ).order_by('-created_at')

            # Add filtering by status if provided in query params
            status_filter = request.query_params.get('status')
            if status_filter:
                ration_cards = ration_cards.filter(status=status_filter.upper())

            # Add filtering by shop if provided in query params
            shop_id = request.query_params.get('shop_id')
            if shop_id:
                ration_cards = ration_cards.filter(registered_shop__shop_id=shop_id)

            serializer = RationCardRetrieveSerializer(ration_cards, many=True)
            return Response({
                'count': ration_cards.count(),
                'results': serializer.data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {
                    'error': 'Failed to retrieve ration cards',
                    'details': str(e)
                }, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )