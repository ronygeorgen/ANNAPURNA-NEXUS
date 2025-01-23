from django.db import models
from cloudinary.models import CloudinaryField

class AdminAuth(models.Model):
    admin_id = models.IntegerField(unique=True)
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.email

    @property
    def is_authenticated(self):
        return True

class SubAdminAuth(models.Model):
    sub_admin_id = models.IntegerField(unique=True)
    email = models.EmailField(unique=True)
    owner_name = models.CharField(max_length=255, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_subadmin = models.BooleanField(null=True, blank=True)
    is_superadmin = models.BooleanField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.email
    @property
    def is_authenticated(self):
        return True

class RationShop(models.Model):
    shop_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)  
    owner = models.ForeignKey(SubAdminAuth, on_delete=models.SET_NULL, null=True, related_name="shops_owned")
    mobile_number = models.CharField(max_length=15)  
    location = models.CharField(max_length=255)  
    description = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_open = models.BooleanField(default=True)
    created_by = models.ForeignKey(SubAdminAuth, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class ShopImage(models.Model):
    IMAGE_TYPE_CHOICES = [
        ('PROFILE', 'Profile Picture'),
        ('SHOP', 'Shop Image')
    ]

    shop = models.ForeignKey(RationShop, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='shop_images/')
    image_type = models.CharField(max_length=10, choices=IMAGE_TYPE_CHOICES)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            # Ensure only one active profile picture per shop
            models.UniqueConstraint(
                fields=['shop'],
                condition=models.Q(image_type='PROFILE', is_active=True),
                name='unique_active_profile_picture'
            )
        ]

    def __str__(self):
        return f"{self.shop.name} - {self.image_type}"