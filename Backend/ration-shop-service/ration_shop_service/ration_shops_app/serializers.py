from rest_framework import serializers
from .models import RationShop, AdminAuth, SubAdminAuth, ShopImage

class ShopImageSerializer(serializers.ModelSerializer):
    """Serializer for the ShopImage model."""
    class Meta:
        model = ShopImage
        fields = ['id', 'image', 'image_type', 'is_active']


class SubAdminSerializer(serializers.ModelSerializer):
    """Simple serializer for SubAdmin to represent in dropdowns."""
    value = serializers.CharField(source='sub_admin_id')
    label = serializers.CharField(source='email')

    class Meta:
        model = SubAdminAuth
        fields = ['value', 'label']
        

class SubAdminProfileSerializer(serializers.ModelSerializer):
    """Serializer for displaying and updating sub-admin profile details."""

    email = serializers.EmailField(read_only=True)
    owner_name = serializers.CharField(required=False, allow_null=True)

    class Meta:
        model = SubAdminAuth
        fields = ['sub_admin_id', 'email', 'owner_name']

    def update(self, instance, validated_data):
        """Update the owner_name field"""

        instance.owner_name = validated_data.get('owner_name', instance.owner_name)
        instance.save()
        return instance

class RationShopSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating RationShop basic details."""

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

class RationShopProfileSerializer(serializers.ModelSerializer):
    """Extended serializer for detailed RationShop profile view, including images and owner details."""
    shopName = serializers.CharField(source='name')
    shopDescription = serializers.CharField(source='description', required=False, allow_blank=True)
    isOpen = serializers.BooleanField(source='is_open')
    profile_picture = serializers.SerializerMethodField()
    shop_images = serializers.SerializerMethodField()
    owner_details = SubAdminProfileSerializer(source='owner', read_only=True)
    ownerName = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = RationShop
        fields = [
            'shop_id', 'shopName', 'shopDescription', 'location', 
            'isOpen', 'profile_picture', 'shop_images', 'owner_details',
            'ownerName'
        ]
    
    
    def update(self, instance, validated_data):
        """Updates shop details for fields that are allowed to change."""

        owner_name = validated_data.pop('ownerName', None)
        if owner_name and instance.owner:
            instance.owner.owner_name = owner_name
            instance.owner.save()


        if 'name' in validated_data:
            instance.name = validated_data['name']
        if 'description' in validated_data:
            instance.description = validated_data['description']
        if 'location' in validated_data:
            instance.location = validated_data['location']
        if 'is_open' in validated_data:
            instance.is_open = validated_data['is_open']
        
        instance.save()
        return instance
    

    def get_profile_picture(self, obj):
        """Fetches the active profile picture URL for the shop, if available."""
        profile_pic = obj.images.filter(image_type='PROFILE', is_active=True).first()
        if profile_pic:
            return {
                'id': profile_pic.id,
                'url': self.context['request'].build_absolute_uri(profile_pic.image.url)
            }
        return None
    
    def get_shop_images(self, obj):
        """Fetches active shop image URLs for the shop."""
        shop_images = obj.images.filter(image_type='SHOP', is_active=True)
        return [
            {
                'id': img.id,
                'url': self.context['request'].build_absolute_uri(img.image.url)
            }
            for img in shop_images
        ]

class PublicShopDisplaySerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.owner_name')
    profile_image = serializers.SerializerMethodField()
    shop_images = serializers.SerializerMethodField()

    class Meta:
        model = RationShop
        fields = [
            'shop_id', 
            'name',
            'location',
            'description',
            'is_open',
            'mobile_number',
            'owner_name',
            'profile_image',
            'shop_images'
        ]

    def get_profile_image(self, obj):
        profile_pic = obj.images.filter(
            image_type='PROFILE', 
            is_active=True
        ).first()
        if profile_pic:
            return self.context['request'].build_absolute_uri(
                profile_pic.image.url
            )
        return None
    
    def get_shop_images(self, obj):
        shop_images = obj.images.filter(
            image_type='SHOP',
            is_active=True
        )
        return [
            self.context['request'].build_absolute_uri(img.image.url)
            for img in shop_images
        ]