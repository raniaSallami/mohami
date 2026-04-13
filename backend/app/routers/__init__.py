"""
API routers package.
Exports all route modules.
"""
from app.routers import (
    auth, users, cases, contracts, events, invoices, notifications, chat, admin,
    password_reset, device_security, admin_security, faculties
)


__all__ = [
    "auth",
    "password_reset",
    "device_security",
    "admin_security",
    "users",
    "cases",
    "contracts",
    "events",
    "invoices",
    "notifications",
    "chat",
    "admin",
    "faculties",
]

