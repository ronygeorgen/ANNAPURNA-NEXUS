from rest_framework import serializers
from .models import RationShop, AdminAuth, SubAdminAuth

class RationShopSerializer(serializers.ModelSerializer):
    shopName = serializers.CharField(source='name')
    ownerId = serializers.IntegerField(write_only=True)
    mobileNumber = serializers.CharField(source='mobile_number')
    print('owner_id',ownerId)
    
    class Meta:
        model = RationShop
        fields = ['shop_id', 'shopName', 'ownerId', 'mobileNumber', 'location']

    def create(self, validated_data):
        owner_id = validated_data.pop('ownerId')
        name = validated_data.pop('name')
        mobile_number = validated_data.pop('mobile_number')
        created_by = validated_data.pop('created_by', None)

        try:
            owner = SubAdminAuth.objects.get(sub_admin_id=owner_id)
        except SubAdminAuth.DoesNotExist:
            raise serializers.ValidationError({'ownerId':'Invalid owner ID'})
        
        return RationShop.objects.create(
            name=name,
            owner=owner,
            mobile_number=mobile_number,
            created_by=created_by,
            **validated_data
        )

class SubAdminSerializer(serializers.ModelSerializer):
    value = serializers.CharField(source='sub_admin_id')
    label = serializers.CharField(source='email')

    class Meta:
        model = SubAdminAuth
        fields = ['value', 'label']
        