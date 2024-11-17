from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            hasattr(request.user, 'sub_admin_id') and
            request.user.is_active
        )