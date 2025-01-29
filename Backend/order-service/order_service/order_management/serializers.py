from rest_framework import serializers
from .models import Address, OrderItem, Payment, Order
from django.db.models import Q

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['first_name', 'last_name', 'mobile_number', 'address_line', 
                 'landmark', 'state', 'country', 'pincode', 'is_primary']

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
        fields = ['order_id','userId', 'user', 'shop', 'card_number', 'address',
                 'order_items', 'payment', 'total_amount', 'status']

    def create(self, validated_data):
        # Extract nested data
        address_data = validated_data.pop('address')
        order_items_data = validated_data.pop('order_items')
        payment_data = validated_data.pop('payment')

        is_primary = address_data.pop('is_primary', False)

        try:
            # Build query for exact address match
            address_query = Q(
                first_name=address_data['first_name'],
                last_name=address_data['last_name'],
                mobile_number=address_data['mobile_number'],
                address_line=address_data['address_line'],
                state=address_data['state'],
                country=address_data['country'],
                pincode=address_data['pincode']
            )

            # Get the most recent matching address if multiple exist
            existing_address = Address.objects.filter(address_query).order_by('-id').first()

            if existing_address:
                address = existing_address
                # Update landmark if provided and different
                if address_data.get('landmark') and address_data['landmark'] != address.landmark:
                    address.landmark = address_data['landmark']
                    address.save()
            else:
                # Create new address
                address = Address.objects.create(**address_data)

            # Handle primary address logic
            if is_primary:
                # Reset all other primary addresses for this user
                Address.objects.filter(
                    id__in=Order.objects.filter(user=validated_data['user']).values_list('address', flat=True)
                ).update(is_primary=False)
                address.is_primary = True
                address.save()

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

        except Exception as e:
            raise serializers.ValidationError(f"Failed to create order: {str(e)}")
    
    def to_representation(self, instance):
        try:
            representation = super().to_representation(instance)

            detailed_items = [
                {
                    'name': item.get('item_name', ''),
                    'quantity': item.get('quantity', 0),
                    'total_price': float(item.get('total_price', 0))
                } for item in representation.get('order_items', [])
            ]

            return {
                'id': str(representation.get('order_id', '')),
                'userId': representation.get('userId', ''),
                'shop': representation.get('shop',''),
                'card_number': representation.get('card_number',''),
                'name': representation.get('user', ''),
                'date': instance.created_at.strftime('%Y-%m-%d') if instance.created_at else '',
                'time': instance.created_at.strftime('%H:%M') if instance.created_at else '',
                'total': float(representation.get('total_amount', 0)),
                'status': representation.get('payment', {}).get('payment_status', ''),
                'mode': representation.get('payment', {}).get('payment_method', ''),
                'address': f"{representation.get('address', {}).get('address_line', '')}, {representation.get('address', {}).get('state', '')}, {representation.get('address', {}).get('country', '')}",
                'items': detailed_items,
            }
        except Exception as e:
            print(f"Error in to_representation: {e}")
            return {}