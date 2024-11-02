from django.db import models

class AdminAuth(models.Model):
    admin_id = models.IntegerField(unique=True)
    email = models.EmailField(unique=True)
    auth_token = models.CharField(max_length=255)
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
    auth_token = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.email

class RationShop(models.Model):
    shop_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)  # Changed from shopName for consistency
    owner = models.ForeignKey(SubAdminAuth, on_delete=models.SET_NULL, null=True, related_name="shops_owned")
    mobile_number = models.CharField(max_length=15)  # Changed from mobileNumber for consistency
    location = models.CharField(max_length=255)  # Changed from location for consistency
    created_by = models.ForeignKey(AdminAuth, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name