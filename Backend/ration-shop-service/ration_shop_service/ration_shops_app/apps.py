from django.apps import AppConfig


class RationShopsAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ration_shops_app'

    # def ready(self):
    #     import ration_shops_app.signals