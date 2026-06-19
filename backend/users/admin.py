from django.contrib import admin
from .models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'device_id_hash', 'created_at', 'last_active_at')
    readonly_fields = ('device_id_hash', 'created_at', 'last_active_at')
    ordering = ('-last_active_at',)
