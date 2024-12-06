from django.core.management.base import BaseCommand
from users_admins_app.models import Account
from users_admins_app.signals import publish_user_event


class Command(BaseCommand):
    help = 'Sync existing sub-admins to Kafka'

    def handle(self, *args, **options):
        self.stdout.write('Starting to sync existing sub-admins...')
        
        sub_admins = Account.objects.filter(is_subadmin=True, is_superadmin=True)
        total = sub_admins.count()
        
        for index, sub_admin in enumerate(sub_admins, 1):
            try:
                user_data = {
                    'id': sub_admin.id,
                    'email': sub_admin.email,
                    'is_active': sub_admin.is_active,
                    'is_subadmin': sub_admin.is_subadmin,
                    'is_superadmin': sub_admin.is_superadmin,
                    'created_at': sub_admin.date_joined.isoformat()
                }
                
                # Use the existing publish function with 'sub_admin_created' event
                publish_user_event('sub_admin_created', user_data)
                
                self.stdout.write(f'Synced sub-admin {index}/{total}: {sub_admin.email}')
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Failed to sync sub-admin {sub_admin.email}: {str(e)}'
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully synced {total} sub-admins')
        )