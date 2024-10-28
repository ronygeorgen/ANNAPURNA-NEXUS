from django.contrib import admin
from .models import Account, UserProfile

class AccountAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name', 'is_active')
    search_fields = ('email', 'first_name', 'last_name')

admin.site.register(Account, AccountAdmin)
admin.site.register(UserProfile)
