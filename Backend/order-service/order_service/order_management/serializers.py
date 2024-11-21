from rest_framework import serializers
from .models import Address, OrderItem, Payment, Order

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['first_name', 'last_name', 'mobile_number', 'address_line', 
                 'landmark', 'state', 'country', 'pincode']

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['item_name', 'quantity', 'total_price']

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['payment_method', 'payment_status', 'transaction_id', 'payment_id']

class OrderSerializer(serializers.ModelSerializer):
    address = AddressSerializer()
    order_items = OrderItemSerializer(many=True)
    payment = PaymentSerializer()

    class Meta:
        model = Order
        fields = ['order_id', 'user', 'shop', 'card', 'card_number', 'address',
                 'order_items', 'payment', 'total_amount', 'status']

    def create(self, validated_data):
        # Extract nested data
        address_data = validated_data.pop('address')
        order_items_data = validated_data.pop('order_items')
        payment_data = validated_data.pop('payment')

        # Create address
        address = Address.objects.create(**address_data)

        # Create payment
        payment = Payment.objects.create(**payment_data)

        # Create order
        order = Order.objects.create(
            address=address,
            payment=payment,
            **validated_data
        )

        # Create order items and associate with order
        for item_data in order_items_data:
            order_item = OrderItem.objects.create(**item_data)
            order.order_items.add(order_item)

        return order