from celery import shared_task
from .utils.email_sender import send_order_confirmation_email

@shared_task
def send_order_confirmation_email_task(order_id):
    from .models import Order  # Import here to avoid circular imports
    try:
        order = Order.objects.get(order_id=order_id)
        send_order_confirmation_email(order, order.user)
    except Exception as e:
        print(f"Failed to send email for order {order_id}: {e}")