from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
import json
from rest_framework.permissions import IsAuthenticated
from .authentication import SubAdminJWTAuthentication
from ration_shops_app.models import RationShop, SubAdminAuth
from .models import RationCard, FamilyMember, CardType
from .serializers import RationCardSerializer, FamilyMemberSerializer, RationCardRetrieveSerializer, CardVerificationSerializer, CardTypeSerializer
from .authentication import UserJWTAuthentication
from django.utils import timezone
from django.core.exceptions import ValidationError

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


class VerifyCardView(APIView):
    authentication_classes = [UserJWTAuthentication]

    def get(self, request, card_number, *args, **kwargs):
        if not card_number:
            return Response(
                {'message': 'Card number is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Get card details with related data
            card = RationCard.objects.select_related(
                'card_type',
                'registered_shop'
            ).get(
                card_number=card_number,
                is_active=True
            )
            
            # # Check if the card is in a valid status
            # valid_statuses = ['ACTIVE', 'ADMIN_APPROVED']
            # if card.status not in valid_statuses:
            #     return Response({
            #         'message': f'Card is {card.get_status_display()}. Not active for use.',
            #         'status': card.status,
            #         'status_display': card.get_status_display()
            #     }, status=status.HTTP_400_BAD_REQUEST)

            # Serialize and return card data
            serializer = CardVerificationSerializer(card)
            return Response(serializer.data)

        except RationCard.DoesNotExist:
            return Response(
                {'message': 'Invalid or inactive card number'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'message': 'An error occurred while verifying the card'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FetchCardForAdminView(APIView):
    authentication_classes = [SubAdminJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, shop_id, *args, **kwargs):
        try:
            
            # First check whether the shop is active
            if not RationShop.objects.filter(shop_id=shop_id, is_active=True).exists():
                return Response(
                    {'error': 'This shop is not active'}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            # Get ration cards for the shop
            ration_cards = RationCard.objects.filter(
                registered_shop__shop_id=shop_id,
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
        


class QuotaInfoView(APIView):
    def get(self, request):
        card_type = request.query_params.get('cardType', 'antyodaya')
        shop_id = request.query_params.get('shopId')

        # Retrieve the ration card
        try:
            ration_card = RationCard.objects.get(
                card_type__name=card_type,
                registered_shop_id=shop_id
            )
        except RationCard.DoesNotExist:
            return Response({
                'regular_quota': [],
                'additional_quota': []
            }, status=200)

        # Get max quantities
        max_quantities = ration_card.max_quantities or {}

        # Prepare response
        response_data = {
            'regular_quota': [],
            'additional_quota': []
        }

        # Transform max quantities into the format your frontend expects
        for category, items in max_quantities.items():
            quota_key = 'regular_quota' if category == 'regular' else 'additional_quota'
            
            for item_name, item_details in items.items():
                quota_item = {
                    'item_name': item_name,
                    'max_quantity': item_details['max_quantity'],
                    'price_per_unit': item_details['price_per_unit'],
                    'item_unit': item_details.get('unit', 'kg')
                }
                response_data[quota_key].append(quota_item)

        return Response(response_data)
    
class RationCardShopVerificationView(APIView):
    def patch(self, request, card_number):
        try:
            print(card_number)
            # Find the ration card
            ration_card = RationCard.objects.get(card_number=card_number)
            
            # Get shop verified by (sub admin)
            shop_id = request.data.get('shop_verified_by')
            print('sub admin id',shop_id)
            shop = RationShop.objects.get(shop_id=shop_id)
            
            # Update verification details
            ration_card.shop_verified_by = shop
            ration_card.shop_verification_notes = request.data.get('shop_verification_notes', '')
            ration_card.shop_verified_at = timezone.now()
            ration_card.status = 'SHOP_VERIFIED'
            
            # Validate and save
            ration_card.full_clean()
            ration_card.save()
            
            # Return updated card details
            return Response({
                'message': 'Card verified successfully',
                'card_number': ration_card.card_number,
                'status': ration_card.status
            }, status=200)
        
        except RationCard.DoesNotExist:
            return Response({'error': 'Card not found'}, status=404)
        
        except SubAdminAuth.DoesNotExist:
            return Response({'error': 'Invalid sub-admin'}, status=400)
        
        except ValidationError as e:
            return Response({'error': str(e)}, status=400)
        
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class FetchCardTypes(APIView):
    def get(self, request):
        try:
            card_types = CardType.objects.filter(is_active=True)
            serializer = CardTypeSerializer(card_types, many=True)
            return Response({'cardType': serializer.data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

        
class RationCardVerificationView(APIView):

    def patch(self, request, card_number):
        try:
            print('card number= ',card_number)
            # Fetch the ration card
            ration_card = RationCard.objects.get(card_number=card_number)

            # Get card type
            card_type_name = request.data.get('card_type')
            if card_type_name:
                card_type = CardType.objects.get(name=card_type_name)
                ration_card.card_type = card_type

            # Get admin details from request
            admin_email = request.data.get('admin_email')
            print(admin_email)
            
            try:
                # Find the SubAdminAuth corresponding to the email
                admin = SubAdminAuth.objects.get(email=admin_email)
                ration_card.admin_verified_by = admin
            except SubAdminAuth.DoesNotExist:
                return Response(
                    {'error': 'Admin not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            # Update verification details
            ration_card.status = request.data.get('status', 'ADMIN_APPROVED')
            ration_card.admin_verification_notes = request.data.get('admin_verification_notes', '')
            ration_card.admin_verified_at = timezone.now()

            ration_card.save()

            # Serialize and return updated card
            serializer = RationCardSerializer(ration_card)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except RationCard.DoesNotExist:
            return Response(
                {'error': 'Ration card not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except CardType.DoesNotExist:
            return Response(
                {'error': 'Invalid card type'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )