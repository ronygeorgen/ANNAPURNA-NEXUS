# ration-shop-service
from pickle import TRUE
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from ration_shops_app.models import SubAdminAuth, RationShop, ShopImage
from stocks_app.models import Quota, ShopStock, Item
import face_recognition
import numpy as np

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
    face_encoding = models.BinaryField(null=True, blank=True)
    face_image = models.ImageField(upload_to='face_images/', null=True, blank=True)
    additional_details = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.get_relation_display()}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Call generate_face_encoding if face_image is present
        if self.face_image and not self.face_encoding:
            self.generate_face_encoding()
            super().save(update_fields=['face_encoding'])

    def generate_face_encoding(self):
        """
        Generate and save face encoding when image is uploaded
        """
        if self.face_image:
            # Load the image
            image = face_recognition.load_image_file(self.face_image.path)
            
            # Detect face encodings
            face_encodings = face_recognition.face_encodings(image)
            
            # If a face is found
            if face_encodings:
                # Convert to binary for storage
                self.face_encoding = face_encodings[0].tobytes()
                self.save()
        
        return self.face_encoding

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
    max_quantities = models.IntegerField(
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


    def calculate_family_size(self):
        """
        Calculate total family members including the head 
        of the family
        """
        return self.family_members.count() + 1  
    
    def get_max_allowed_quantity(self, item, month=None, year=None):
        """
        Calculate maximum allowed quantity based on family size
        and predefined quota for a specific month and year
        """
        # If month and year not provided, use current month and year
        if month is None:
            month = timezone.now().month
        if year is None:
            year = timezone.now().year

        try:
            # Find the existing quota for this card type, item, month, and year
            quota = Quota.objects.get(
                card_type=self.card_type, 
                item=item,
                month=month,
                year=year
            )
            
            # Calculate max quantity
            max_quantity = self.calculate_family_size() * quota.max_quantity
            return max_quantity
        except Quota.DoesNotExist:
            return 0
    
    

class QuotaAllocation(models.Model):
    """
    Track quota allocations for each ration card
    """
    ration_card = models.ForeignKey(RationCard, on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    quota = models.ForeignKey(Quota, on_delete=models.CASCADE)
    allocated_quantity = models.FloatField(validators=[MinValueValidator(0)])
    remaining_quantity = models.FloatField(validators=[MinValueValidator(0)], blank=True, null=True)
    allocated_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('ration_card', 'item', 'quota')

    def save(self, *args, **kwargs):
        """
        Custom save method to update shop stock when quota is allocated
        """
        # Check if this is a new allocation
        is_new_allocation = self.pk is None
        
        if is_new_allocation:
            # Find the shop associated with this ration card
            shop = self.ration_card.registered_shop
            
            # Find or create shop stock for this item
            shop_stock, created = ShopStock.objects.get_or_create(
                shop_id=shop,
                item=self.item,
                defaults={
                    'total_quantity': self.allocated_quantity,
                    'remaining_quantity': self.allocated_quantity
                }
            )
            
            # If not a new stock, update existing stock
            if not created:
                shop_stock.total_quantity += self.allocated_quantity
                shop_stock.remaining_quantity += self.allocated_quantity
                shop_stock.save()
        
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
