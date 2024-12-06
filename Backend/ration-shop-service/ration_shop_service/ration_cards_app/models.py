# ration-shop-service
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

from ration_shops_app.models import SubAdminAuth, RationShop, ShopImage

KERALA_CARD_TYPES = [
    ('antyodaya', 'Antyodaya Anna Yojana (AAY)'),
    ('priority_household', 'Priority Household (PHH)'),
    ('non_priority_household', 'Non-Priority Household (NPHH)'),
    ('antodaya_anna_scheme', 'Antodaya Anna Scheme'),
    ('anna_poorana_scheme', 'Anna Poorana Scheme')
]

CARD_COLORS = [
    ('YELLOW', 'AAY Card - Yellow'),
    ('PINK', 'Priority Card - Pink'),
    ('BLUE', 'Non-Priority Subsidy Card - Blue'),
    ('WHITE', 'Non-Priority Card - White')
]




class CardType(models.Model):
    """Model to store different types of ration cards"""

    name = models.CharField(
        max_length=50, 
        unique=True, 
        choices=KERALA_CARD_TYPES,
        help_text="Select the type of ration card from Kerala's official categories"
    )
    color_code = models.CharField(max_length=10, choices=CARD_COLORS)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_color_code_display()}"

class FamilyMember(models.Model):
    """Model to store family member details"""
    RELATION_CHOICES = [
        ('SELF', 'Self'),
        ('SPOUSE', 'Spouse'),
        ('CHILD', 'Child'),
        ('PARENT', 'Parent'),
        ('SIBLING', 'Sibling'),
        ('OTHER', 'Other')
    ]

    name = models.CharField(max_length=255)
    age = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(150)])
    relation = models.CharField(max_length=10, choices=RELATION_CHOICES)
    aadhaar_number = models.CharField(max_length=20, unique=True)
    is_active = models.BooleanField(default=True)
    additional_details = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.get_relation_display()}"

class RationCard(models.Model):
    """Main model for Ration Card"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending for Shop Verification'),
        ('SHOP_VERIFIED', 'Verified by Shop'),
        ('SHOP_REJECTED', 'Rejected by Shop'),
        ('ADMIN_APPROVED', 'Approved by Admin'),
        ('ADMIN_REJECTED', 'Rejected by Admin'),
        ('INACTIVE', 'Inactive')
    ]

    # Card Details
    card_number = models.CharField(max_length=20, unique=True)
    card_type = models.ForeignKey(CardType, on_delete=models.PROTECT, null=True, blank=True)

    requester_id = models.CharField(max_length=100, help_text="User ID from JWT token")
    requester_email = models.EmailField(help_text="User email from JWT token")
    
    # Household Details
    household_address = models.TextField()
    head_name = models.CharField(max_length=255)
    head_age = models.IntegerField(validators=[MinValueValidator(18), MaxValueValidator(150)])
    head_monthly_income = models.DecimalField(max_digits=10, decimal_places=2)
    head_aadhaar = models.CharField(max_length=12, unique=True)
    
    # Family Members
    family_members = models.ManyToManyField(FamilyMember, related_name='ration_cards')
    
    # Shop and Admin Relations
    registered_shop = models.ForeignKey(
        RationShop,
        on_delete=models.PROTECT,
        related_name='registered_cards'
    )
    
    # Status and Verification
    status = models.CharField(max_length=15, default='PENDING')
    shop_verified_by = models.ForeignKey(
        RationShop,
        on_delete=models.SET_NULL,
        null=True,
        related_name='shop_verified_cards'
    )
    shop_verified_at = models.DateTimeField(null=True, blank=True)
    shop_verification_notes = models.TextField(null=True, blank=True)
    
    admin_verified_by = models.ForeignKey(
        SubAdminAuth,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admin_verified_cards'
    )
    admin_verified_at = models.DateTimeField(null=True, blank=True)
    admin_verification_notes = models.TextField(null=True, blank=True)
    
    # Documents
    supporting_document = models.FileField(
        upload_to='ration_card_documents/',
        help_text='Upload supporting documents (PDF/Images)'
    )
    max_quantities = models.JSONField(
        null=True, 
        blank=True, 
        help_text="JSON field to store maximum quantities for different items"
    )
    
    # Metadata
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['card_number']),
            models.Index(fields=['head_aadhaar']),
            models.Index(fields=['status']),
            models.Index(fields=['requester_id']),
        ]

    def __str__(self):
        return f"{self.card_number} - {self.head_name}"
    
    def calculate_max_quantities(self):
        """
        Dynamically calculate maximum quantities for different items based on card type and family members
        
        Returns a structured dictionary with detailed item information
        """
        if not self.card_type:
            return {}

        # Total number of family members (including head of family)
        total_family_members = self.family_members.count() + 1

        # Initialize max quantities dictionary
        max_quantities = {
            'regular': {},
            'additional': {}
        }

        # Query stock service items for the specific card type
        stock_items = DataFromSrockService.objects.filter(
            card_type_name=self.card_type.name
        )

        for item in stock_items:
            # Calculate maximum quantity based on total family members
            max_quantity = total_family_members * item.max_quantity_per_person

            # Determine item category (regular or additional)
            category = 'regular' if 'regular' in item.item_category.lower() else 'additional'

            # Store detailed item information
            item_details = {
                'item_name': item.item_name,
                'max_quantity': max_quantity,
                'max_quantity_per_person': item.max_quantity_per_person,
                'price_per_unit': float(item.price_per_unit),
                'unit': 'kg',  # You can make this dynamic if needed
                'item_category': item.item_category
            }

            # Add to the appropriate category
            max_quantities[category][item.item_name] = item_details

        return max_quantities

    def save(self, *args, **kwargs):
    # Ensure max_quantities are always calculated when saving
        if self.card_type:
            self.max_quantities = self.calculate_max_quantities()

        # If status changes to ADMIN_APPROVED, update status to ACTIVE
        # if self.status == 'ADMIN_APPROVED':
        #     self.status = 'ACTIVE'
        
        super().save(*args, **kwargs)

#  additional model details
class DataFromSrockService(models.Model):
    card_type_name = models.CharField(max_length=50, blank=True, null=True)
    item_category = models.CharField(max_length=100, blank=True, null=True)
    item_name = models.CharField(max_length=100, blank=True, null=True)
    max_quantity_per_person = models.FloatField(validators=[MinValueValidator(0)])
    price_per_unit = models.DecimalField(max_digits=10, 
        decimal_places=2, 
        help_text="Price per kg/litre/gram.",
        validators=[MinValueValidator(0)]
    )
