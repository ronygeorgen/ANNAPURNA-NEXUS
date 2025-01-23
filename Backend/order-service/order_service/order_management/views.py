from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Order, Address, OrderItem, Payment
from .serializers import OrderSerializer, OrderItemSerializer, AddressSerializer, PaymentSerializer
import stripe
import environ
import json
from django.http import JsonResponse
from django.conf import settings
from django.db.models import Count, Sum
from rest_framework.exceptions import NotFound
from django.db import transaction
from .tasks import send_order_confirmation_email_task

env = environ.Env()

environ.Env.read_env()
stripe.api_key = env('STRIPE_API_KEY')

class OrderCreateView(APIView):
    def post(self, request):
        
        serializer = OrderSerializer(data=request.data)
        if serializer.is_valid():
            try:
                order = serializer.save()
                send_order_confirmation_email_task(str(order.order_id))

                return Response({
                    'message': 'Order created successfully',
                    'order_id': order.order_id,
                    'data': OrderSerializer(order).data
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({
                    'message': 'Failed to create order',
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OrderListView(APIView):
    def get(self, request):

        
        try:
            orders = Order.objects.all().order_by('-created_at')
            serializer = OrderSerializer(orders, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch orders', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OrderListSubAdminView(APIView):
    def get(self, request):
        try:
            shop_id = request.query_params.get('shop_id')
            
            try:
                orders = Order.objects.filter(shop=shop_id).order_by('-created_at')
                serializer = OrderSerializer(orders, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
            
            except Exception as e:
                return Response(
                    {'error': 'Failed to fetch orders', 'details': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OrderListUserView(APIView):
    def get(self, request):
        try:
            user_email = request.query_params.get('user_email')
            
            try:
                orders = Order.objects.filter(user=user_email).order_by('-created_at')
                serializer = OrderSerializer(orders, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
            
            except Exception as e:
                return Response(
                    {'error': 'Failed to fetch orders', 'details': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OrderListUserCardBasedView(APIView):
    def get(self, request):
        try:
            card_number = request.query_params.get('card_number')
            
            try:
                orders = Order.objects.filter(card_number=card_number).order_by('-created_at')
                serializer = OrderSerializer(orders, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
            
            except Exception as e:
                return Response(
                    {'error': 'Failed to fetch orders', 'details': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        


class StripeView(APIView):
    def post(self, request):
        stripe.api_key = settings.STRIPE_SECRET_KEY
        try:
            # Parse the request data
            data = request.data
            
            # Prepare line items from cart items
            line_items = []
            for item in data.get('order_items', []):
                line_items.append({
                    "price_data": {
                        "currency": "inr",
                        "product_data": {
                            "name": item['item_name'],
                        },
                        "unit_amount": int(item['unit_amount'] * 100),  # Convert to paisa
                    },
                    "quantity": item['quantity'],
                })

            # Create Stripe checkout session
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items= line_items,
                mode="payment",
                success_url="https://annapoornanexus.ronygeorge.online/home/selected-shop/choose-subsidies/checkout-page/success?session_id={CHECKOUT_SESSION_ID}", 
                cancel_url="https://annapoornanexus.ronygeorge.online/home/selected-shop/choose-subsidies/checkout-page/",  
                metadata={
                    'user': data.get('user', ''),
                    'userId': data.get('userId', ''),
                    'shop': data.get('shop', ''),
                    'card_number': data.get('card_number', ''),
                    'first_name': data.get('address', {}).get('first_name', ''),
                    'last_name': data.get('address', {}).get('last_name', ''),  
                    'mobile_number': data.get('address', {}).get('mobile_number', ''),
                    'address_line': data.get('address', {}).get('address_line', ''),
                    'landmark': data.get('address', {}).get('landmark', ''),
                    'state': data.get('address', {}).get('state', ''),
                    'country': data.get('address', {}).get('country', ''),
                    'pincode': data.get('address', {}).get('pincode', ''),
                    'order_items': str(data.get('order_items', [])),
                }
            )
            print('session iddd: ',session.id)
            
            return JsonResponse({"stripe_session_url": session.url, "stripe_session_id": session.id}, status=200)
        
        except Exception as e:
            return JsonResponse(
                {"error": "Stripe payment initialization failed", "details": str(e)},
                status=503,
            )
        
class StripeOrderSaveView(APIView):
    def post(self, request):
        stripe.api_key = settings.STRIPE_SECRET_KEY
        
        try:
            # Get session ID from frontend
            session_id = request.data.get('session_id')
            if not session_id:
                return Response({"status": "error", "message": "Session ID is missing"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Retrieve the Stripe Checkout Session
            session = stripe.checkout.Session.retrieve(session_id)
            
            # Check for existing order
            existing_order = Order.objects.filter(payment__transaction_id=session_id).first()
            if existing_order:
                serializer = OrderSerializer(existing_order)
                return Response({
                    'order_id': str(existing_order.order_id),
                    'status': 'success',
                    'message': 'Order already exists',
                    'amount_paid': existing_order.total_amount
                }, status=status.HTTP_200_OK)
            
            # Check payment status
            if session.payment_status != 'paid':
                return Response({
                    'status': 'payment_pending',
                    'message': 'Payment not confirmed'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Start transaction
            with transaction.atomic():
                # Extract order details from metadata
                order_data = session.metadata
                
                # Create address
                address_data = {
                    'first_name': order_data.get('first_name', ''),
                    'last_name': order_data.get('last_name', ''),
                    'mobile_number': order_data.get('mobile_number', ''),
                    'address_line': order_data.get('address_line', ''),
                    'landmark': order_data.get('landmark', ''),
                    'state': order_data.get('state', ''),
                    'country': order_data.get('country', ''),
                    'pincode': order_data.get('pincode', '')
                }
                address = Address.objects.create(**address_data)
                
                # Create payment
                payment_data = {
                    'payment_method': 'STRIPE',
                    'payment_status': 'SUCCESS',
                    'transaction_id': session_id,
                    'payment_id': 'STRIPE'
                }
                payment = Payment.objects.create(**payment_data)
                
                # Create order
                order = Order.objects.create(
                    user=order_data.get('user', ''),
                    userId=order_data.get('userId', ''),
                    shop=order_data.get('shop', 0),
                    card_number=order_data.get('card_number', ''),
                    address=address,
                    payment=payment,
                    total_amount=session.amount_total / 100,
                    status='PENDING'
                )
                
                # Create order items
                order_items_data = session.metadata.get('order_items', [])
                for item_data in eval(order_items_data):
                    order_item = OrderItem.objects.create(
                        item_name=item_data.get('item_name', ''),
                        quantity=item_data.get('quantity', 0),
                        total_price=item_data.get('total_price', 0)
                    )
                    order.order_items.add(order_item)

                send_order_confirmation_email_task(str(order.order_id))
                
                return Response({
                    'order_id': str(order.order_id),
                    'status': 'success',
                    'message': 'Order saved successfully',
                    'amount_paid': session.amount_total / 100
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        
class VerifyOrderStripe(APIView):
    def get(self, request, order_id):
        try:
            order = Order.objects.get(order_id=order_id)
            return Response({'order_id': order.order_id, 'amount_paid': order.total_amount}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'status':'error','message':str(e)}, status=status.HTTP_404_NOT_FOUND)


class OrderedProductsCountView(APIView):
    def get(self, request):
        total_products = OrderItem.objects.aggregate(
            total_count=Sum('quantity')
        )['total_count'] or 0

        return Response({
            'count': total_products
        })

class RevenueView(APIView):
    def get(self, request):
        total_revenue = Order.objects.all(
        ).aggregate(
            total_sales=Sum('total_amount')
        )['total_sales'] or 0
        print(total_revenue)
        return Response({
            'total': float(total_revenue)
        })
    

class SubAdminRevenueView(APIView):
    def get(self, request):
        shop_id = request.GET.get('shop_id')
        if not shop_id:
            return Response({'error': 'Shop ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            total_revenue = Order.objects.filter(
                shop=shop_id,
                status='PENDING'
            ).aggregate(
                total=Sum('total_amount')
            )['total'] or 0

            return Response({'total_revenue': total_revenue}, status=status.HTTP_200_OK)
        
        except Exception as e:
            # Return 0 instead of error for empty data
            return Response({'total_revenue': 0}, status=status.HTTP_200_OK)


class SubAdminOrdersView(APIView):
    def get(self, request):
        shop_id = request.GET.get('shop_id')
        if not shop_id:
            return Response({'error': 'Shop ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            orders = Order.objects.filter(shop=shop_id).order_by('-created_at')
            
            # Return empty list instead of 404
            orders_data = [{
                'order_id': str(order.order_id),
                'user': order.user,
                'total_amount': str(order.total_amount),
                'status': order.status,
                'created_at': order.created_at.isoformat(),
            } for order in orders] if orders.exists() else []

            return Response({'orders': orders_data}, status=status.HTTP_200_OK)

        except Exception as e:
            # Return empty list for any error
            return Response({'orders': []}, status=status.HTTP_200_OK)



# views.py - Modified to work with orders
class UserAddressesView(APIView):
    def get(self, request, user_email):
        try:
            # Get addresses through orders
            orders = Order.objects.filter(user=user_email)
            address_ids = orders.values_list('address', flat=True).distinct()
            
            # Get primary address first
            primary_address = Address.objects.filter(
                id__in=address_ids,
                is_primary=True
            ).first()
            
            # Get non-primary addresses
            other_addresses = Address.objects.filter(
                id__in=address_ids,
                is_primary=False
            ).order_by('-id')[:4]
            
            addresses = []
            if primary_address:
                addresses.append(primary_address)
            addresses.extend(other_addresses)
            
            serializer = AddressSerializer(addresses, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {"error": "Failed to fetch addresses", "details": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def post(self, request):
        try:
            data = request.data
            user_email = request.data.get('user')  # Get from request data

            # If setting as primary, unset existing primary addresses
            if data.get('is_primary'):
                # Get addresses through orders for this user
                orders = Order.objects.filter(user=user_email)
                address_ids = orders.values_list('address', flat=True).distinct()
                Address.objects.filter(
                    id__in=address_ids,
                    is_primary=True
                ).update(is_primary=False)

            serializer = AddressSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {"error": "Failed to create address", "details": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )