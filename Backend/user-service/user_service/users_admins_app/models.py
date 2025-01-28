from django.utils import timezone
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.contrib.auth.hashers import make_password
# Create your models here.

class MyAccountManager(BaseUserManager):
    def create_user(self, email, password= None):
        if not email:
            raise ValueError('User must have an email address')
        user = self.model(
            email = self.normalize_email(email)
        )
        user.password = make_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password):
        user = self.create_user(
            email = self.normalize_email(email),
            password = password,
        )
        user.is_subadmin = True
        user.is_superadmin = True
        user.is_user = True
        user.is_active = True
        user.save(using=self._db)
        return user

    def create_subuser(self, email, password):
        user = self.create_user(
            email = self.normalize_email(email),
            password = password,
        )
        user.is_subadmin = True
        user.is_user = True
        user.is_active = True
        user.save(using=self._db)
        return user
    
class Account(AbstractBaseUser):
    first_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50, blank=True)
    username = models.CharField(max_length=50, blank=True)
    email = models.EmailField(max_length=50, unique=True)
    phone_number = models.CharField(max_length=50, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    google_id = models.CharField(max_length=150, blank=True, null=True)
    email_verified = models.BooleanField(default=False)

    #required
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now_add=True)
    is_subadmin = models.BooleanField(default=False)
    is_superadmin = models.BooleanField(default=False)
    is_user = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = []
    
    objects = MyAccountManager()

class OTP(models.Model):
    user = models.ForeignKey(Account, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    attempts = models.IntegerField(default=0)
    
    def is_valid(self):
        time_diff = timezone.now() - self.created_at
        return time_diff.total_seconds() <= 120  # 2 minutes


class UserProfile(models.Model):
    user = models.OneToOneField(Account, on_delete=models.CASCADE)
    address_line1 = models.CharField(max_length=100, blank=True)
    address_line2 = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=50, blank=True)
    city = models.CharField(max_length=50, blank=True)
    state = models.CharField(max_length=50, blank=True)
    country = models.CharField(max_length=50, blank=True)
    profile_picture = models.ImageField(upload_to='user/profile_picture/', null=True, blank=True)

    def __str__(self):
        if self.user.first_name and self.user.last_name:
            return f"{self.user.first_name} {self.user.last_name}"
        else:
            return self.user.email
        

class RationShop(models.Model):
    shop_id = models.IntegerField(unique=True)
    name = models.CharField(max_length=255)  # Changed from shopName for consistency
    owner = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, related_name="shops_owned")
    mobile_number = models.CharField(max_length=15)  # Changed from mobileNumber for consistency
    location = models.CharField(max_length=255)  # Changed from location for consistency
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name