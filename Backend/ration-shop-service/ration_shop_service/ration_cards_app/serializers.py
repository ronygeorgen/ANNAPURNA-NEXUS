from rest_framework import serializers
from .models import RationCard, FamilyMember, CardType
from ration_shops_app.models import RationShop

class FamilyMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyMember
        fields = ['name', 'age', 'relation', 'aadhaar_number', 'face_image_media', 'face_image']
        
    def validate_aadhaar_number(self, value):
        if len(value) != 12 or not value.isdigit():
            raise serializers.ValidationError("Aadhaar number must be exactly 12 digits")
        return value
    
    def create(self, validated_data):
            # Explicitly handle file upload
            face_image = validated_data.pop('face_image', None)
            instance = super().create(validated_data)

            if face_image:
                instance.face_image = face_image
                instance.save(update_fields=['face_image'])

            return instance

class RationShopSerializer(serializers.ModelSerializer):
    class Meta:
        model = RationShop
        fields = ['shop_id', 'name', 'location', 'is_active', 'is_open']

class CardTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CardType
        fields = ['name', 'color_code', 'description', 'is_active']


class RationCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = RationCard
        fields = [
            'card_number','household_address','status',
            'head_name', 'head_age', 'head_monthly_income',
            'head_aadhaar', 'mobile_number', 'supporting_document_media', 'supporting_document', 'registered_shop',
            'requester_id', 'requester_email', 'max_quantities','shop_verification_notes',
            'admin_verification_notes','admin_verified_at',
        ]
        read_only_fields = ['card_number','card_type']
        
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
    
    def get_max_quantities(self, obj):
        return obj.calculate_max_quantities()

class RationCardRetrieveSerializer(serializers.ModelSerializer):
    family_members = FamilyMemberSerializer(many=True, read_only=True)
    card_type = CardTypeSerializer(read_only=True)
    registered_shop = RationShopSerializer(read_only=True)
    status_display = serializers.SerializerMethodField()
    supporting_document_url = serializers.SerializerMethodField()
    
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
            'supporting_document_url',
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
    
    def get_supporting_document_url(self, obj):
        return obj.get_supporting_document_url()

class CardVerificationSerializer(serializers.ModelSerializer):
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
            'mobile_number',
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
            'ADMIN_REJECTED': 'Rejected by Admin',
            'ACTIVE': 'Active',
            'INACTIVE': 'Inactive'
        }
        return status_map.get(obj.status, obj.status)