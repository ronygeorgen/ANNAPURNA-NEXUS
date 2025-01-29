from django.apps import AppConfig


class UsersAdminsAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users_admins_app'

    def ready(self):
        import users_admins_app.signals