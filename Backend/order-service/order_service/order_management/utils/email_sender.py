from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

def send_order_confirmation_email(order, user_email):
    """
    Send order confirmation email to customer
    """
    subject = f'Order Confirmation - Order #{order.order_id}'
    
    # Prepare context for email template
    context = {
        'order': order,
        'order_items': order.order_items.all(),
        'address': order.address,
        'payment': order.payment,
        'total_amount': order.total_amount
    }
    
    # Render HTML email template
    html_message = render_to_string('emails/order_confirmation.html', context)
    
    # Send email
    try:
        send_mail(
            subject=subject,
            message='',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False