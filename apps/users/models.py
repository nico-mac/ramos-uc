from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    last_name = models.CharField(max_length=150, null=True, blank=True)  # Permitir NULL y campo vacío
