"""
Services — lógica de negocio desacoplada de los endpoints HTTP.
Permite reutilizar la lógica desde el chatbot (S2) y testearla aislada.
"""
from app.services import turnos_service, auth_service

__all__ = ["turnos_service", "auth_service"]
