from rest_framework import serializers
from stocks_app.models import QUOTA_CATEGORIES, UNIT_CHOICES
from ration_cards_app.models import KERALA_CARD_TYPES
from ration_shops_app.models import RationShop

class ProductManagementSerializer(serializers.Serializer):
    cardType = serializers.ChoiceField(choices=[choice[0] for choice in KERALA_CARD_TYPES])
    shopId = serializers.PrimaryKeyRelatedField(
        queryset=RationShop.objects.all(), 
        source='shop', 
        help_text="Select the RationShop instance"
    )
    itemName = serializers.CharField(max_length=100)
    itemCategory = serializers.ChoiceField(choices=[choice[0] for choice in QUOTA_CATEGORIES])
    itemUnit = serializers.ChoiceField(choices=[choice[0] for choice in UNIT_CHOICES])
    quotaMaxQuantity = serializers.FloatField(min_value=0)
    quotaPricePerUnit = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    totalQuantity = serializers.FloatField(min_value=0)