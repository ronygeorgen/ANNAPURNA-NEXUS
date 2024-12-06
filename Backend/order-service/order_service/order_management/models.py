import uuid
from django.db import models

# Create your models here.

class Address(models.Model):
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    mobile_number = models.CharField(max_length=50)
    address_line = models.TextField()
    landmark = models.CharField(max_length=255, blank=True, null=True)
    state = models.CharField(max_length=50)
    country = models.CharField(max_length=50)
    pincode = models.CharField(max_length=10)

    def __str__(self):
        return f"{self.first_name} {self.last_name}, {self.pincode}"


class OrderItem(models.Model):
    item_name = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)  # price_per_unit * quantity

    def __str__(self):
        return f"{self.quantity} x {self.item_name}"


class Payment(models.Model):
    PAYMENT_CHOICES = [
        ('COD', 'Cash on Delivery'),
        ('PAYPAL', 'PayPal'),
        ('RAZORPAY', 'Razorpay'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    ]

    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='Pending')  # Pending, Success, Failed
    transaction_id = models.TextField(blank=True, null=True)  # For PayPal/Razorpay
    payment_id = models.CharField(max_length=20, default="")  # COD for Cash on Delivery

    def save(self, *args, **kwargs):
        # Automatically set payment_id to "COD" for Cash on Delivery
        if self.payment_method == 'COD':
            self.payment_id = 'COD'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.payment_method


class Order(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSED', 'Processed'),
        ('DELIVERED', 'Delivered'),
    ]
    order_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)  # Auto-generated Order ID
    user = models.CharField(max_length=255)  # Store username or email as a string
    shop = models.IntegerField()  # Store shop ID as an integer
    card_number = models.CharField(max_length=16, blank=True, null=True)  # Card number used for the transaction
    address = models.ForeignKey('Address', on_delete=models.CASCADE)  # Shipping address
    order_items = models.ManyToManyField(OrderItem)  # Items in the order
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE)  # Payment details
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)  # Grand total
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')  # Pending, Processed, Delivered

    def __str__(self):
        return f"Order {self.order_id} by {self.user}"
