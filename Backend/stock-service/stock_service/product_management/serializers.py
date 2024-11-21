from rest_framework import serializers
from .models import CardType, Category, Item, KERALA_CARD_TYPES, QUOTA_CATEGORIES, UNIT_CHOICES


class ProductManagementSerializer(serializers.Serializer):
    cardType = serializers.ChoiceField(choices=[choice[0] for choice in KERALA_CARD_TYPES])
    shopId = serializers.CharField(max_length=100)
    itemName = serializers.CharField(max_length=100)
    itemCategory = serializers.ChoiceField(choices=[choice[0] for choice in QUOTA_CATEGORIES])
    itemUnit = serializers.ChoiceField(choices=[choice[0] for choice in UNIT_CHOICES])
    quotaMaxQuantity = serializers.FloatField(min_value=0)
    quotaPricePerUnit = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    totalQuantity = serializers.FloatField(min_value=0)