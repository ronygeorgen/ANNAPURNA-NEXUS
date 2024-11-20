from rest_framework import serializers
from .models import RationCard, FamilyMember, CardType
from ration_shops_app.models import RationShop

class FamilyMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyMember
        fields = ['name', 'age', 'relation', 'aadhaar_number']
        
    def validate_aadhaar_number(self, value):
        if len(value) != 12 or not value.isdigit():
            raise serializers.ValidationError("Aadhaar number must be exactly 12 digits")
        return value

class RationShopSerializer(serializers.ModelSerializer):
    class Meta:
        model = RationShop
        fields = ['shop_id', 'name', 'location', 'is_active', 'is_open']

class CardTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CardType
        fields = ['name', 'color_code', 'description']


class RationCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = RationCard
        fields = [
            'household_address',
            'head_name', 'head_age', 'head_monthly_income',
            'head_aadhaar', 'supporting_document', 'registered_shop',
            'requester_id', 'requester_email',
        ]
        read_only_fields = ['card_number','card_type', 'status']
        
    def validate_head_aadhaar(self, value):
        if len(value) != 12 or not value.isdigit():
            raise serializers.ValidationError("Aadhaar number must be exactly 12 digits")
        return value

    def validate_registered_shop(self, value):
        if not value:
            raise serializers.ValidationError("Registered shop is required")
        return value
        
    def create(self, validated_data):
        # Generate a unique card number (implement your logic here)
        validated_data['card_number'] = self.generate_card_number()
        # Set initial status
        validated_data['status'] = 'PENDING'
        return super().create(validated_data)
        
    def generate_card_number(self):
        # Implement your card number generation logic
        import random
        import string
        random_str = ''.join(random.choices(string.digits, k=10))
        return f"{random_str}"

class RationCardRetrieveSerializer(serializers.ModelSerializer):
    family_members = FamilyMemberSerializer(many=True, read_only=True)
    card_type = CardTypeSerializer(read_only=True)
    registered_shop = RationShopSerializer(read_only=True)
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = RationCard
        fields = [
            'id',
            'card_number',
            'card_type',
            'head_name',
            'head_age',
            'head_monthly_income',
            'head_aadhaar',
            'household_address',
            'status',
            'status_display',
            'requester_email',
            'registered_shop',
            'family_members',
            'created_at',
            'supporting_document',
            'shop_verification_notes',
            'admin_verification_notes'
        ]
    
    def get_status_display(self, obj):
        status_map = {
            'PENDING': 'Pending Verification',
            'SHOP_VERIFIED': 'Verified by Shop',
            'ADMIN_APPROVED': 'Approved',
            'SHOP_REJECTED': 'Rejected by Shop',
            'ADMIN_REJECTED': 'Rejected by Admin'
        }
        return status_map.get(obj.status, obj.status)