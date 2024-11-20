from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

from ration_shops_app.models import SubAdminAuth, RationShop, ShopImage

# Create your models here.

class CardType(models.Model):
    """Model to store different types of ration cards"""
    CARD_COLORS = [
        ('YELLOW', 'AAY Card - Yellow'),
        ('PINK', 'Priority Card - Pink'),
        ('BLUE', 'Non-Priority Subsidy Card - Blue'),
        ('WHITE', 'Non-Priority Card - White')
    ]

    name = models.CharField(max_length=100)
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
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive')
    ]

    # Card Details
    card_number = models.CharField(max_length=20, unique=True)
    card_type = models.ForeignKey(CardType, on_delete=models.PROTECT, null=True, blank=True)

    # User Details (from JWT)
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
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    shop_verified_by = models.ForeignKey(
        SubAdminAuth,
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
        related_name='admin_verified_cards'
    )
    admin_verified_at = models.DateTimeField(null=True, blank=True)
    admin_verification_notes = models.TextField(null=True, blank=True)
    
    # Documents
    supporting_document = models.FileField(
        upload_to='ration_card_documents/',
        help_text='Upload supporting documents (PDF/Images)'
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

    def save(self, *args, **kwargs):
        # If status changes to ADMIN_APPROVED, update status to ACTIVE
        if self.status == 'ADMIN_APPROVED':
            self.status = 'ACTIVE'
        super().save(*args, **kwargs)