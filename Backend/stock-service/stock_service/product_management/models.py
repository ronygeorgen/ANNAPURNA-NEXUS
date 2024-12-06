from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from enum import Enum
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

KERALA_CARD_TYPES = [
    ('antyodaya', 'Antyodaya Anna Yojana (AAY)'),
    ('priority_household', 'Priority Household (PHH)'),
    ('non_priority_household', 'Non-Priority Household (NPHH)'),
    ('antodaya_anna_scheme', 'Antodaya Anna Scheme'),
    ('anna_poorana_scheme', 'Anna Poorana Scheme')
]

QUOTA_CATEGORIES = [
    ('regular', 'Regular Quota'),
    ('additional', 'Additional Quota')
]

UNIT_CHOICES = [
    ('kg', 'Kilogram'), 
    ('litre', 'Litre'), 
    ('gm', 'Gram')
]

class CardType(models.Model):
    name = models.CharField(
        max_length=50, 
        unique=True, 
        choices=KERALA_CARD_TYPES,
        help_text="Select the type of ration card from Kerala's official categories"
    )
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.get_name_display()

class Category(models.Model):
    name = models.CharField(
        max_length=20,
        choices=QUOTA_CATEGORIES,
        unique=True,
        help_text="Select either Regular Quota or Additional Quota."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.get_name_display()

class Item(models.Model):
    name = models.CharField(max_length=100, unique=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="items")
    unit = models.CharField(
        max_length=20,
        choices=UNIT_CHOICES,
        default='kg'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.category.get_name_display()})"

class Quota(models.Model):
    card_type = models.ForeignKey(CardType, on_delete=models.CASCADE, related_name="quotas")
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="quotas")
    max_quantity = models.FloatField(
        help_text="Maximum quantity allowed for this item.",
        validators=[MinValueValidator(0)]
    )
    price_per_unit = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        help_text="Price per kg/litre/gram.",
        validators=[MinValueValidator(0)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('card_type', 'item')
        verbose_name_plural = "Quotas"

    def __str__(self):
        return f"{self.card_type.name} - {self.item.name}"

class ShopStock(models.Model):
    shop_id = models.CharField(max_length=100, help_text="Unique identifier of the ration shop.")
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="shop_stocks")
    total_quantity = models.FloatField(
        help_text="Total stock assigned to the ration shop.",
        validators=[MinValueValidator(0)]
    )
    remaining_quantity = models.FloatField(
        help_text="Remaining stock after distribution.",
        validators=[MinValueValidator(0)]
    )
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('shop_id', 'item')

    def __str__(self):
        return f"Shop ID: {self.shop_id} - {self.item.name}"