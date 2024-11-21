from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Order, Address, OrderItem, Payment
from .serializers import OrderSerializer, OrderItemSerializer, AddressSerializer, PaymentSerializer

class OrderCreateView(APIView):
    def post(self, request):
        
        serializer = OrderSerializer(data=request.data)
        if serializer.is_valid():
            try:
                order = serializer.save()
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

